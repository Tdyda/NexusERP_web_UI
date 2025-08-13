import React from "react";
import { NavLink } from "react-router-dom";

export default function SidebarNav({ onNavigate }) {
    return (
        <nav className="p-3">
            <div className="text-uppercase text-secondary fw-semibold small mb-2">Nawigacja</div>
            <ul className="list-unstyled d-flex flex-column gap-1">
                <li>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `d-flex align-items-center gap-2 sidebar-link ${isActive ? "active" : ""}`}
                        onClick={onNavigate}
                    >
                        <i className="bi bi-speedometer2"></i> Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/material-requests"
                        className={({ isActive }) => `d-flex align-items-center gap-2 sidebar-link ${isActive ? "active" : ""}`}
                        onClick={onNavigate}
                    >
                        <i className="bi bi-speedometer2"></i> MaterialRequests
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/orders-mex"
                        className={({ isActive }) => `d-flex align-items-center gap-2 sidebar-link ${isActive ? "active" : ""}`}
                        onClick={onNavigate}
                    >
                        <i className="bi bi-speedometer2"></i> Zamówienia mecalux
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/my-orders"
                        className={({ isActive }) => `d-flex align-items-center gap-2 sidebar-link ${isActive ? "active" : ""}`}
                        onClick={onNavigate}
                    >
                        <i className="bi bi-speedometer2"></i> Moje zamówienia
                    </NavLink>
                </li>
                {/* Przykładowe przyszłe sekcje (docelowo podmień na realne trasy) */}

                {/*<li>*/}
                {/*    <a className="d-flex align-items-center gap-2 sidebar-link" href="#">*/}
                {/*        <i className="bi bi-receipt"></i> Faktury*/}
                {/*    </a>*/}
                {/*</li>*/}
                {/*<li>*/}
                {/*    <a className="d-flex align-items-center gap-2 sidebar-link" href="#">*/}
                {/*        <i className="bi bi-people"></i> Klienci*/}
                {/*    </a>*/}
                {/*</li>*/}
                {/*<li>*/}
                {/*    <a className="d-flex align-items-center gap-2 sidebar-link" href="#">*/}
                {/*        <i className="bi bi-box-seam"></i> Produkty*/}
                {/*    </a>*/}
                {/*</li>*/}
                {/*<li>*/}
                {/*    <a className="d-flex align-items-center gap-2 sidebar-link" href="#">*/}
                {/*        <i className="bi bi-gear"></i> Ustawienia*/}
                {/*    </a>*/}
                {/*</li>*/}
            </ul>
        </nav>
    );
}
