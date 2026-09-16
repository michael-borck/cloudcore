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
                    // the public build can't resolve gated .qmd targets, so
                    // nav links arrive raw — point them at the rendered page
                    u.pathname = u.pathname.replace(/\.qmd$/, '.html');
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
            const badge = document.getElementById('unit-gate-badge').value.trim().toUpperCase();
            if (!unit || !password || !badge) return;

            try {
                const r = await fetch(API + '/session', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unit_code: unit, password: password, badge_code: badge })
                });
                if (r.ok) {
                    const me = await r.json();
                    localStorage.setItem(UNIT_KEY, me.unit_code);
                    window.location.href = safeNext();
                } else if (r.status === 429) {
                    errBox.textContent = 'Too many attempts — please wait a minute and try again.';
                } else if (r.status === 503) {
                    errBox.textContent = 'Cannot verify badges right now — please try again shortly.';
                } else {
                    const data = await r.json().catch(() => ({}));
                    errBox.textContent = data.detail || 'Invalid unit code, password, or badge ID.';
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

    // --- navbar login / logout button ---------------------------------------
    // Makes the session state visible: "Unit Login" when anonymous, a
    // "Logout (UNIT)" button once a session cookie is live. The cookie is
    // HttpOnly, so /session/me is the only way to know.
    function injectAuthButton(me) {
        if (document.getElementById('cc-auth-btn')) return;
        const nav = document.querySelector('.navbar .navbar-container')
            || document.querySelector('.navbar');
        if (!nav) return;
        const style = document.createElement('style');
        style.textContent = '.cc-auth-btn{display:inline-block;margin-left:.75rem;'
            + 'padding:.35rem .9rem;font-size:.875rem;font-weight:600;border-radius:6px;'
            + 'border:1px solid rgba(15,23,42,.35);background:transparent;color:inherit;'
            + 'cursor:pointer;text-decoration:none;white-space:nowrap}'
            + '.cc-auth-btn:hover{border-color:#2563eb;color:#2563eb}';
        document.head.appendChild(style);

        const next = PROTECTED.test(window.location.pathname)
            ? window.location.pathname + window.location.search : '/';
        if (me) {
            const btn = document.createElement('button');
            btn.id = 'cc-auth-btn';
            btn.className = 'cc-auth-btn';
            btn.type = 'button';
            btn.textContent = 'Logout (' + me.unit_code + ')';
            btn.title = 'Logged in as ' + me.unit_name
                + (me.business_hours ? ' — ' + me.business_hours : '');
            btn.addEventListener('click', async function () {
                try {
                    await fetch(API + '/session', { method: 'DELETE', credentials: 'include' });
                } catch (e) { /* clear local state regardless */ }
                localStorage.removeItem(UNIT_KEY);
                window.location.href = '/';
            });
            nav.appendChild(btn);
        } else {
            const a = document.createElement('a');
            a.id = 'cc-auth-btn';
            a.className = 'cc-auth-btn';
            a.textContent = 'Unit Login';
            a.href = (host === GATED_HOST ? '/gate.html?next='
                : 'https://' + GATED_HOST + '/gate.html?next=') + encodeURIComponent(next);
            nav.appendChild(a);
        }
    }

    function setupAuthButton() {
        fetch(API + '/session/me', { credentials: 'include' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (me) { injectAuthButton(me || null); })
            .catch(function () { injectAuthButton(null); });
    }

    function init() {
        if (onGatePage) { wireGateForm(); return; }
        if (host === PUBLIC_HOST) { rewriteProtectedLinks(); setupAuthButton(); return; }
        if (host === GATED_HOST && PROTECTED.test(window.location.pathname)) {
            // Server-side forward_auth already decided whether this page was
            // served; this only catches the no-session case for friendlier UX.
            checkSession().then(function (ok) { if (!ok) redirectToGate(); });
        }
        setupAuthButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
