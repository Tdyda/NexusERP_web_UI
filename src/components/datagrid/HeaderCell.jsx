import React from "react";
import FilterPopup from "./FilterPopup.jsx";

export default function HeaderCell({
                                       col,
                                       width,
                                       sorted,
                                       isFiltered,
                                       onSort,
                                       onResizeStart,
                                       dragKey,
                                       onDragStart, onDragOver, onDrop, onDragEnd,
                                       value,
                                       onApply,
                                       onClear,
                                   }) {
    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef(null);

    return (
        <th
            data-col={col.key}
            scope="col"
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className={`${dragKey === col.key ? "dg-header-dragging" : ""} ${sorted ? "table-active" : ""}`}
            style={{ width }}
        >
            <div className="dg-header-cell">
        <span onClick={onSort} style={{ cursor: col.sortable ? "pointer" : "default" }}>
          {col.header}
            {col.sortable && (
                <span className="dg-sort-icon ms-1">
              {sorted === "asc" && <i className="bi bi-sort-down-alt" />}
                    {sorted === "desc" && <i className="bi bi-sort-down" />}
                    {!sorted && <i className="bi bi-arrow-down-up opacity-50" />}
            </span>
            )}
        </span>

                <button
                    ref={btnRef}
                    type="button"
                    className={`dg-filter-btn ${isFiltered ? "dg-filter-active" : ""}`}
                    aria-expanded={open}
                    onClick={() => setOpen(v => !v)}
                    title={isFiltered ? "Filtr aktywny" : "Filtruj"}
                >
                    <i className={`bi ${isFiltered ? "bi-funnel-fill" : "bi-funnel"}`} />
                </button>

                <span className="dg-resizer" onMouseDown={onResizeStart} />

                {/* Popup montowany w body (portal) */}
                {open && (
                    <FilterPopup
                        col={col}
                        anchorRef={btnRef}
                        value={value}
                        onApply={(v) => { onApply(v); setOpen(false); }}
                        onClear={() => { onClear(); setOpen(false); }}
                        onClose={() => setOpen(false)}
                    />
                )}
            </div>
        </th>
    );
}
