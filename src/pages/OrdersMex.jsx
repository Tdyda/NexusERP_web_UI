import React from "react";
import DataGrid from "../components/datagrid/DataGrid.jsx";
import { api } from "../api/axios.js";
import OrdersDetailModal from "../components/modals/OrdersDetailModal.jsx";
import ContextMenu, {MenuDivider, MenuItem} from "../common/ContextMenu.jsx";

/**
 * Widok: toolbox (czas + odśwież) + DataGrid z danymi z POST /orders/process-pending
 */
export default function OrdersMex() {
    const [timeHHMM, setTimeHHMM] = React.useState(() => roundNowTo15min());
    const [data, setData] = React.useState(null);
    const [lastError, setLastError] = React.useState("");
    const [detailIndex, setDetailIndex] = React.useState(null);
    const didInit = React.useRef(false);
    const [ctx, setCtx] = React.useState({ open: false, x: 0, y: 0, row: null });

    const STATUSES = ["Ukończone", "Przekazane", "Anulowane"];

    const columns = React.useMemo(() => [
        { key: "index", header: "Index", width: 180, sortable: true },
        {
            key: "orderDate",
            header: "Data zamówienia",
            width: 200,
            sortable: true,
            render: (r) => formatDateTime(r.orderDate),
        },
        {
            key: "status",
            header: "Status",
            width: 140,
            sortable: true,
            render: (r) => statusBadge(r.status),
        },
        {
            key: "hasComment",
            header: "Komentarz",
            width: 130,
            sortable: true,

            render: (r) => hasCommentPill(r.hasComment),
            accessor: (r) => (r.hasComment ? 1 : 0),
        },
        { key: "name", header: "Nazwa", width: 320, sortable: true },
        {
            key: "quantity",
            header: "Ilość",
            width: 120,
            sortable: true,
            render: (r) => (typeof r.quantity === "number" ? r.quantity.toLocaleString() : r.quantity),
        },
    ], []);


    async function refresh() {
        setLastError("");
        try {
            const body = {
                status: "Oczekujące",
                time: hhmmToHHmmss(timeHHMM),
            };
            const res = await api.post("/orders/process-pending", body);
            const arr = Array.isArray(res.data) ? res.data : [];
            setData(arr);
        } catch (e) {
            setLastError(e?.response?.data?.message || e.message || "Nie udało się pobrać danych");
            setData([]);
        }
    }

    const fetchData = React.useCallback(async ({ page, pageSize, sort /*, filters, signal*/ }) => {
        const list = Array.isArray(data) ? data.slice() : [];

        let sorted = list;
        if (sort?.key && sort?.dir) {
            const dir = sort.dir === "desc" ? -1 : 1;
            sorted = list.sort((a, b) => {
                const av = sortValue(a, sort.key, columns);
                const bv = sortValue(b, sort.key, columns);
                if (av == null && bv == null) return 0;
                if (av == null) return -1 * dir;
                if (bv == null) return 1 * dir;
                if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;

                if (sort.key === "orderDate") {
                    const ad = Date.parse(av);
                    const bd = Date.parse(bv);
                    return ((ad || 0) - (bd || 0)) * dir;
                }

                return String(av).localeCompare(String(bv)) * dir;
            });
        }

        const start = Math.max(0, (page - 1) * pageSize);
        const rows = sorted.slice(start, start + pageSize);
        return { rows, total: sorted.length };
    }, [data, columns]);

    React.useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            await api.put(`/orders`, { status: newStatus }, {
                params: { index: row.index, status: row.status },
                headers: { "Content-Type": "application/json" }
            });

            setData(prev => (Array.isArray(prev) ? prev.map(r => (r.index === row.index && r.batchId === row.batchId ? { ...r, status: newStatus } : r)) : prev));
            closeContextMenu();
        } catch (e) {
            setLastError(e?.response?.data?.message || e.message || "Nie udało się zmienić statusu");
            closeContextMenu();
        }
    }

    return (
        <div className="container-fluid px-0">
            {/* TOOLBOX */}
            <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
                <div>
                    <label className="form-label mb-1">Godzina</label>
                    <input
                        type="time"
                        className="form-control"
                        step={900}
                        value={timeHHMM}
                        onChange={(e) => setTimeHHMM(e.target.value)}
                        style={{ width: 160 }}
                    />
                </div>

                <div className="d-flex align-items-end mb-1">
                    <button className="btn btn-primary" onClick={refresh}>
                        <i className="bi bi-arrow-clockwise me-1" />
                        Odśwież
                    </button>
                </div>

                {lastError && (
                    <div className="ms-auto alert alert-danger py-1 px-2 mb-0">
                        {lastError}
                    </div>
                )}
            </div>

            {/* GRID */}
            <DataGrid
                id="orders-mex"
                columns={
                    columns.map(c => ({ ...c, filter: undefined }))
                }
                fetchData={fetchData}
                initialPageSize={15}
                rowKey={(row, i) => `${row.index || "no-index"}_${row.batchId || "no-batch"}_${i}`}
                onRowDoubleClick={(row) => row?.index && setDetailIndex(row.index)}
                onRowContextMenu={openContextMenu}
            />

            {/* MODAL SZCZEGÓŁÓW */}
            {detailIndex && (
                <OrdersDetailModal
                    index={detailIndex}
                    onClose={() => setDetailIndex(null)}
                />
            )}

            {/* CONTEXT MENU */}
            {ctx.open && (
                <ContextMenu x={ctx.x} y={ctx.y} onClose={closeContextMenu}>
                    <li className="px-3 py-1 small text-secondary">Zmień status: <code>{ctx.row?.index}</code></li>
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

/* ------------- helpers ------------- */

function roundNowTo15min() {
    const d = new Date();
    const mins = d.getMinutes();
    const floored = mins - (mins % 15);
    d.setMinutes(floored, 0, 0);
    return toHHMM(d);
}
function toHHMM(d) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}
function hhmmToHHmmss(hhmm) {
    if (!hhmm) return "00:00:00";
    return `${hhmm}:00`;
}
function formatDateTime(iso) {
    if (!iso) return "—";
    const t = Date.parse(iso);
    if (!t) return "—";
    const d = new Date(t);
    return d.toLocaleString();
}
function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    let cls = "badge text-bg-secondary";
    if (s.includes("new") || s.includes("oczek")) cls = "badge text-bg-warning text-dark";
    if (s.includes("progress") || s.includes("w toku")) cls = "badge text-bg-info text-dark";
    if (s.includes("przekazane")) cls = "badge text-bg-orange";
    if (s.includes("done") || s.includes("complete") || s.includes("zako")) cls = "badge text-bg-success";
    if (s.includes("cancel")) cls = "badge text-bg-danger";
    return <span className={cls}>{status || "—"}</span>;
}
function hasCommentPill(v) {
    return v
        ? <span className="badge rounded-pill text-bg-success">Komentarz</span>
        : <span className="badge rounded-pill text-bg-secondary">Brak</span>;
}
function sortValue(row, key, columns) {
    const col = columns.find(c => c.key === key);
    if (col?.accessor) {
        try { return col.accessor(row); } catch { return row?.[key]; }
    }
    if (key === "hasComment") return row?.hasComment ? 1 : 0;
    if (key === "quantity") return typeof row?.quantity === "number" ? row.quantity : parseFloat(row?.quantity ?? 0);
    return row?.[key];
}
