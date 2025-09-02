import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import NotAuthorized from "./pages/NotAuthorized.jsx";
import MaterialRequests from "./pages/MaterialRequests.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import { useAuth } from "./auth/useAuth.js";
import { setAuthHelpers } from "./api/authBridge.js";
import AppLayout from "./components/AppLayout.jsx";
import OrdersMex from "./pages/OrdersMex.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import OrdersHistory from "./pages/OrderHistory.jsx";

export default function App() {
    const { logout, setTokens, accessToken, refreshToken } = useAuth();

    useEffect(() => {
        setAuthHelpers({
            getAccessToken: () => accessToken,
            getRefreshToken: () => refreshToken,
            setTokens,
            logout,
        });
    }, [accessToken, refreshToken, setTokens, logout]);

    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/403" element={<NotAuthorized />} />

            {/* Wymagane logowanie (brak wymogu ról) */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* ⬇️ Wymaga przynajmniej jednej z ról: SK LUB admin */}
                    <Route element={<ProtectedRoute roles={['ROLE_ORDER_REQUESTS','ROLE_ADMIN']} />}>
                        <Route path="/material-requests" element={<MaterialRequests />} />
                        <Route path="/my-orders" element={<MyOrders />} />
                    </Route>

                    {/* ⬇️ Wymaga przynajmniej jednej z ról: ORDERS_MEX LUB admin */}
                    <Route element={<ProtectedRoute roles={['ROLE_ORDERS_MEX','ROLE_ADMIN']} />}>
                        <Route path="/orders-mex" element={<OrdersMex />} />
                        <Route path="/orders-history-completation" element={<OrdersHistory />} />
                    </Route>
                </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

function Home() {
    const { isAuthenticated, user } = useAuth();
    return (
        <div className="container py-4">
            <h1 className="h3 mb-3">Witaj w NexusERP</h1>
            <p className="lead">
                Status:{" "}
                {isAuthenticated
                    ? `zalogowany jako ${user?.email || user?.name}`
                    : "niezalogowany"}
            </p>
        </div>
    );
}
