import React from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/axios.js";

export default function MaterialRequestOrderModal({ batchId, onClose, onSubmitted }) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [detail, setDetail] = React.useState(null);
    const [selected, setSelected] = React.useState(new Set());
    const [comment, setComment] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        let active = true;
        const ctrl = new AbortController();
        setLoading(true);
        setError("");

        api.get(`material-requests/${encodeURIComponent(batchId)}`, { signal: ctrl.signal })
            .then(r => {
                if (!active) return;
                setDetail(r.data);
                setSelected(new Set());
            })
            .catch(e => {
                if (!active) return;
                setError(e?.response?.data?.message || e.message || "Błąd pobrania danych");
            })
            .finally(() => active && setLoading(false));

        return () => { active = false; ctrl.abort(); };
    }, [batchId]);

    React.useEffect(() => {
        function onKey(e) { if (e.key === "Escape") onClose?.(); }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    function toggleAll(e) {
        const checked = e.target.checked;
        if (!detail?.items) return;
        if (checked) setSelected(new Set(detail.items.map(i => i.materialId)));
        else setSelected(new Set());
    }
    function toggleOne(id, checked) {
        setSelected(prev => {
            const next = new Set(prev);
            if (checked) next.add(id); else next.delete(id);
            return next;
        });
    }

    async function submit() {
        try {
            setSubmitting(true);
            const materialIds = Array.from(selected);
            await api.post("/orders", { batchId, materialIds, comment });
            setSubmitting(false);
            onSubmitted?.();
            onClose?.();
        } catch (e) {
            setSubmitting(false);
            setError(e?.response?.data?.message || e.message || "Nie udało się wysłać zamówienia");
        }
    }

    return createPortal(
        <>
            {/* Backdrop */}
            <div className="modal-backdrop fade show"></div>

            {/* Modal */}
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                Zamówienie materiałów — <code className="ms-1">{batchId}</code>
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Zamknij"></button>
                        </div>

                        <div className="modal-body">
                            {loading && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="spinner-border spinner-border-sm"></span>
                                    <span>Ładowanie…</span>
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            {detail && !loading && !error && (
                                <>
                                    {/* Info top */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-sm-6">
                                            <div className="small text-secondary">Produkt finalny</div>
                                            <div className="fw-semibold">{detail.finalProductName} <span className="text-secondary">({detail.finalProductId})</span></div>
                                        </div>
                                        <div className="col-sm-3">
                                            <div className="small text-secondary">Etap</div>
                                            <div className="fw-semibold">{detail.stageId}</div>
                                        </div>
                                        <div className="col-sm-3">
                                            <div className="small text-secondary">Jednostka</div>
                                            <div className="fw-semibold">{detail.unitId}</div>
                                        </div>
                                    </div>

                                    {/* Checkboxy */}
                                    <div className="mb-2 d-flex align-items-center justify-content-between">
                                        <div className="fw-semibold">Pozycje materiałowe</div>
                                        <div className="form-check m-0">
                                            <input id="mr-check-all" className="form-check-input" type="checkbox"
                                                   onChange={toggleAll}
                                                   checked={detail.items?.length > 0 && selected.size === detail.items.length} />
                                            <label className="form-check-label" htmlFor="mr-check-all">Zaznacz wszystkie</label>
                                        </div>
                                    </div>

                                    <div className="border rounded p-2" style={{ maxHeight: 260, overflow: "auto" }}>
                                        {detail.items?.length ? (
                                            detail.items.map(it => {
                                                const id = `mri-${it.materialId}`;
                                                const checked = selected.has(it.materialId);
                                                return (
                                                    <div className="form-check" key={id}>
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={id}
                                                            checked={checked}
                                                            onChange={(e) => toggleOne(it.materialId, e.target.checked)}
                                                        />
                                                        <label className="form-check-label" htmlFor={id}>
                                                            <span className="fw-semibold">{it.materialId}</span> — {it.materialName}
                                                            {typeof it.amount === "number" && <span className="text-secondary"> (x{it.amount})</span>}
                                                        </label>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-secondary small">Brak pozycji.</div>
                                        )}
                                    </div>

                                    {/* Komentarz */}
                                    <div className="mt-3">
                                        <label className="form-label">Komentarz</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="np. priorytet, uwagi logistyczne…"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>
                                Anuluj
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={submit}
                                disabled={submitting || selected.size === 0}
                                title={selected.size === 0 ? "Zaznacz co najmniej jeden materiał" : ""}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" /> Wysyłanie…
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-send me-2" /> Wyślij zamówienie
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
