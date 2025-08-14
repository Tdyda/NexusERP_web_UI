import axios from "axios";
import { getAuthHelpers } from "./authBridge.js";
import qs from "qs";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    timeout: 15000,
    paramsSerializer: {
        serialize: (params) =>
            qs.stringify(params, {
                encode: true,
                encodeValuesOnly: false,
                arrayFormat: "repeat",
            }),
    },
});

function getAuth() {
    return getAuthHelpers();
}

// --- Request interceptor: dołącz Bearer ---
api.interceptors.request.use((config) => {
    const { getAccessToken } = getAuth();
    const token = getAccessToken?.();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Response interceptor: obsługa 401 + kolejka w czasie odświeżania ---
let isRefreshing = false;
let refreshQueue = [];

function enqueueRefresh(cbResolve, cbReject) {
    refreshQueue.push({ resolve: cbResolve, reject: cbReject });
}
function resolveQueue(token) {
    refreshQueue.forEach((p) => p.resolve(token));
    refreshQueue = [];
}
function rejectQueue(err) {
    refreshQueue.forEach((p) => p.reject(err));
    refreshQueue = [];
}

async function refreshTokenCall(refreshToken) {
    const resp = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
    );
    return resp.data;
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (!error.response || error.response.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        original._retry = true;
        original.headers = original.headers || {};

        const { getRefreshToken, setTokens, logout } = getAuth();
        const currentRefresh = getRefreshToken?.();

        if (!currentRefresh) {
            logout?.();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                enqueueRefresh(
                    (newAccess) => {
                        original.headers.Authorization = `Bearer ${newAccess}`;
                        resolve(api(original));
                    },
                    (err) => reject(err)
                );
            });
        }

        isRefreshing = true;
        try {
            const data = await refreshTokenCall(currentRefresh);
            const newAccess = data.accessToken;
            const newRefresh = data.refreshToken ?? currentRefresh;

            setTokens?.({ accessToken: newAccess, refreshToken: newRefresh });

            resolveQueue(newAccess);

            original.headers.Authorization = `Bearer ${newAccess}`;
            return api(original);
        } catch (e) {
            rejectQueue(e);
            getAuth().logout?.();
            return Promise.reject(e);
        } finally {
            isRefreshing = false;
        }
    }
);
