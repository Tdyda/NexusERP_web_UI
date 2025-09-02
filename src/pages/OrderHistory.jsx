// src/pages/OrdersHistory.jsx
import React from "react";
import DataGrid from "../components/datagrid/DataGrid.jsx";
import { api } from "../api/axios.js";

export default function OrdersHistory() {
    const columns = React.useMemo(
        () => [
            { key: "index", header: "Indeks", width: 180, sortable: true, filter: { type: "text", placeholder: "Indeks" } },
            { key: "name", header: "Nazwa", width: 320, sortable: true, filter: { type: "text", placeholder: "Nazwa" } },
            {
                key: "orderDate",
                header: "Data zamówienia",
                width: 200,
                sortable: true,
                accessor: (r) => r.orderDate,
                render: (r) => formatDateTime(r.orderDate),
            },
            {
                key: "quantity",
                header: "Ilość",
                width: 120,
                sortable: true,
                accessor: (r) => r.quantity,
                render: (r) =>
                    typeof r.quantity === "number" ? r.quantity.toLocaleString() : r.quantity,
            },
            {
                key: "prodLine",
                header: "Jednostka",
                width: 160,
                sortable: true,
                accessor: (r) => r.prodLine,
            },
        ],
        []
    );

    const [refreshTick, setRefreshTick] = React.useState(0);

    const SORT_MAP = {
        index: "index",
        name: "name",
        orderDate: "orderDate",
        quantity: "quantity",
        prodLine: "prodLine",
    };

    const fetchData = React.useCallback(
        async ({ page, pageSize, sort, /* filters, */ signal }) => {
            const params = {
                page: Math.max(0, (page ?? 1) - 1),
                size: pageSize ?? 15,
            };

            if (sort?.key && sort?.dir) {
                const apiKey = SORT_MAP[sort.key] ?? sort.key;
                params.sort = `${apiKey},${sort.dir}`;
            }

            const res = await api.get("/orders/history", { params, signal });
            const data = res?.data ?? {};
            const content = Array.isArray(data.content) ? data.content : [];
            const total = Number.isFinite(data.totalElements) ? data.totalElements : content.length;

            return { rows: content, total };
        },
        [refreshTick]
    );

    const toolbarRight = React.useMemo(
        () => (
            <div className="d-flex gap-2">
                <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setRefreshTick((t) => t + 1)}
                    title="Odśwież"
                >
                    <i className="bi bi-arrow-clockwise me-1" /> Odśwież
                </button>
            </div>
        ),
        []
    );

    return (
        <div className="container-fluid px-0">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h1 className="h4 mb-0">Historia zamówień – kompletacja</h1>
            </div>

            <DataGrid
                id="orders-history"
                columns={columns}
                fetchData={fetchData}
                initialPageSize={15}
                selectable={false}
                rowKey={(row) => `${row.groupUUID}-${row.index}`}
                toolbarRight={toolbarRight}
            />
        </div>
    );
}

function formatDateTime(iso) {
    if (!iso) return "—";
    const t = Date.parse(iso);
    if (!t) return "—";
    return new Date(t).toLocaleString();
}
