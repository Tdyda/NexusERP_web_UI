import React from "react";
import DataGrid from "../components/datagrid/DataGrid.jsx";
import { api } from "../api/axios.js";
import MaterialRequestOrderModal from "../components/modals/MaterialRequestOrderModal.jsx";
import MaterialRequestBulkOrderModal from "../components/modals/MaterialRequestBulkOrderModal.jsx";


const BASE = "/material-requests";

function statusBadge(status) {
    const s = (status || "").toLowerCase();
    let cls = "badge text-bg-secondary";
    if (s.includes("new") || s.includes("created")) cls = "badge text-bg-secondary";
    if (s.includes("in") || s.includes("proc")) cls = "badge text-bg-warning text-dark";
    if (s.includes("done") || s.includes("completed")) cls = "badge text-bg-success";
    if (s.includes("cancel") || s.includes("reject")) cls = "badge text-bg-danger";
    return <span className={cls}>{status || "—"}</span>;
}

export default function MaterialRequests() {
    const columns = React.useMemo(
        () => [
            {
                key: "batchId",
                header: "Batch ID",
                width: 160,
                sortable: true,
                filter: { type: "text", placeholder: "Szukaj batch…" },
            },
            {
                key: "stageId",
                header: "Etap (stage)",
                width: 140,
                sortable: true,
                filter: { type: "text", placeholder: "np. S-12" },
            },
            {
                key: "finalProductId",
                header: "Produkt ID",
                width: 160,
                sortable: true,
                filter: { type: "text" },
            },
            {
                key: "finalProductName",
                header: "Produkt",
                width: 220,
                sortable: true,
                filter: { type: "text", placeholder: "Nazwa produktu" },
            },
            {
                key: "unitId",
                header: "Jednostka",
                width: 120,
                sortable: true,
                filter: { type: "text" },
            },
            {
                key: "status",
                header: "Status",
                width: 140,
                sortable: true,
                filter: { type: "text", placeholder: "np. NEW/IN_PROGRESS…" },
                render: (r) => statusBadge(r.status),
            },
            {
                key: "shippingDate",
                header: "Wysyłka",
                width: 150,
                sortable: true,
                filter: { type: "dateRange" },
                render: (r) => formatDate(r.shippingDate),
            },
            {
                key: "deliveryDate",
                header: "Dostawa",
                width: 150,
                sortable: true,
                filter: { type: "dateRange" },
                render: (r) => formatDate(r.deliveryDate),
            },
            {
                key: "releaseDate",
                header: "Wydanie",
                width: 150,
                sortable: true,
                filter: { type: "dateRange" },
                render: (r) => formatDate(r.releaseDate),
            },
            {
                key: "client",
                header: "Klient",
                width: 160,
                sortable: true,
                filter: { type: "text", placeholder: "Szukaj klienta…" },
            },
            {
                key: "itemsCount",
                header: "Pozycje",
                width: 110,
                sortable: false,
                filter: { type: "numberRange" },
                accessor: (r) => (Array.isArray(r.items) ? r.items.length : 0),
                render: (r) => (
                    <span className="badge text-bg-light">
            {(Array.isArray(r.items) ? r.items.length : 0).toLocaleString()} szt.
          </span>
                ),
            },
            {
                key: "actions",
                header: "",
                width: 80,
                filter: { type: "text" },
                render: (r) => (
                    <div className="d-flex gap-1 justify-content-end">
                        <button
                            className="btn btn-sm btn-light"
                            title="Szczegóły"
                            onClick={() => console.log("MaterialRequest details", r)}
                        >
                            <i className="bi bi-eye" />
                        </button>
                    </div>
                ),
            },
        ],
        []
    );

    const [refreshTick, setRefreshTick] = React.useState(0);

    const fetchData = React.useCallback(
        async ({ page, pageSize, sort, filters, signal }) => {
            const params = {
                page: Math.max(0, (page || 1) - 1),
                size: pageSize,
                ...toQueryFilters(filters),
            };
            if (sort?.key && sort?.dir) {
                params.sort = `${sort.key},${sort.dir}`;
            }

            const res = await api.get(BASE, { params, signal });

            const items = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
            const totalHeader = res.headers?.["x-total-count"];
            const total = totalHeader ? parseInt(totalHeader, 10) || items.length : items.length;

            return { rows: items, total };
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [refreshTick]
    );

    // ——— Single-order modal (dblclick) ———
    const [orderBatchId, setOrderBatchId] = React.useState(null);
    const openOrderModal = React.useCallback((row) => {
        if (!row?.batchId) return;
        setOrderBatchId(row.batchId);
    }, []);

    // ——— Multi-select + bulk order ———
    const [selectedRows, setSelectedRows] = React.useState([]);
    const handleSelectionChange = React.useCallback((keys, rows) => {
        setSelectedRows(rows);
    }, []);
    const rowKeyFn = React.useCallback((row) => row.batchId, []);
    const [bulkOpen, setBulkOpen] = React.useState(false);

    const toolbarRight = React.useMemo(
        () => (
            <div className="d-flex align-items-center gap-2">
                <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setRefreshTick((t) => t + 1)}
                    title="Odśwież widok"
                >
                    <i className="bi bi-arrow-clockwise me-1"></i> Odśwież
                </button>

                <button
                    className="btn btn-sm btn-primary"
                    disabled={selectedRows.length === 0}
                    onClick={() => setBulkOpen(true)}
                    title={selectedRows.length ? `Zamów dla ${selectedRows.length} MR` : "Zaznacz MR, aby zamówić"}
                >
                    <i className="bi bi-bag-plus me-1" />
                    Zamów {selectedRows.length > 0 ? `(${selectedRows.length})` : ""}
                </button>
            </div>
        ),
        [selectedRows.length]
    );

    return (
        <div className="container-fluid px-0">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h1 className="h4 mb-0">Zapotrzebowania materiałowe</h1>
                <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary"
                            onClick={() => setRefreshTick((t) => t + 1)}
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i> Odśwież
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => console.log("create new MR")}>
                        <i className="bi bi-plus-lg me-1"></i> Nowe
                    </button>
                </div>
            </div>

            <DataGrid
                id="material-requests"
                columns={columns}
                fetchData={fetchData}
                initialPageSize={15}
                onRowDoubleClick={openOrderModal}
                selectable
                rowKey={rowKeyFn}
                onSelectionChange={handleSelectionChange}
                rowClassName={(row, isSelected) => (isSelected ? "dg-row-selected" : "")}
                toolbarRight={toolbarRight}
            />

            {orderBatchId && (
                <MaterialRequestOrderModal
                    batchId={orderBatchId}
                    onClose={() => setOrderBatchId(null)}
                    onSubmitted={() => {
                        setOrderBatchId(null);
                        setRefreshTick((t) => t + 1);
                    }}
                />
            )}

            {bulkOpen && (
                <MaterialRequestBulkOrderModal
                    batchIds={selectedRows.map((r) => r.batchId)}
                    onClose={() => setBulkOpen(false)}
                    onSubmitted={() => {
                        setBulkOpen(false);
                        setSelectedRows([]);
                        setRefreshTick((t) => t + 1);
                    }}
                />
            )}
        </div>
    );
}

