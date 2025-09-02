import React from "react";
import { Outlet, Link } from "react-router-dom";
import SidebarNav from "./SidebarNav.jsx";
import { useAuth } from "../auth/useAuth.js";
import ChangePasswordModal from "./modals/ChangePasswordModal.jsx";

export default function AppLayout() {
    const { user, logout } = useAuth();
    const [changePwOpen, setChangePwOpen] = React.useState(false);


    function closeOffcanvas() {
        const offcanvasEl = document.getElementById("appSidebar");
        if (!offcanvasEl) return;
        const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
        instance?.hide();
    }

    return (
        <div className="app-shell">
            {/* Top Navbar */}
            <nav className="navbar navbar-expand-lg bg-primary navbar-dark sticky-top">
                <div className="container-fluid">
                    <button
                        className="btn btn-primary d-lg-none me-2"
                        type="button"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#appSidebar"
                        aria-controls="appSidebar"
                        aria-label="Otwórz menu"
                    >
                        <i className="bi bi-list" />
                    </button>

                    <Link className="navbar-brand d-flex align-items-center gap-2" to="/dashboard">
                        <i className="bi bi-grid-3x3-gap-fill"></i>
                        <span>NexusERP</span>
                    </Link>

                    <div className="ms-auto">
                        <div className="dropdown">
                            <button className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                                <i className="bi bi-person-circle me-2" />
                                {user?.name || user?.email || "Użytkownik"}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li><button className="dropdown-item" type="button">Profil</button></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item" onClick={() => setChangePwOpen(true)}>
                                        <i className="bi bi-key me-2" /> Zmień hasło
                                    </button>
                                </li>
                                <li><button className="dropdown-item text-danger" onClick={logout}>Wyloguj</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Body */}
            <div className="container-fluid">
                <div className="row">
                    {/* Static sidebar on lg+ */}
                    <div className="d-none d-lg-block col-lg-2 col-xl-2 border-end bg-body sidebar-static">
                        <SidebarNav />
                    </div>

                    {/* Content */}
                    <div className="col-12 col-lg-10 col-xl-10 p-3 p-md-4">
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Offcanvas sidebar for mobile/tablet */}
            <div
                className="offcanvas offcanvas-start"
                tabIndex="-1"
                id="appSidebar"
                aria-labelledby="appSidebarLabel"
            >
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="appSidebarLabel">Menu</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body">
                    <SidebarNav onNavigate={closeOffcanvas} />
                </div>
            </div>

            {changePwOpen && (
                <ChangePasswordModal
                    onClose={() => setChangePwOpen(false)}
                    onSubmitted={() => {
                        setChangePwOpen(false);
                    }}
                />
            )}

        </div>
    );
}
