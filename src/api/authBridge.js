// Ten moduł przechowuje referencje do funkcji z kontekstu Auth
// Inicjalizujemy go w App.jsx (po utworzeniu providera)

let helpers = {
    getAccessToken: null,
    getRefreshToken: null,
    setTokens: null,
    logout: null,
};

export function setAuthHelpers(h) {
    helpers = { ...helpers, ...h };
}

export function getAuthHelpers() {
    return helpers;
}
