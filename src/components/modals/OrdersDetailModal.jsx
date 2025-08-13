import React from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/axios.js";
import DataGrid from "../datagrid/DataGrid.jsx";

export default function OrdersDetailModal({ index, onClose }) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [rows, setRows] = React.useState([]);

    React.useEffect(() => {
        let active = true;
        const ctrl = new AbortController();
        setLoading(true);
        setError("");
        api.get("/orders", { params: { index }, signal: ctrl.signal })
            .then(r => { if (!active) return; setRows(Array.isArray(r.data) ? r.data : []); })
            .catch(e => { if (!active) return;
                setError(e?.response?.data?.message || e.message || "Błąd pobierania szczegółów"); })
            .finally(() => active && setLoading(false));
        return () => { active = false; ctrl.abort(); };
    }, [index]);

    React.useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const columns = React.useMemo(() => [
        { key: "index", header: "Index", width: 180, sortable: true },
        { key: "orderDate", header: "Data zamówienia", width: 200, sortable: true, render: r => formatDateTime(r.orderDate) },
        { key: "status", header: "Status", width: 180, sortable: true, render: r => statusBadge(r.status) },
        { key: "name", header: "Nazwa", width: 320, sortable: true },
        { key: "quantity", header: "Ilość", width: 120, sortable: true,
            render: r => (typeof r.quantity === "number" ? r.quantity.toLocaleString() : r.quantity) },
        { key: "prodLine", header: "Linia prod.", width: 140, sortable: true },
        { key: "client", header: "Klient", width: 220, sortable: true },
        { key: "batchId", header: "Batch ID", width: 160, sortable: true },
    ], []);

    const fetchData = React.useCallback(async ({ page, pageSize, sort }) => {
        const data = rows.slice();
        let sorted = data;
        if (sort?.key && sort?.dir) {
            const dir = sort.dir === "desc" ? -1 : 1;
            sorted = data.sort((a, b) => {
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
    }, [rows]);

    return createPortal(
        <>
            <div className="modal-backdrop fade show"></div>

            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Szczegóły zamówień — <code className="ms-1">{index}</code></h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Zamknij"></button>
                        </div>

                        <div className="modal-body">
                            {loading && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="spinner-border spinner-border-sm"></span>
                                    <span>Ładowanie…</span>
                                </div>
                            )}
                            {error && <div className="alert alert-danger">{error}</div>}
                            {!loading && !error && (
                                <DataGrid
                                    id={`orders-detail-${index}`}
                                    columns={columns.map(c => ({ ...c, filter: undefined }))}
                                    fetchData={fetchData}
                                    initialPageSize={10}
                                    rowKey={(row, i) => row.id ?? `${row.index}_${row.batchId}_${i}`}
                                />
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline-secondary" onClick={onClose}>Zamknij</button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

/* helpers */
function formatDateTime(iso) { if (!iso) return "—"; const t = Date.parse(iso); if (!t) return "—"; return new Date(t).toLocaleString(); }
function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    let cls = "badge text-bg-secondary";
    if (s.includes("oczek") || s.includes("new")) cls = "badge text-bg-warning text-dark";
    if (s.includes("trak") || s.includes("progress")) cls = "badge text-bg-info text-dark";
    if (s.includes("zako") || s.includes("done") || s.includes("complete")) cls = "badge text-bg-success";
    if (s.includes("cancel") || s.includes("odrz")) cls = "badge text-bg-danger";
    return <span className={cls}>{status || "—"}</span>;
}
function sortVal(row, key) {
    if (key === "quantity") return typeof row?.quantity === "number" ? row.quantity : parseFloat(row?.quantity ?? 0);
    return row?.[key];
}
