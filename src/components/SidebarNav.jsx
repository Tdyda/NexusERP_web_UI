import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function SidebarNav({ onNavigate }) {
    const { isAuthenticated, user } = useAuth();
    const userRoles = React.useMemo(
        () => (Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toLowerCase()) : []),
        [user]
    );

    const NAV_ITEMS = React.useMemo(
        () => [
            { to: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
            { to: "/material-requests", label: "MaterialRequests", icon: "bi-box", roles: ["ROLE_ORDER_REQUESTS", "ROLE_ADMIN"] },
            { to: "/orders-mex", label: "Zamówienia mecalux", icon: "bi-truck", roles: ["ROLE_ORDERS_MEX", "ROLE_ADMIN"] },
            { to: "/my-orders", label: "Moje zamówienia", icon: "bi-list-check", roles: ["ROLE_ORDER_REQUESTS", "ROLE_ADMIN"] },
        ],
        []
    );

    const hasAny = (required) => {
        if (!required || required.length === 0) return true;
        const requiredLc = required.map((r) => String(r).toLowerCase());
        return requiredLc.some((r) => userRoles.includes(r));
    };

    if (!isAuthenticated) return null;

    const visibleItems = NAV_ITEMS.filter((item) => hasAny(item.roles));

    return (
        <nav className="p-3">
            <div className="text-uppercase text-secondary fw-semibold small mb-2">Nawigacja</div>
            <ul className="list-unstyled d-flex flex-column gap-1">
                {visibleItems.map((item) => (
                    <li key={item.to}>
                        <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                                `d-flex align-items-center gap-2 sidebar-link ${isActive ? "active" : ""}`
                            }
                            onClick={onNavigate}
                            title={item.label}
                        >
                            <i className={`bi ${item.icon}`} />
                            {item.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
