import React from "react";

export default function Toolbar({
                                    total,
                                    error,
                                    columns,
                                    layout,
                                    setLayout,
                                    onResetLayout,
                                    anyFilterActive,
                                    onClearAllFilters,
                                    right,
                                }) {
    return (
        <div className="dg-toolbar d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
                <strong>Wyniki:</strong>
                <span className="text-secondary">{Number(total || 0).toLocaleString()} rekordów</span>
                {error && <span className="badge text-bg-danger ms-2">{error}</span>}
                {anyFilterActive && (
                    <button className="btn btn-sm btn-outline-secondary ms-2" onClick={onClearAllFilters} title="Wyczyść wszystkie filtry">
                        <i className="bi bi-funnel-x me-1"></i> Wyczyść filtry
                    </button>
                )}
            </div>

            <div className="d-flex align-items-center gap-2">
                {/* Widoczność kolumn */}
                <div className="dropdown">
                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                        <i className="bi bi-layout-three-columns me-1" /> Kolumny
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: 240 }}>
                        {columns.map((c) => (
                            <li key={c.key} className="d-flex align-items-center justify-content-between py-1">
                                <label className="form-check-label flex-grow-1">{c.header}</label>
                                <div className="form-check form-switch m-0">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={!layout.hidden[c.key]}
                                        onChange={() => setLayout((l)=> ({...l, hidden: { ...l.hidden, [c.key]: !l.hidden[c.key] }}))}
                                    />
                                </div>
                            </li>
                        ))}
                        <li><hr className="dropdown-divider" /></li>
                        <li className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={onResetLayout}>
                                Reset układu
                            </button>
                        </li>
                    </ul>
                </div>

                {right}
            </div>
        </div>
    );
}
