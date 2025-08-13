import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext.js";

const STORAGE_KEY = "app_auth";

function readStorageOnce() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
function writeStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
}

export default function AuthProvider({ children }) {
    const boot = readStorageOnce();
    const [accessToken, setAccessToken] = useState(boot?.accessToken ?? null);
    const [refreshToken, setRefreshToken] = useState(boot?.refreshToken ?? null);
    const [user, setUser] = useState(boot?.user ?? null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (accessToken && refreshToken && user) {
            writeStorage({ accessToken, refreshToken, user });
        } else {
            clearStorage();
        }
    }, [accessToken, refreshToken, user]);

    const login = useCallback(async ({ email, password }) => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) throw new Error("Błędne dane logowania");
            const data = await res.json();
            setAccessToken(data.accessToken ?? null);
            setRefreshToken(data.refreshToken ?? null);
            setUser(data.user ?? null);
            return { ok: true };
        } catch (e) {
            console.error(e);
            return { ok: false, error: e.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        clearStorage();
    }, []);

    const value = useMemo(
        () => ({
            accessToken,
            refreshToken,
            user,
            loading,
            isAuthenticated: Boolean(accessToken && user),
            login,
            logout,
            setTokens: ({ accessToken: at, refreshToken: rt }) => {
                setAccessToken(at ?? null);
                setRefreshToken(rt ?? null);
            },
            setUser,
        }),
        [accessToken, refreshToken, user, loading, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
