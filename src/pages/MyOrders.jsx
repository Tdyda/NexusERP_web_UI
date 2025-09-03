import React from "react";
import DataGrid from "../components/datagrid/DataGrid.jsx";
import { api } from "../api/axios.js";
import { useAuth } from "../auth/useAuth.js";
import ContextMenu, { MenuItem, MenuDivider } from "../common/ContextMenu.jsx";

export default function MyOrders() {
    const { user } = useAuth();
    const locationFromAuth = user?.locationCode ?? readLocationFromStorage();

    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState("");

    const [ctx, setCtx] = React.useState({ open: false, x: 0, y: 0, row: null });

    const STATUSES = ["Zamknięte", "Anulowane"];

    const columns = React.useMemo(
        () => [
            { key: "orderDate", header: "Data zamówienia", width: 200, sortable: true, render: (r) => formatDateTime(r.orderDate) },
            { key: "status", header: "Status", width: 170, sortable: true, render: (r) => statusBadge(r.status) },
            { key: "index", header: "Index", width: 180, sortable: true },
            { key: "name", header: "Nazwa", width: 320, sortable: true },
            { key: "quantity", header: "Ilość", width: 120, sortable: true, render: (r) => (typeof r.quantity === "number" ? r.quantity.toLocaleString() : r.quantity) },
            { key: "client", header: "Klient", width: 220, sortable: true },
            { key: "batchId", header: "Batch ID", width: 160, sortable: true },
        ],
        []
    );

    async function refresh() {
        if (!locationFromAuth) {
            setError("Brak kodu lokalizacji użytkownika (user.locationCode).");
            setData([]);
            return;
        }
        setError("");
        try {
            const res = await api.get("/orders", { params: { location: locationFromAuth } });
            const arr = Array.isArray(res.data) ? res.data : [];
            setData(arr);
        } catch (e) {
            setError(e?.response?.data?.message || e.message || "Nie udało się pobrać danych");
            setData([]);
        }
    }

    const didInit = React.useRef(false);
    React.useEffect(() => {
        if (!locationFromAuth || didInit.current) return;
        didInit.current = true;
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationFromAuth]);

    const fetchData = React.useCallback(
        async ({ page, pageSize, sort }) => {
            const list = Array.isArray(data) ? data.slice() : [];
            let sorted = list;
            if (sort?.key && sort?.dir) {
                const dir = sort.dir === "desc" ? -1 : 1;
                sorted = list.sort((a, b) => {
                    const av = sortVal(a, sort.key);
                    const bv = sortVal(b, sort.key);
                    if (av == null && bv == null) return 0;
                    if (av == null) return -1 * dir;
                    if (bv == null) return 1 * dir;
                    if (sort.key === "orderDate") return ((Date.parse(av) || 0) - (Date.parse(bv) || 0)) * dir;
                    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
                    return String(av).localeCompare(String(bv)) * dir;
                });
            }
            const start = Math.max(0, (page - 1) * pageSize);
            return { rows: sorted.slice(start, start + pageSize), total: sorted.length };
        },
        [data]
    );

    // --- Context menu handlers ---
    function openContextMenu(e, row) {
        setCtx({ open: true, x: e.clientX, y: e.clientY, row });
    }
    function closeContextMenu() {
        setCtx({ open: false, x: 0, y: 0, row: null });
    }
    async function changeStatus(newStatus) {
        const row = ctx.row;
        if (!row?.index) return;
        try {
            await api.put(
                "/orders",
                { status: newStatus },
                {
                    params: { index: row.index, status: row.status },
                    headers: { "Content-Type": "application/json" },
                }
            );
            setData(prev =>
                Array.isArray(prev)
                    ? prev.map(r =>
                        (row.id != null ? r.id === row.id : r.index === row.index && r.batchId === row.batchId)
                            ? { ...r, status: newStatus }
                            : r
                    )
                    : prev
            );
            closeContextMenu();
        } catch (e) {
            setError(e?.response?.data?.message || e.message || "Nie udało się zmienić statusu");
            closeContextMenu();
        }
    }

    return (
        <div className="container-fluid px-0">
            {/* Nagłówek + toolbox */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <h1 className="h4 mb-0">Moje zamówienia</h1>
                <span className="badge text-bg-light">
          Lokalizacja: <code className="ms-1">{locationFromAuth || "—"}</code>
        </span>
                <div className="ms-auto d-flex align-items-center gap-2">
                    {error && <div className="alert alert-danger py-1 px-2 mb-0">{error}</div>}
                    <button className="btn btn-sm btn-primary" onClick={refresh}>
                        <i className="bi bi-arrow-clockwise me-1" />
                        Odśwież
                    </button>
                </div>
            </div>

            {/* Grid */}
            <DataGrid
                id="my-orders"
                columns={columns.map((c) => ({ ...c, filter: undefined }))}
                fetchData={fetchData}
                initialPageSize={15}
                rowKey={(row, i) => row.id ?? `${row.index || "idx"}_${row.batchId || "batch"}_${i}`}
                onRowContextMenu={openContextMenu}
            />

            {/* Context menu */}
            {ctx.open && (
                <ContextMenu x={ctx.x} y={ctx.y} onClose={closeContextMenu}>
                    <li className="px-3 py-1 small text-secondary">
                        Zmień status: <code className="ms-1">{ctx.row?.index}</code>
                    </li>
                    <MenuDivider />
                    {STATUSES.map((s) => (
                        <MenuItem
                            key={s}
                            icon={ctx.row?.status === s ? "bi-check-circle-fill text-success" : "bi-circle"}
                            onClick={() => changeStatus(s)}
                            disabled={ctx.row?.status === s}
                        >
                            {s}
                        </MenuItem>
                    ))}
                </ContextMenu>
            )}
        </div>
    );
}

/* ---------- helpers ---------- */

function readLocationFromStorage() {
    try {
        const raw = localStorage.getItem("app_auth");
        if (!raw) return null;
        const obj = JSON.parse(raw);
        return obj?.user?.locationCode ?? null;
    } catch {
        return null;
    }
}

function formatDateTime(iso) {
    if (!iso) return "—";
    const t = Date.parse(iso);
    if (!t) return "—";
    return new Date(t).toLocaleString();
}

function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    let cls = "badge text-bg-secondary";
    if (s.includes("zako") || s.includes("done") || s.includes("complete") || s.includes("ukoń"))
        cls = "badge text-bg-success";
    if (s.includes("Zrealizowane przez magazyn"))
        cls = "badge text-bg-warning text-dark";
    if (s.includes("cancel") || s.includes("odrz") || s.includes("anul"))
        cls = "badge text-bg-danger";
    return <span className={cls}>{status || "—"}</span>;
}

function sortVal(row, key) {
    if (key === "quantity")
        return typeof row?.quantity === "number" ? row.quantity : parseFloat(row?.quantity ?? 0);
    return row?.[key];
}
