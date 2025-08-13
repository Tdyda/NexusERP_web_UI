import React from "react";
import {createPortal} from "react-dom";

export default function ContextMenu({x, y, onClose, children, width = 220}) {
    const menuRef = React.useRef(null);

    React.useEffect(() => {
        const onDoc = (e) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target)) onClose?.();
        };
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    const vw = window.innerWidth, vh = window.innerHeight;
    const W = width, H = 8 + 40;
    const left = Math.max(8, Math.min(x, vw - W - 8));
    const top = Math.max(8, Math.min(y, vh - H - 8));

    return createPortal(
        <div
            ref={menuRef}
            className="bg-white border rounded shadow position-fixed"
            style={{top, left, width: W, zIndex: 2000}}
            role="menu"
        >
            <ul className="list-unstyled m-0 py-1">
                {children}
            </ul>
        </div>,
        document.body
    );
}

export function MenuItem({icon, children, onClick, disabled}) {
    return (
        <li>
            <button
                type="button"
                className="w-100 text-start btn btn-light border-0 rounded-0 px-3 py-2 d-flex align-items-center gap-2"
                style={{background: "transparent"}}
                onClick={onClick}
                disabled={disabled}
            >
                {icon && <i className={`bi ${icon}`}/>}
                <span>{children}</span>
            </button>
        </li>
    );
}

export function MenuDivider() {
    return <li>
        <hr className="dropdown-divider my-1"/>
    </li>;
}
