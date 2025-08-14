import React from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/axios.js";

export default function MaterialRequestBulkOrderModal({ batchIds, onClose, onSubmitted }) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [details, setDetails] = React.useState([]);
    const [chosen, setChosen] = React.useState(new Map());
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
                const m = new Map();
                arr.forEach(d => m.set(d.batchId, new Set(d.items?.map(i => i.materialId) || [])));
                setChosen(m);
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

    function toggleAll(bid, checked) {
        setChosen(prev => {
            const next = new Map(prev);
            if (checked) {
                const det = details.find(d => d.batchId === bid);
                next.set(bid, new Set((det?.items || []).map(i => i.materialId)));
            } else {
                next.set(bid, new Set());
            }
            return next;
        });
    }
    function toggleOne(bid, id, checked) {
        setChosen(prev => {
            const next = new Map(prev);
            const set = new Set(next.get(bid) || []);
            if (checked) set.add(id); else set.delete(id);
            next.set(bid, set);
            return next;
        });
    }

    async function submit() {
        try {
            setSubmitting(true);
            const payloads = details.map(d => {
                const materialIds = Array.from(chosen.get(d.batchId) || []);
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
                                const selectedCount = (chosen.get(d.batchId)?.size) || 0;
                                const total = d.items?.length || 0;
                                return (
                                    <div key={d.batchId} className="mb-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="fw-semibold">
                                                Batch <code className="ms-1">{d.batchId}</code> — {d.finalProductName} <span className="text-secondary">({d.finalProductId})</span>
                                            </div>
                                            <div className="form-check m-0">
                                                <input id={`all-${d.batchId}`} className="form-check-input" type="checkbox"
                                                       checked={selectedCount > 0 && selectedCount === total}
                                                       onChange={(e) => toggleAll(d.batchId, e.target.checked)} />
                                                <label className="form-check-label" htmlFor={`all-${d.batchId}`}>Zaznacz wszystkie</label>
                                            </div>
                                        </div>

                                        <div className="border rounded p-2 mt-2" style={{ maxHeight: 240, overflow: "auto" }}>
                                            {total === 0
                                                ? <div className="text-secondary small">Brak pozycji.</div>
                                                : d.items.map(it => {
                                                    const id = `chk-${d.batchId}-${it.materialId}`;
                                                    const checked = chosen.get(d.batchId)?.has(it.materialId) || false;
                                                    return (
                                                        <div className="form-check" key={id}>
                                                            <input className="form-check-input" type="checkbox" id={id}
                                                                   checked={checked}
                                                                   onChange={(e) => toggleOne(d.batchId, it.materialId, e.target.checked)} />
                                                            <label className="form-check-label" htmlFor={id}>
                                                                <span className="fw-semibold">{it.materialId}</span> — {it.materialName}
                                                                {typeof it.amount === "number" && <span className="text-secondary"> (x{it.amount})</span>}
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
