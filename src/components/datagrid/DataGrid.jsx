import React from "react";
import "./DataGrid.css";
import { useLocalStorage } from "../../utils/useLocalStorage.js";
import Toolbar from "./Toolbar.jsx";
import HeaderCell from "./HeaderCell.jsx";

/**
 * Kolumny:
 * {
 *   key, header, width?, minWidth?, sortable?,
 *   accessor?, render?,
 *   filter?: {
 *     type?: "text"|"select"|"number"|"numberRange"|"date"|"dateRange",
 *     placeholder?: string,
 *     options?: Array<{label,value}>,
 *     values?: Array<string>                     // do listy checkboxów
 *     fetchValues?: (signal)=>Promise<string[]>  // lazy unique values
 *   }
 * }
 *
 * fetchData({ page, pageSize, sort, filters, signal }) => { rows, total }
 *  - filters to słownik, gdzie wartość może być:
 *    null | string | number | {from,to} | { in: string[] } | { op, value }
 */

export default function DataGrid({
                                     id,
                                     columns,
                                     fetchData,
                                     initialPageSize = 15,
                                     rowKey = (row, idx) => row.id ?? idx,
                                     onRowClick,
                                     className = "",
                                     toolbarRight,
                                 }) {
    if (!id) throw new Error("DataGrid: prop `id` jest wymagany.");

    // ── Persist układu
    const [layout, setLayout] = useLocalStorage(`dg:${id}:layout`, {
        order: columns.map(c => c.key),
        widths: {},
        hidden: {},
    });

    // Kolejność i widoczność
    const orderedColumns = React.useMemo(() => {
        const byKey = new Map(columns.map(c => [c.key, c]));
        const inOrder = layout.order.map(k => byKey.get(k)).filter(Boolean);
        const missing = columns.filter(c => !layout.order.includes(c.key));
        return [...inOrder, ...missing].filter(c => !layout.hidden[c.key]);
    }, [columns, layout.order, layout.hidden]);

    // ── Filtry, sort, paging
    const [filters, setFilters] = React.useState(() =>
        Object.fromEntries(columns.map(c => [c.key, null]))
    );
    const [sort, setSort] = React.useState(null); // {key, dir}
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(initialPageSize);

    // ── Dane
    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    // ── Debounce filtrów
    const debouncedFilters = useDebounced(filters, 300);

    // ── Pobieranie
    React.useEffect(() => {
        let active = true;
        const ctrl = new AbortController();
        setLoading(true);
        setError("");

        fetchData({ page, pageSize, sort, filters: debouncedFilters, signal: ctrl.signal })
            .then(({ rows, total }) => {
                if (!active) return;
                setRows(rows || []);
                setTotal(total || 0);
            })
            .catch((e) => {
                if (!active) return;
                if (e.name === "CanceledError" || e.name === "AbortError") return;
                setError(e?.message || "Błąd pobierania danych");
            })
            .finally(() => active && setLoading(false));

        return () => { active = false; ctrl.abort(); };
    }, [page, pageSize, sort, debouncedFilters, fetchData]);

    // ── Sort toggle
    function toggleSort(col) {
        if (!col.sortable) return;
        setPage(1);
        setSort((prev) => {
            if (!prev || prev.key !== col.key) return { key: col.key, dir: "asc" };
            if (prev.dir === "asc") return { key: col.key, dir: "desc" };
            return null;
        });
    }

    // ── Ustawienie filtra dla kolumny
    function applyColumnFilter(colKey, value) {
        setPage(1);
        setFilters((f) => ({ ...f, [colKey]: normalizeEmpty(value) }));
    }
    function clearAllFilters() {
        setPage(1);
        setFilters(Object.fromEntries(columns.map(c => [c.key, null])));
    }
    const anyFilterActive = React.useMemo(
        () => Object.values(filters).some(v => v != null && !(typeof v === "string" && v.trim() === "")),
        [filters]
    );

    // ── Resize / DnD
    const tableRef = React.useRef(null);
    const [isResizingKey, setIsResizingKey] = React.useState(null);
    const [dragKey, setDragKey] = React.useState(null);

    function startResize(e, col) {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const th = tableRef.current?.querySelector(`th[data-col="${col.key}"]`);
        const startWidth = (th?.offsetWidth) || layout.widths[col.key] || col.width || 150;

        function onMove(ev) {
            const dx = ev.clientX - startX;
            const newWidth = Math.max(col.minWidth || 80, startWidth + dx);
            setIsResizingKey(col.key);
            setLayout((l) => ({ ...l, widths: { ...l.widths, [col.key]: Math.round(newWidth) } }));
        }
        function onUp() {
            setIsResizingKey(null);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    function onHeaderDragStart(e, key) {
        setDragKey(key);
        e.dataTransfer.effectAllowed = "move";
    }
    function onHeaderDragOver(e, overKey) {
        if (!dragKey || dragKey === overKey) return;
        e.preventDefault();
    }
    function onHeaderDrop(e, dropKey) {
        e.preventDefault();
        if (!dragKey || dragKey === dropKey) return;
        setLayout((l) => {
            const order = [...l.order];
            const from = order.indexOf(dragKey);
            const to = order.indexOf(dropKey);
            if (from === -1 || to === -1) return l;
            order.splice(to, 0, order.splice(from, 1)[0]);
            return { ...l, order };
        });
        setDragKey(null);
    }
    function onHeaderDragEnd() { setDragKey(null); }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className={`dg-wrapper position-relative ${isResizingKey ? "dg-resizing" : ""} ${className}`}>
            <Toolbar
                total={total}
                error={error}
                onResetLayout={() => setLayout({ order: columns.map(c => c.key), widths: {}, hidden: {} })}
                columns={columns}
                layout={layout}
                setLayout={setLayout}
                anyFilterActive={anyFilterActive}
                onClearAllFilters={clearAllFilters}
                right={toolbarRight}
            />

            <div className="table-responsive">
                <table ref={tableRef} className="dg-table table table-sm mb-0">
                    <thead>
                    <tr>
                        {orderedColumns.map((col) => {
                            const width = layout.widths[col.key] || col.width || undefined;
                            const sorted = sort?.key === col.key ? sort.dir : null;
                            const isFiltered = filters[col.key] != null && !(typeof filters[col.key] === "string" && filters[col.key].trim() === "");
                            return (
                                <HeaderCell
                                    key={col.key}
                                    col={col}
                                    width={width}
                                    sorted={sorted}
                                    isFiltered={isFiltered}
                                    onSort={() => toggleSort(col)}
                                    onResizeStart={(e) => startResize(e, col)}
                                    dragKey={dragKey}
                                    onDragStart={(e) => onHeaderDragStart(e, col.key)}
                                    onDragOver={(e) => onHeaderDragOver(e, col.key)}
                                    onDrop={(e) => onHeaderDrop(e, col.key)}
                                    onDragEnd={onHeaderDragEnd}
                                    value={filters[col.key]}
                                    onApply={(v) => applyColumnFilter(col.key, v)}
                                    onClear={() => applyColumnFilter(col.key, null)}
                                    hidden={!!layout.hidden[col.key]}
                                />
                            );
                        })}
                    </tr>
                    </thead>

                    <tbody>
                    {rows.length === 0 && !loading && (
                        <tr>
                            <td colSpan={orderedColumns.length} className="dg-empty">
                                Brak danych do wyświetlenia.
                            </td>
                        </tr>
                    )}
                    {rows.map((row, ri) => (
                        <tr
                            key={rowKey(row, ri)}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            style={{ cursor: onRowClick ? "pointer" : "default" }}
                        >
                            {orderedColumns.map((col) => (
                                <td key={col.key} style={{ width: layout.widths[col.key] || col.width || undefined }}>
                                    {col.render ? col.render(row) : defaultRender(col, row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / paginacja */}
            <div className="dg-footer d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-secondary">Strona</span>
                    <div className="input-group input-group-sm" style={{ width: 110 }}>
                        <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(1)} title="Pierwsza">«</button>
                        <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} title="Poprzednia">‹</button>
                        <input type="number" className="form-control text-center" value={page} min={1} max={totalPages}
                               onChange={(e) => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))} />
                        <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} title="Następna">›</button>
                        <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(totalPages)} title="Ostatnia">»</button>
                    </div>
                    <span className="text-secondary">/ {totalPages}</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="text-secondary">Na stronę:</span>
                    <select className="form-select form-select-sm" style={{ width: 90 }} value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                        {[10,15,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            {loading && (
                <div className="dg-loading-overlay">
                    <div className="d-flex align-items-center gap-2 bg-white border rounded px-3 py-2">
                        <span className="spinner-border spinner-border-sm" />
                        <span className="small">Ładowanie…</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function defaultRender(col, row) {
    try {
        if (col.accessor) return toDisplay(col.accessor(row));
        return toDisplay(row?.[col.key]);
    } catch { return ""; }
}
function toDisplay(v) {
    if (v == null) return "";
    if (v instanceof Date) return v.toLocaleDateString();
    if (typeof v === "number") return v.toLocaleString();
    return String(v);
}
function useDebounced(value, delay) {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
    return debounced;
}
function normalizeEmpty(v) {
    if (v == null) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    if (typeof v === "object" && "from" in v && "to" in v && !v.from && !v.to) return null;
    if (typeof v === "object" && "in" in v && Array.isArray(v.in) && v.in.length === 0) return null;
    if (typeof v === "object" && "op" in v && (v.value == null || v.value === "")) return null;
    return v;
}
