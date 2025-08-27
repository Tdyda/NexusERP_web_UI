import React from "react";
import { api } from "../../api/axios.js";

function SubstituteList({ baseMaterialId, selectedIndex, onSelect }) {
    const [options, setOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        let active = true;
        const ctrl = new AbortController();

        setLoading(true);
        setError("");
        setOptions([]);

        api.get(`/substitutes/${encodeURIComponent(baseMaterialId)}`, { signal: ctrl.signal })
            .then(res => {
                if (!active) return;
                const subs = res.data || [];
                const all = [baseMaterialId, ...subs.map(s => s.substituteIndex)];
                setOptions(all);
            })
            .catch(e => {
                if (!active) return;
                setError("Błąd ładowania zamienników");
            })
            .finally(() => active && setLoading(false));

        return () => { active = false; ctrl.abort(); };
    }, [baseMaterialId]);

    if (loading) return <div className="text-secondary small">Ładowanie zamienników…</div>;
    if (error) return <div className="text-danger small">{error}</div>;

    return (
        <select
            className="form-select form-select-sm"
            value={selectedIndex}
            onChange={(e) => onSelect(baseMaterialId, e.target.value)}
        >
            {options.map(opt => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );
}

export default SubstituteList;
