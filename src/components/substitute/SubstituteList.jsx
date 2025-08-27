function SubstituteList({ baseMaterialId }) {
    const [subs, setSubs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        let active = true;
        const ctrl = new AbortController();

        setLoading(true);
        setError("");
        setSubs([]);

        api.get(`/substitutes/${encodeURIComponent(baseMaterialId)}`, { signal: ctrl.signal })
            .then(res => {
                if (!active) return;
                setSubs(res.data || []);
            })
            .catch(e => {
                if (!active) return;
                setError("Błąd ładowania zamienników");
            })
            .finally(() => active && setLoading(false));

        return () => { active = false; ctrl.abort(); };
    }, [baseMaterialId]);

    return (
        <div className="small">
            <div className="fw-semibold">{baseMaterialId}</div>
            {loading ? (
                <span className="text-secondary ms-2">Ładowanie zamienników…</span>
            ) : error ? (
                <span className="text-danger ms-2">{error}</span>
            ) : subs.length > 0 ? (
                <ul className="ms-3 mb-0">
                    {subs.map((s, i) => (
                        <li key={i}>{s.substituteIndex}</li>
                    ))}
                </ul>
            ) : (
                <span className="text-secondary ms-2">Brak zamienników</span>
            )}
        </div>
    );
}