import React from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/axios.js";
import SubstituteList from "../substitute/SubstituteList";

export default function MaterialRequestBulkOrderModal({ batchIds, onClose, onSubmitted }) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [details, setDetails] = React.useState([]);
    // chosen: Map<batchId, Map<baseId, any>> – przechowuje które pozycje w danym batchu są zaznaczone
    const [chosen, setChosen] = React.useState(new Map());
    // globalSelection: Map<baseId, selectedId> – JEDNO źródło prawdy dla wyboru zamiennika danego indeksu
    const [globalSelection, setGlobalSelection] = React.useState(new Map());
    const [comment, setComment] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        let active = true;
        const ctrl = new AbortController();
        setLoading(true); setError("");
        Promise.all(
            batchIds.map(bid => api.get(`/material-requests/${encodeURIComponent(bid)}`, { signal: ctrl.signal }).then(r => r.data))
        )
            .then(arr => {
                if (!active) return;
                setDetails(arr);
                // Inicjalizacja: wszystkie pozycje zaznaczone, a globalny wybór = baseId
                const initChosen = new Map();
                const initGlobal = new Map();
                arr.forEach(d => {
                    const inner = new Map();
                    (d.items || []).forEach(i => {
                        inner.set(i.materialId, true); // wartość nieistotna – ważne, że klucz istnieje
                        if (!initGlobal.has(i.materialId)) initGlobal.set(i.materialId, i.materialId);
                    });
                    initChosen.set(d.batchId, inner);
                });
                setChosen(initChosen);
                setGlobalSelection(initGlobal);
            })
            .catch(e => { if (!active) return; setError(e?.response?.data?.message || e.message || "Błąd pobierania danych"); })
            .finally(() => active && setLoading(false));
        return () => { active = false; ctrl.abort(); };
    }, [batchIds]);

    React.useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    function toggleOne(batchId, baseId, checked) {
        setChosen(prev => {
            const next = new Map(prev);
            const inner = new Map(next.get(batchId) || []);
            if (checked) {
                inner.set(baseId, true);
                // Jeśli globalSelection nie ma jeszcze wpisu (np. nowy baseId), ustaw domyślnie na baseId
                if (!globalSelection.has(baseId)) {
                    setGlobalSelection(gs => new Map(gs).set(baseId, baseId));
                }
            } else {
                inner.delete(baseId);
            }
            next.set(batchId, inner);
            return next;
        });
    }

    // Zmiana wyboru zamiennika ma się propagować do wszystkich batchy z tym samym baseId
    function handleBulkSelect(batchId, baseId, selectedId) {
        // 1) aktualizujemy globalne źródło prawdy
        setGlobalSelection(prev => new Map(prev).set(baseId, selectedId));
        // 2) (opcjonalnie) nie musimy aktualizować chosen, bo render odczytuje selectedId z globalSelection
        //    jednak dla spójności można zapewnić, że jeśli pozycja jest zaznaczona w danym batchu,
        //    to pozostaje zaznaczona – nic nie robimy z chosen.
    }

    async function submit() {
        try {
            setSubmitting(true);
            const payloads = details.map(d => {
                const inner = chosen.get(d.batchId) || new Map();
                // budujemy listę materialIds mapując KAŻDY wybrany baseId przez globalSelection
                const materialIds = Array.from(inner.keys()).map(baseId => globalSelection.get(baseId) || baseId);
                return { batchId: d.batchId, materialIds, comment };
            }).filter(p => p.materialIds.length > 0);

            if (payloads.length === 0) { setError("Nie wybrano żadnych materiałów."); setSubmitting(false); return; }

            await Promise.all(payloads.map(p => api.post("/orders", p)));
            setSubmitting(false);
            onSubmitted?.(payloads.length);
            onClose?.();
        } catch (e) {
            setSubmitting(false);
            setError(e?.response?.data?.message || e.message || "Nie udało się wysłać zamówień");
        }
    }

    return createPortal(
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Zbiorcze zamówienie ({batchIds.length})</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Zamknij"></button>
                        </div>

                        <div className="modal-body">
                            {loading && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="spinner-border spinner-border-sm" />
                                    <span>Ładowanie…</span>
                                </div>
                            )}
                            {error && <div className="alert alert-danger">{error}</div>}

                            {!loading && !error && details.map(d => {
                                const inner = chosen.get(d.batchId) || new Map();
                                const selectedCount = inner.size;
                                const total = d.items?.length || 0;
                                return (
                                    <div key={d.batchId} className="mb-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="fw-semibold">
                                                Batch <code className="ms-1">{d.batchId}</code> — {d.finalProductName} <span className="text-secondary">({d.finalProductId})</span>
                                            </div>
                                            {/* Zaznacz wszystkie – działa tylko na checkboxy (zaznaczenie pozycji), nie zmienia wybranych zamienników */}
                                            <div className="form-check m-0">
                                                <input id={`all-${d.batchId}`} className="form-check-input" type="checkbox"
                                                       checked={selectedCount > 0 && selectedCount === total}
                                                       onChange={(e) => {
                                                           const checked = e.target.checked;
                                                           setChosen(prev => {
                                                               const next = new Map(prev);
                                                               const newInner = new Map();
                                                               if (checked) {
                                                                   (d.items || []).forEach(i => {
                                                                       newInner.set(i.materialId, true);
                                                                       if (!globalSelection.has(i.materialId)) {
                                                                           // zabezpieczenie: jeśli nie istnieje globalny wybór, ustaw baseId
                                                                           setGlobalSelection(gs => new Map(gs).set(i.materialId, i.materialId));
                                                                       }
                                                                   });
                                                               }
                                                               next.set(d.batchId, newInner);
                                                               return next;
                                                           });
                                                       }} />
                                                <label className="form-check-label" htmlFor={`all-${d.batchId}`}>Zaznacz wszystkie</label>
                                            </div>
                                        </div>

                                        <div className="border rounded p-2 mt-2" style={{ maxHeight: 240, overflow: "auto" }}>
                                            {total === 0
                                                ? <div className="text-secondary small">Brak pozycji.</div>
                                                : d.items.map(it => {
                                                    const base = it.materialId;
                                                    const isChecked = inner.has(base);
                                                    const selectedId = globalSelection.get(base) || base; // odczyt z GLOBALNEGO wyboru
                                                    const checkboxId = `chk-${d.batchId}-${base}`;
                                                    return (
                                                        <div className="form-check" key={checkboxId}>
                                                            <input className="form-check-input" type="checkbox" id={checkboxId}
                                                                   checked={isChecked}
                                                                   onChange={(e) => toggleOne(d.batchId, base, e.target.checked)} />
                                                            <label className="form-check-label w-100" htmlFor={checkboxId}>
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="me-2 flex-grow-1">
                                                                        <SubstituteList
                                                                            baseMaterialId={base}
                                                                            selectedIndex={selectedId}
                                                                            onSelect={(bId, sel) => handleBulkSelect(d.batchId, bId, sel)}
                                                                        />
                                                                    </div>
                                                                    <span className="text-secondary">x{it.amount}</span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                );
                            })}

                            {!loading && !error && (
                                <div className="mt-3">
                                    <label className="form-label">Komentarz (zostanie dodany do każdego zamówienia)</label>
                                    <textarea className="form-control" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>Anuluj</button>
                            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
                                {submitting ? (<><span className="spinner-border spinner-border-sm me-2" /> Wysyłanie…</>) : (<>Wyślij zamówienie</>)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
