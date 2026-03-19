(function enableSearchImageShield() {
    const path = (window.location.pathname || '').toLowerCase();
    const params = new URLSearchParams(window.location.search || '');
    const searchParamKeys = new Set([
        'q',
        'query',
        'text',
        'p',
        'wd',
        'k',
        'keyword',
        'search_query',
        'searchterm'
    ]);
    const hasSearchParam = Array.from(params.keys()).some((key) => searchParamKeys.has(String(key || '').toLowerCase()));
    const hasSearchPath = /search|images\/search|results|find/.test(path);
    const isSearchPage = hasSearchParam || (hasSearchPath && params.toString().length > 0);

    if (!isSearchPage) {
        return;
    }

    const SHIELD_CLASS = 'tpb-image-shield-active';
    const root = document.documentElement;

    if (!root) {
        return;
    }

    const applyShieldClass = () => {
        root.classList.add(SHIELD_CLASS);
        if (document.body) {
            document.body.classList.add(SHIELD_CLASS);
        }
    };

    applyShieldClass();

    if (!document.body) {
        document.addEventListener('DOMContentLoaded', applyShieldClass, { once: true });
    }

    // Very light guard: if page scripts try to remove the class, put it back.
    const classObserver = new MutationObserver(() => {
        if (!root.classList.contains(SHIELD_CLASS)) {
            root.classList.add(SHIELD_CLASS);
        }
        if (document.body && !document.body.classList.contains(SHIELD_CLASS)) {
            document.body.classList.add(SHIELD_CLASS);
        }
    });

    classObserver.observe(root, {
        attributes: true,
        attributeFilter: ['class']
    });
})();
