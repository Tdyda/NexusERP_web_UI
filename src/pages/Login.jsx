import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function Login() {
    const { login, loading } = useAuth();
    const [email, setEmail] = useState("demo@acme.io");
    const [password, setPassword] = useState("demo123");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        const res = await login({ email, password });
        if (res.ok) {
            navigate(from, { replace: true });
        } else {
            setError(res.error || "Nie udało się zalogować");
        }
    }

    return (
        <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="row w-100 justify-content-center">
                <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
                    <div className="text-center mb-4">
                        <div className="d-inline-flex align-items-center gap-2">
                            <i className="bi bi-grid-3x3-gap-fill fs-3 text-primary"></i>
                            <h1 className="h4 m-0 fw-bold">NexusERP</h1>
                        </div>
                        <div className="text-secondary mt-2">Zaloguj się do panelu</div>
                    </div>

                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                                {error && (
                                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        <div>{error}</div>
                                    </div>
                                )}

                                <div className="form-floating mb-3">
                                    <input
                                        id="email"
                                        type="email"
                                        className="form-control"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <label htmlFor="email">Email</label>
                                </div>

                                <div className="form-floating mb-2">
                                    <input
                                        id="password"
                                        type="password"
                                        className="form-control"
                                        placeholder="Hasło"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <label htmlFor="password">Hasło</label>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="remember" />
                                        <label className="form-check-label" htmlFor="remember">Zapamiętaj mnie</label>
                                    </div>
                                    <a href="#" className="small text-decoration-none">Nie pamiętasz hasła?</a>
                                </div>

                                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Logowanie...
                                        </>
                                    ) : (
                                        "Zaloguj"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <p className="text-center text-secondary mt-3 small">
                        © {new Date().getFullYear()} NexusERP
                    </p>
                </div>
            </div>
        </div>
    );
}
