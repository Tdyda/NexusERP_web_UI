import React from "react";
import {createPortal} from "react-dom";

/**
 * value:
 *  - null
 *  - { in: string[] }
 *  - { from, to }
 *  - { op, value }
 *  - scalar
 */
export default function FilterPopup({col, value, onApply, onClear, onClose, anchorRef}) {
    const type = col.filter?.type || "text";
    const POPOVER_WIDTH = col.filter?.popupWidth || 280;
    const GAP = 6;

    const [values, setValues] = React.useState(col.filter?.values || []);
    const [valuesLoading, setValuesLoading] = React.useState(false);
    const [selected, setSelected] = React.useState(
        Array.isArray(value?.in) ? new Set(value.in) : new Set()
    );

    const [op, setOp] = React.useState(value?.op || defaultOp(type));
    const [val1, setVal1] = React.useState(getInitialVal1(value));
    const [val2, setVal2] = React.useState(getInitialVal2(value));
    const isRange = (op) => op === "between" || type === "dateRange" || type === "numberRange";

    const popRef = React.useRef(null);
    const [style, setStyle] = React.useState({top: 0, left: 0, transformOrigin: "top"});

    React.useEffect(() => {
        let active = true;
        position();
        const handle = () => position();
        const anchor = anchorRef?.current;

        window.addEventListener("resize", handle, {passive: true});
        window.addEventListener("scroll", handle, {passive: true});
        const scrollers = getScrollParents(anchor);
        scrollers.forEach(el => el.addEventListener("scroll", handle, {passive: true}));

        return () => {
            active = false;
            window.removeEventListener("resize", handle);
            window.removeEventListener("scroll", handle);
            scrollers.forEach(el => el.removeEventListener("scroll", handle));
        };

        function position() {
            if (!active) return;
            const btn = anchorRef?.current;
            const pop = popRef.current;
            if (!btn || !pop) return;

            const br = btn.getBoundingClientRect();
            const ph = pop.offsetHeight || 360;
            const pw = POPOVER_WIDTH;

            let top = br.bottom + GAP;
            let left = br.right - pw;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            left = clamp(left, 8, vw - pw - 8);

            if (top + ph + 8 > vh && br.top - GAP - ph > 8) {
                top = br.top - GAP - ph;
                setStyle({top, left, transformOrigin: "bottom"});
            } else {
                setStyle({top, left, transformOrigin: "top"});
            }
        }
    }, [anchorRef, POPOVER_WIDTH]);

    React.useEffect(() => {
        let active = true;
        const fetcher = col.filter?.fetchValues;
        if (!fetcher || (values && values.length)) return;
        setValuesLoading(true);
        const ctrl = new AbortController();
        fetcher(ctrl.signal)
            .then(arr => {
                if (active) setValues(Array.isArray(arr) ? arr : []);
            })
            .catch(() => {
            })
            .finally(() => active && setValuesLoading(false));
        return () => {
            active = false;
            ctrl.abort();
        };
    }, [col.filter]);

    React.useEffect(() => {
        function onDocMouseDown(e) {
            const pop = popRef.current;
            const anchor = anchorRef?.current;
            if (!pop) return;
            if (pop.contains(e.target)) return;
            if (anchor && anchor.contains(e.target)) return;
            onClose?.();
        }

        function onKey(e) {
            if (e.key === "Escape") onClose?.();
        }

        document.addEventListener("mousedown", onDocMouseDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [onClose, anchorRef]);

    const allRef = React.useRef(null);
    React.useEffect(() => {
        if (!allRef.current) return;
        const partial = selected.size > 0 && selected.size < values.length;
        allRef.current.indeterminate = partial;
    }, [selected, values]);

    function toggleAll(e) {
        if (e.target.checked) setSelected(new Set(values));
        else setSelected(new Set());
    }

    function toggleOne(v, checked) {
        setSelected(prev => {
            const next = new Set(prev);
            if (checked) next.add(v); else next.delete(v);
            return next;
        });
    }

    function applyClick() {
        if (selected.size > 0) return onApply({in: Array.from(selected)});

        if (type === "numberRange" || type === "dateRange" || op === "between") {
            const from = val1 || null;
            const to = val2 || null;
            if (!from && !to) return onApply(null);
            return onApply({from, to});
        }

        if (op === "equals" && val1) return onApply(val1);
        if (val1) return onApply({op, value: val1});
        return onApply(null);
    }

    return createPortal(
        <div
            ref={popRef}
            className={`dg-filter-popover dg-filter-popover--portal ${isRange(op) ? "dg-wide" : ""}`}
            role="dialog"
            aria-label={`Filtr: ${col.header}`}
            style={{top: `${style.top}px`, left: `${style.left}px`, transformOrigin: style.transformOrigin}}
        >
            {/* lista wartości */}
            <div className="dg-values">
                <div className="form-check mb-2">
                    <input
                        ref={allRef}
                        id={`dg-select-all-${col.key}`}
                        className="form-check-input"
                        type="checkbox"
                        checked={selected.size > 0 && selected.size === values.length && values.length > 0}
                        onChange={toggleAll}
                    />
                    <label htmlFor={`dg-select-all-${col.key}`} className="form-check-label">Wybierz wszystkie</label>
                </div>
                <div className="d-flex flex-column gap-1" style={{maxHeight: 150, overflow: "auto"}}>
                    {valuesLoading && <div className="text-secondary small">Ładowanie wartości…</div>}
                    {!valuesLoading && values.length === 0 &&
                        <div className="text-secondary small">Brak listy wartości.</div>}
                    {values.map(v => {
                        const id = `dg-val-${col.key}-${String(v)}`;
                        return (
                            <div className="form-check" key={id}>
                                <input
                                    id={id}
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selected.has(v)}
                                    onChange={(e) => toggleOne(v, e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor={id}>{String(v)}</label>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* warunki */}
            <div className="dg-conds">
                <div className="text-secondary small mb-2">Pokaż wiersze z wartością</div>

                <div className="dg-cond-row">
                    <select
                        className="form-select form-select-sm dg-op-select"
                        value={op}
                        onChange={(e) => setOp(e.target.value)}
                    >
                        {operatorsForType(type).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    {isRange(op) ? (
                        <div className="dg-range">
                            <input
                                type={type.startsWith("date") ? "date" : "number"}
                                className="form-control form-control-sm"
                                value={val1 || ""}
                                onChange={(e) => setVal1(e.target.value)}
                            />
                            <span className="small text-secondary">i</span>
                            <input
                                type={type.startsWith("date") ? "date" : "number"}
                                className="form-control form-control-sm"
                                value={val2 || ""}
                                onChange={(e) => setVal2(e.target.value)}
                            />
                        </div>
                    ) : (
                        <input
                            type={type === "date" ? "date" : (type === "number" ? "number" : "text")}
                            className="form-control form-control-sm"
                            value={val1 || ""}
                            onChange={(e) => setVal1(e.target.value)}
                        />
                    )}
                </div>
            </div>

            <div className="dg-actions">
                <button className="btn btn-sm btn-outline-secondary" onClick={onClear}>
                    <i className="bi bi-eraser me-1"/> Wyczyść
                </button>
                <button className="btn btn-sm btn-primary" onClick={applyClick}>
                    <i className="bi bi-funnel me-1"/> Filtruj
                </button>
                <button className="btn btn-sm btn-light" onClick={onClose}>Zamknij</button>
            </div>
        </div>,
        document.body
    );
}

/* -------------- helpers -------------- */

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function defaultOp(type) {
    if (type === "number" || type === "date") return "eq";
    if (type === "numberRange" || type === "dateRange") return "between";
    return "contains";
}

function operatorsForType(type) {
    if (type === "number" || type === "date") {
        return [
            {value: "eq", label: "Równy"},
            {value: "gt", label: "Większy niż"},
            {value: "gte", label: "Większy lub równy"},
            {value: "lt", label: "Mniejszy niż"},
            {value: "lte", label: "Mniejszy lub równy"},
            {value: "between", label: "Pomiędzy"},
        ];
    }
    if (type === "numberRange" || type === "dateRange") {
        return [{value: "between", label: "Pomiędzy"}];
    }
    return [
        {value: "contains", label: "Zawierające"},
        {value: "eq", label: "Równe"},
    ];
}

function renderInput(type, op, val, setVal) {
    if (type === "date" || type === "dateRange" || op === "between") {
        return <input type="date" className="form-control form-control-sm" value={val || ""}
                      onChange={(e) => setVal(e.target.value)}/>;
    }
    if (type === "number" || type === "numberRange") {
        return <input type="number" className="form-control form-control-sm" value={val || ""}
                      onChange={(e) => setVal(e.target.value)}/>;
    }
    return <input type="text" className="form-control form-control-sm" value={val || ""}
                  onChange={(e) => setVal(e.target.value)}/>;
}

function renderSecondInput(type, val2, setVal2) {
    return (
        <>
            <span className="align-self-center small text-secondary">i</span>
            {type === "date" || type === "dateRange"
                ? <input type="date" className="form-control form-control-sm" value={val2 || ""}
                         onChange={(e) => setVal2(e.target.value)}/>
                : <input type="number" className="form-control form-control-sm" value={val2 || ""}
                         onChange={(e) => setVal2(e.target.value)}/>
            }
        </>
    );
}

function getInitialVal1(value) {
    if (!value) return "";
    if (typeof value === "object") {
        if ("from" in value) return value.from ?? "";
        if ("value" in value) return value.value ?? "";
    }
    if (typeof value === "string" || typeof value === "number") return value;
    return "";
}

function getInitialVal2(value) {
    if (!value) return "";
    if (typeof value === "object" && "to" in value) return value.to ?? "";
    return "";
}

function getScrollParents(el) {
    const out = [];
    let node = el?.parentElement;
    while (node && node !== document.body) {
        const s = getComputedStyle(node);
        const overflow = `${s.overflow}${s.overflowY}${s.overflowX}`;
        if (/(auto|scroll|overlay)/.test(overflow)) out.push(node);
        node = node.parentElement;
    }
    out.push(document);
    return out;
}
