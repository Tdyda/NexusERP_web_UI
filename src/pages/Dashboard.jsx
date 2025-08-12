import React from "react";
import { useAuth } from "../auth/useAuth.js";
import { authApi } from "../api/authApi.js";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [me, setMe] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState("");

    React.useEffect(() => {
        let active = true;
        setLoading(true);
        authApi
            .me()
            .then((r) => active && setMe(r.data))
            .catch((e) => active && setErr(e?.response?.data?.message || e.message))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="container py-4">
            {/* Nagłówek */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">Dashboard</h1>
                    <div className="text-secondary">
                        Witaj, <b>{user?.name || user?.email || "Użytkowniku"}</b> 👋
                    </div>
                </div>
                <button className="btn btn-outline-danger btn-sm" onClick={logout}>
                    <i className="bi bi-box-arrow-right me-1"></i> Wyloguj
                </button>
            </div>

            {/* Profil */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white">
                    <h5 className="mb-0">Profil z <code>/auth/me</code></h5>
                </div>
                <div className="card-body">
                    {loading && (
                        <div className="d-flex align-items-center">
                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                            Ładowanie…
                        </div>
                    )}
                    {err && (
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {err}
                        </div>
                    )}
                    {me && (
                        <pre className="bg-dark text-success p-3 rounded small mb-0">
              {JSON.stringify(me, null, 2)}
            </pre>
                    )}
                </div>
            </div>
        </div>
    );
}