/* ——— helpers ——— */
function formatDate(iso) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleDateString();
    } catch {
        return "—";
    }
}

function toQueryFilters(filters) {
    const out = {};
    const OP = { contains: "CONTAINS", eq: "EQ", gt: "GT", gte: "GTE", lt: "LT", lte: "LTE", between: "BETWEEN" };

    for (const [k, v] of Object.entries(filters || {})) {
        if (v == null || v === "") continue;

        if (typeof v === "object" && "in" in v && Array.isArray(v.in) && v.in.length) {
            out[`f.${k}`] = { op: "IN", value: v.in };
            continue;
        }

        if (typeof v === "object" && (v.op === "between" || ("from" in v || "to" in v))) {
            const hasFrom = !!v.from;
            const hasTo = !!v.to;

            if (hasFrom && !hasTo) {
                const fromIso = isDateInput(v.from) ? isoStartOfDay(v.from) : v.from;
                out[`f.${k}`] = { op: OP.gte, value: fromIso };
                continue;
            }
            if (!hasFrom && hasTo) {
                const toIso = isDateInput(v.to) ? isoEndOfDay(v.to) : v.to;
                out[`f.${k}`] = { op: OP.lte, value: toIso };
                continue;
            }
            if (!hasFrom && !hasTo) continue;

            const fromIso = isDateInput(v.from) ? isoStartOfDay(v.from) : v.from;
            const toIso = isDateInput(v.to) ? isoEndOfDay(v.to) : v.to;
            out[`f.${k}`] = { op: OP.between, from: fromIso, to: toIso };
            continue;
        }

        if (typeof v === "object" && "op" in v && "value" in v) {
            const op = OP[v.op];
            if (!op || v.value == null || v.value === "") continue;

            if (isDateInput(v.value)) {
                if (op === OP.eq) {
                    out[`f.${k}`] = { op: OP.between, from: isoStartOfDay(v.value), to: isoEndOfDay(v.value) };
                } else {
                    out[`f.${k}`] = {
                        op,
                        value: op === OP.lte || op === OP.lt ? isoEndOfDay(v.value) : isoStartOfDay(v.value),
                    };
                }
            } else {
                out[`f.${k}`] = { op, value: v.value };
            }
            continue;
        }

        out[`f.${k}`] = { op: OP.eq, value: isDateInput(v) ? isoStartOfDay(v) : v };
    }

    return out;
}

function isDateInput(val) {
    return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
}
function isoStartOfDay(yyyyMmDd) {
    return `${yyyyMmDd}T00:00:00Z`;
}
function isoEndOfDay(yyyyMmDd) {
    return `${yyyyMmDd}T23:59:59.999Z`;
}
