import React from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/axios.js";

/**
 * Modal do zmiany hasła.
 * Wysyła: POST /users/change-password
 * Body: { username (z localStorage: app_auth.user.username), oldPassword, newPassword }
 */
export default function ChangePasswordModal({ onClose, onSubmitted }) {
    const [form, setForm] = React.useState({
        oldP: "",
        newP: "",
        confirmP: "",
    });
    const [errors, setErrors] = React.useState({});
    const [submitting, setSubmitting] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState("");

    // username z localStorage: app_auth -> user -> username
    const username = React.useMemo(() => {
        try {
            const raw = localStorage.getItem("app_auth");
            if (!raw) return "";
            const parsed = JSON.parse(raw);
            return parsed?.user?.username ?? "";
        } catch {
            return "";
        }
    }, []);

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
                        last.focus(); e.preventDefault();
                    }
                } else {
                    if (active === last || !modalRef.current.contains(active)) {
                        first.focus(); e.preventDefault();
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
        setForm(f => ({ ...f, [name]: value }));
    }

    function validate() {
        const e = {};
        if (!username) e.username = "Brak nazwy użytkownika (localStorage).";
        if (!form.oldP?.trim()) e.oldP = "Wymagane.";
        if (!form.newP?.trim()) e.newP = "Wymagane.";
        if (!form.confirmP?.trim()) e.confirmP = "Wymagane.";
        if (form.newP && form.confirmP && form.newP !== form.confirmP) {
            e.confirmP = "Hasła muszą być takie same.";
        }
        return e;
    }

    function getServerErrorMessage(err) {
        const d = err?.response?.data;
        if (!d) return err?.message || "Nie udało się zmienić hasła.";
        if (typeof d === "string") return d;
        if (d?.errors) {
            if (typeof d.errors === "string") return d.errors;
            if (typeof d.errors === "object") {
                const vals = Object.values(d.errors);
                const flat = Array.isArray(vals) ? vals.flat() : vals;
                const firstText = flat.find(v => typeof v === "string");
                if (firstText) return firstText;
            }
        }
        if (typeof d.message === "string" && d.message) return d.message;
        if (typeof d.error === "string" && d.error && d.error !== "Internal Server Error") return d.error;
        return err?.message || "Nie udało się zmienić hasła.";
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg("");
        const v = validate();
        setErrors(v);
        if (Object.keys(v).length > 0) return;

        const payload = {
            username,
            oldPassword: form.oldP,
            newPassword: form.newP,
        };

        try {
            setSubmitting(true);
            await api.post("/users/change-password", payload);
            onSubmitted?.();
            onClose?.();
        } catch (err) {
            setErrorMsg(getServerErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    return createPortal(
        <>
            <div className="modal-backdrop fade show" />
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content" ref={modalRef} aria-labelledby="changePasswordTitle">
                        <div className="modal-header">
                            <h5 className="modal-title" id="changePasswordTitle">Zmień hasło</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Zamknij"></button>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="modal-body">
                                {errorMsg && <div className="alert alert-danger" role="alert">{errorMsg}</div>}

                                <div className="mb-3">
                                    <label className="form-label">Użytkownik</label>
                                    <input
                                        type="text"
                                        className={"form-control" + (errors.username ? " is-invalid" : "")}
                                        value={username}
                                        readOnly
                                        disabled
                                    />
                                    {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Obecne hasło *</label>
                                    <input
                                        type="password"
                                        name="oldP"
                                        className={"form-control" + (errors.oldP ? " is-invalid" : "")}
                                        value={form.oldP}
                                        onChange={updateField}
                                        required
                                        autoComplete="current-password"
                                    />
                                    {errors.oldP && <div className="invalid-feedback">{errors.oldP}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Nowe hasło *</label>
                                    <input
                                        type="password"
                                        name="newP"
                                        className={"form-control" + (errors.newP ? " is-invalid" : "")}
                                        value={form.newP}
                                        onChange={updateField}
                                        required
                                        autoComplete="new-password"
                                    />
                                    {errors.newP && <div className="invalid-feedback">{errors.newP}</div>}
                                </div>

                                <div className="mb-1">
                                    <label className="form-label">Potwierdź hasło *</label>
                                    <input
                                        type="password"
                                        name="confirmP"
                                        className={"form-control" + (errors.confirmP ? " is-invalid" : "")}
                                        value={form.confirmP}
                                        onChange={updateField}
                                        required
                                        autoComplete="new-password"
                                    />
                                    {errors.confirmP && <div className="invalid-feedback">{errors.confirmP}</div>}
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
                                            <i className="bi bi-key me-2" /> Zmień hasło
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
