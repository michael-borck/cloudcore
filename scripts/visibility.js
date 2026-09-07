/**
 * CloudCore per-unit content discovery.
 *
 * Presentation only — enforcement stays server-side (Caddy forward_auth ->
 * cloudcore-api /session/verify returns 403 for denied paths). This script
 * asks the API for the signed-in unit's access rules and hides the cards,
 * listing rows, and nav entries the unit cannot open, so students see what
 * IS available instead of finding out by clicking into a denial page.
 *
 * Flow: /session/me (unit code for the session cookie) -> /access/{unit}
 * (allowed_patterns + denied_patterns, the same rules the server applies).
 * Mirrors the server's semantics, including "an active ALLOW rule wins over
 * a standing DENY" — that is how staged release unlocks content, so a
 * standing /docs/* deny must not hide the allowed extracts page.
 */
(function () {
    'use strict';

    const cfg = (typeof CloudCoreConfig !== 'undefined') ? CloudCoreConfig : {};
    const API = cfg.apiUrl || 'https://api.cloudcore.eduserver.au';

    // --- rule matching (mirrors src/routes/session.py) ----------------------

    function toRegExp(pattern) {
        // fnmatch-style: '*' and '?' are wildcards, everything else literal
        let rx = '';
        for (const ch of pattern) {
            if (ch === '*') rx += '.*';
            else if (ch === '?') rx += '.';
            else rx += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        }
        return new RegExp('^' + rx + '$');
    }

    function compile(patterns) {
        const matchers = [];
        for (const p of patterns || []) {
            const variants = [p];
            for (const ext of ['.md', '.qmd']) {
                if (p.endsWith(ext)) variants.push(p.slice(0, -ext.length) + '.html');
            }
            matchers.push(...variants.map(toRegExp));
        }
        return matchers;
    }

    const matches = (matchers, path) => matchers.some((rx) => rx.test(path));

    // --- DOM filtering -------------------------------------------------------

    function hideTargetFor(a) {
        // Prefer the enclosing card/listing row; in menus hide the entry;
        // bare inline links are hidden individually.
        return a.closest('.card, .listing-item, .quarto-listing-item, article')
            || (a.closest('.dropdown-menu, .navbar-nav') ? (a.closest('li') || a) : null)
            || a;
    }

    function filter(allow, deny) {
        const targets = new Set();
        document.querySelectorAll('a[href]').forEach(function (a) {
            const raw = a.getAttribute('href');
            if (!raw || raw.startsWith('#') || /^(mailto|javascript|tel):/i.test(raw)) return;
            let path;
            try {
                path = new URL(raw, window.location.href).pathname;
            } catch (e) { return; }
            // "ALLOW wins over DENY", as on the server
            if (matches(deny, path) && !matches(allow, path)) {
                targets.add(hideTargetFor(a));
            }
        });
        targets.forEach(function (el) {
            el.hidden = true;
            el.classList.add('cc-unreleased');
        });
    }

    // --- boot ----------------------------------------------------------------

    async function init() {
        try {
            const me = await fetch(API + '/session/me', { credentials: 'include' });
            if (!me.ok) return; // not signed in — the gate page handles that
            const unit = (await me.json()).unit_code;
            if (!unit) return;
            const r = await fetch(API + '/access/' + encodeURIComponent(unit),
                                  { credentials: 'include' });
            if (!r.ok) return;
            const rules = await r.json();
            const allow = compile(rules.allowed_patterns);
            const deny = compile(rules.denied_patterns);
            if (!deny.length) return;
            filter(allow, deny);
        } catch (e) { /* API unreachable — leave the page as-is */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
