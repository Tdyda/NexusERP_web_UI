import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth.js";

/**
 * Użycie:
 * <Route element={<ProtectedRoute roles={['admin']} />}>
 *   <Route path="/panel" element={<Panel />} />
 * </Route>
 */
export default function ProtectedRoute({ roles }) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (roles && roles.length > 0) {
        const hasRole = user?.roles?.some((r) => roles.includes(r));
        if (!hasRole) {
            return <Navigate to="/404" replace />;
        }
    }

    return <Outlet />;
}
