// src/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth.js";

/**
 * <ProtectedRoute roles={['SK','admin']} />  // wystarczy JEDNA z tych ról
 * <ProtectedRoute roles={['SK','admin']} mode="all" /> // wymagaj obu ról
 */
export default function ProtectedRoute({ roles, mode = "any" }) {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="d-inline-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm"/>
                    <span>Sprawdzanie uprawnień…</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!roles || roles.length === 0) return <Outlet />;

    const userRoles = (Array.isArray(user?.roles) ? user.roles : []).map((r) => String(r).toLowerCase());
    const required = roles.map((r) => String(r).toLowerCase());

    const has =
        mode === "all"
            ? required.every((r) => userRoles.includes(r))
            : required.some((r) => userRoles.includes(r));

    if (!has) return <Navigate to="/403" replace />;
    return <Outlet />;
}
