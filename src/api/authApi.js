import { api } from "./axios.js";

export const authApi = {
    me: () => api.get("/auth/me"),
    changePassword: (payload) => api.post("/auth/change-password", payload),
    // login: (email, password) => api.post("/auth/login", { email, password }),
    // logout: () => api.post("/auth/logout"),
};
