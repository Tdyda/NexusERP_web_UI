import React from "react";
import { Link } from "react-router-dom";

export default function NotAuthorized() {
    return (
        <div className="container py-5 text-center">
            <h1 className="display-6 mb-3">403 — Brak uprawnień</h1>
            <p className="lead">Nie masz uprawnień do wyświetlenia tej strony.</p>
            <div className="d-inline-flex gap-2 mt-3">
                <Link to="/" className="btn btn-primary">
                    <i className="bi bi-house-door me-1" />
                    Strona główna
                </Link>
                <Link to="/login" className="btn btn-outline-secondary">
                    <i className="bi bi-box-arrow-in-right me-1" />
                    Zaloguj jako inny użytkownik
                </Link>
            </div>
        </div>
    );
}
