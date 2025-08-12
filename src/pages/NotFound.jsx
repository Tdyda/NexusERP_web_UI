import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "70vh" }}>
            <div className="text-center">
                <div className="mb-3 text-primary">
                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "3rem" }}></i>
                </div>
                <h1 className="display-5 fw-bold mb-2">404</h1>
                <p className="lead text-secondary">Ups! Strona nie istnieje.</p>

                <div className="d-flex gap-2 justify-content-center mt-3">
                    <Link to="/" className="btn btn-primary">
                        <i className="bi bi-arrow-left me-2"></i>Wróć na stronę główną
                    </Link>
                    <Link to="/dashboard" className="btn btn-outline-secondary">
                        <i className="bi bi-speedometer2 me-2"></i>Dashboard
                    </Link>
                </div>

                <p className="text-secondary small mt-4 mb-0">
                    Jeśli uważasz, że to błąd — skontaktuj się z administratorem.
                </p>
            </div>
        </div>
    );
}
