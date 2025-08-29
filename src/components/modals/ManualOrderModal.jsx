import React from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/axios.js";

/**
 * Modal: ręczne utworzenie zamówienia spoza listy.
 * Pola: index, comment (opcjonalny), quantity, locationCode, client, batchId
 */
export default function ManualOrderModal({ onClose, onSubmitted }) {
    const [form, setForm] = React.useState({
        index: "",
        comment: "",
        quantity: "",
        locationCode: "",
        client: "",
        batchId: "",
    });
    const [errors, setErrors] = React.useState({});
    const [submitting, setSubmitting] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState("");

    // A11y: ESC + focus trap
    const modalRef = React.useRef(null);
    React.useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") onClose?.();
            if (e.key === "Tab" && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll(
                    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                const active = document.activeElement;
                if (e.shiftKey) {
                    if (active === first || !modalRef.current.contains(active)) {
                        last.focus();
                        e.preventDefault();
                    }
                } else {
                    if (active === last || !modalRef.current.contains(active)) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    React.useEffect(() => {
        const input = modalRef.current?.querySelector("input, select, textarea, button");
        input?.focus();
    }, []);

    function updateField(e) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    }

    function validate() {
        const e = {};
        if (!form.index?.trim()) e.index = "Wymagane.";
        const q = Number(form.quantity);
        if (!form.quantity?.toString().trim()) e.quantity = "Wymagane.";
        else if (!Number.isFinite(q) || q <= 0) e.quantity = "Ilość musi być > 0.";
        if (!form.locationCode?.trim()) e.locationCode = "Wymagane.";
        if (!form.client?.trim()) e.client = "Wymagane.";
        if (!form.batchId?.trim()) e.batchId = "Wymagane.";
        return e;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg("");
        const v = validate();
        setErrors(v);
        if (Object.keys(v).length > 0) return;

        const payload = {
            index: form.index.trim(),
            comment: form.comment?.trim() || "",
            quantity: Number(form.quantity),
            locationCode: form.locationCode.trim(),
            client: form.client.trim(),
            batchId: form.batchId.trim(),
        };

        try {
            setSubmitting(true);
            await api.post("/api/orders/create-manual", payload);
            onSubmitted?.();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Nie udało się utworzyć zamówienia.";
            setErrorMsg(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return createPortal(
        <>
            {/* Backdrop */}
            <div className="modal-backdrop fade show" />

            {/* Modal */}
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content" ref={modalRef} aria-labelledby="manualOrderTitle">
                        <div className="modal-header">
                            <h5 className="modal-title" id="manualOrderTitle">
                                Nowe zamówienie (spoza listy)
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Zamknij"></button>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="modal-body">
                                {errorMsg && (
                                    <div className="alert alert-danger" role="alert">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="row g-3">
                                    <div className="col-sm-6">
                                        <label className="form-label">Index *</label>
                                        <input
                                            type="text"
                                            name="index"
                                            className={"form-control" + (errors.index ? " is-invalid" : "")}
                                            value={form.index}
                                            onChange={updateField}
                                            required
                                        />
                                        {errors.index && <div className="invalid-feedback">{errors.index}</div>}
                                    </div>

                                    <div className="col-sm-6">
                                        <label className="form-label">Ilość *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            inputMode="decimal"
                                            className={"form-control" + (errors.quantity ? " is-invalid" : "")}
                                            value={form.quantity}
                                            onChange={updateField}
                                            min="1"
                                            step="1"
                                            required
                                        />
                                        {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                                    </div>

                                    <div className="col-sm-6">
                                        <label className="form-label">Kod lokalizacji *</label>
                                        <input
                                            type="text"
                                            name="locationCode"
                                            className={"form-control" + (errors.locationCode ? " is-invalid" : "")}
                                            value={form.locationCode}
                                            onChange={updateField}
                                            required
                                        />
                                        {errors.locationCode && <div className="invalid-feedback">{errors.locationCode}</div>}
                                    </div>

                                    <div className="col-sm-6">
                                        <label className="form-label">Klient *</label>
                                        <input
                                            type="text"
                                            name="client"
                                            className={"form-control" + (errors.client ? " is-invalid" : "")}
                                            value={form.client}
                                            onChange={updateField}
                                            required
                                        />
                                        {errors.client && <div className="invalid-feedback">{errors.client}</div>}
                                    </div>

                                    <div className="col-sm-6">
                                        <label className="form-label">Batch ID *</label>
                                        <input
                                            type="text"
                                            name="batchId"
                                            className={"form-control" + (errors.batchId ? " is-invalid" : "")}
                                            value={form.batchId}
                                            onChange={updateField}
                                            required
                                        />
                                        {errors.batchId && <div className="invalid-feedback">{errors.batchId}</div>}
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label">Komentarz (opcjonalny)</label>
                                        <textarea
                                            name="comment"
                                            className="form-control"
                                            value={form.comment}
                                            onChange={updateField}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>
                                    Anuluj
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Zapisywanie…
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send me-2" /> Utwórz zamówienie
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
