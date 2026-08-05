/**
 * CloudCore unit gate — server-side sessions.
 *
 * Enforcement lives in cloudcore-api (POST /session -> HttpOnly cookie) and
 * Caddy forward_auth on the gated host; this script is UX only:
 *   - public host: point links into /docs/ and /chatbots/ at the gated host
 *   - gated host: confirm the session and stash the unit code for the
 *     booking scripts; bounce to /gate.html when there is no session
 *   - /gate.html: drive the login form
 *
 * No passwords ship in this file, and nothing here hides content — anything
 * that must not be read is simply not served without a session.
 */
(function () {
    'use strict';

    const cfg = (typeof CloudCoreConfig !== 'undefined') ? CloudCoreConfig : {};
    const API = cfg.apiUrl || 'https://api.cloudcore.eduserver.au';
    const GATED_HOST = cfg.gatedHost || 'gated.cloudcore.eduserver.au';
    const PUBLIC_HOST = cfg.siteDomain || 'cloudcore.eduserver.au';
    const PROTECTED = /^\/(docs|chatbots)(\/|$)/;
    const UNIT_KEY = 'cloudcore_unit_code';

    const host = window.location.hostname;
    const onGatePage = /\/gate(\.html)?$/.test(window.location.pathname);

    // --- public host: protected sections live on the gated host -------------
    function rewriteProtectedLinks() {
        document.querySelectorAll('a[href]').forEach(function (a) {
            try {
                const u = new URL(a.getAttribute('href'), window.location.href);
                if (u.hostname === PUBLIC_HOST && PROTECTED.test(u.pathname)) {
                    u.hostname = GATED_HOST;
                    a.href = u.toString();
                }
            } catch (e) { /* not a URL we care about */ }
        });
    }

    // --- gated host: confirm session, remember the unit ---------------------
    async function checkSession() {
        try {
            const r = await fetch(API + '/session/me', { credentials: 'include' });
            if (r.ok) {
                const me = await r.json();
                localStorage.setItem(UNIT_KEY, me.unit_code);
                return true;
            }
        } catch (e) { /* API unreachable — fall through */ }
        return false;
    }

    function redirectToGate() {
        const next = window.location.pathname + window.location.search;
        window.location.href = '/gate.html?next=' + encodeURIComponent(next);
    }

    // --- /gate.html: the login form ------------------------------------------
    function safeNext() {
        const raw = new URLSearchParams(window.location.search).get('next') || '/';
        // same-host relative paths only — no open redirect
        return (raw.startsWith('/') && !raw.startsWith('//')) ? raw : '/';
    }

    function wireGateForm() {
        const form = document.getElementById('unit-gate-form');
        if (!form) return;
        const errBox = document.getElementById('unit-gate-error');

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            errBox.textContent = '';
            const unit = document.getElementById('unit-gate-code').value.trim().toUpperCase();
            const password = document.getElementById('unit-gate-password').value;
            if (!unit || !password) return;

            try {
                const r = await fetch(API + '/session', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unit_code: unit, password: password })
                });
                if (r.ok) {
                    const me = await r.json();
                    localStorage.setItem(UNIT_KEY, me.unit_code);
                    window.location.href = safeNext();
                } else if (r.status === 429) {
                    errBox.textContent = 'Too many attempts — please wait a minute and try again.';
                } else {
                    errBox.textContent = 'Invalid unit code or password.';
                }
            } catch (e2) {
                errBox.textContent = 'Cannot reach the access service. Please try again later.';
            }
        });

        // returning with a live session? go straight through
        checkSession().then(function (ok) {
            if (ok) window.location.href = safeNext();
        });
    }

    function init() {
        if (onGatePage) { wireGateForm(); return; }
        if (host === PUBLIC_HOST) { rewriteProtectedLinks(); return; }
        if (host === GATED_HOST && PROTECTED.test(window.location.pathname)) {
            // Server-side forward_auth already decided whether this page was
            // served; this only catches the no-session case for friendlier UX.
            checkSession().then(function (ok) { if (!ok) redirectToGate(); });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
