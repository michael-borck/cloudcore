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
    function injectSharedStyles() {
        if (document.getElementById('cc-gate-styles')) return;
        const style = document.createElement('style');
        style.id = 'cc-gate-styles';
        style.textContent =
            // padlock marker on links that lead to gated pages
            '.cc-gated::after{content:"";display:inline-block;width:9px;height:11px;'
            + 'margin-left:5px;vertical-align:-1px;opacity:.55;'
            + 'background:#0f172a;-webkit-mask:url("data:image/svg+xml;utf8,'
            + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M144 144v48H240V144c0-26.5 21.5-48 48-48s48 21.5 48 48v48h16c26.5 0 48 21.5 48 48v192c0 26.5-21.5 48-48 48H32c-26.5 0-48-21.5-48-48V240c0-26.5 21.5-48 48-48h16V144C48 64.5 112.5 0 192 0s144 64.5 144 144zM80 240v192h224V240H80z"/></svg>')
            + '") center/contain no-repeat;mask:url("data:image/svg+xml;utf8,'
            + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M144 144v48H240V144c0-26.5 21.5-48 48-48s48 21.5 48 48v48h16c26.5 0 48 21.5 48 48v192c0 26.5-21.5 48-48 48H32c-26.5 0-48-21.5-48-48V240c0-26.5 21.5-48 48-48h16V144C48 64.5 112.5 0 192 0s144 64.5 144 144zM80 240v192h224V240H80z"/></svg>')
            + '") center/contain no-repeat}'
            // "My interviews" overlay
            + '.cc-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:99999;'
            + 'display:flex;align-items:center;justify-content:center;padding:16px}'
            + '.cc-modal{background:#fff;border-radius:12px;max-width:560px;width:100%;'
            + 'max-height:80vh;overflow:auto;padding:22px 24px;box-shadow:0 20px 60px rgba(0,0,0,.3);'
            + 'font-family:system-ui,-apple-system,sans-serif;color:#0f172a}'
            + '.cc-modal h3{margin:0 0 4px;font-size:1.15rem}'
            + '.cc-modal .cc-sub{margin:0 0 14px;font-size:.85rem;color:#64748b}'
            + '.cc-apt{border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:10px}'
            + '.cc-apt .cc-who{font-weight:600}.cc-apt .cc-when{font-size:.9rem;color:#475569;margin:2px 0 8px}'
            + '.cc-apt .cc-note{font-size:.78rem;color:#b45309;margin:2px 0 8px}'
            + '.cc-apt a,.cc-apt button{font-size:.82rem;padding:4px 10px;border-radius:6px;'
            + 'margin-right:6px;text-decoration:none;cursor:pointer}'
            + '.cc-apt .cc-join{background:#2563eb;color:#fff;border:1px solid #2563eb}'
            + '.cc-apt .cc-ics{background:#fff;color:#2563eb;border:1px solid #cbd5e1}'
            + '.cc-apt .cc-cancel{background:#fff;color:#dc3545;border:1px solid #f1b3b8}'
            + '.cc-close{float:right;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#64748b}';
        document.head.appendChild(style);
    }

    function rewriteProtectedLinks() {
        injectSharedStyles();
        document.querySelectorAll('a[href]').forEach(function (a) {
            try {
                const u = new URL(a.getAttribute('href'), window.location.href);
                if (u.hostname === PUBLIC_HOST && PROTECTED.test(u.pathname)) {
                    u.hostname = GATED_HOST;
                    // the public build can't resolve gated .qmd targets, so
                    // nav links arrive raw — point them at the rendered page
                    u.pathname = u.pathname.replace(/\.qmd$/, '.html');
                    a.href = u.toString();
                    a.classList.add('cc-gated');
                    a.title = (a.title ? a.title + ' ' : '') + 'Requires unit login';
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

    // --- "My interviews" overlay ---------------------------------------------
    // Lists every upcoming appointment for the visitor's badge (any employee)
    // with join / add-to-calendar / cancel. The badge code is the credential.
    const BOOKING_API = 'https://booking.cloudcore.eduserver.au/api';

    function storedBadge() {
        try {
            const s = JSON.parse(localStorage.getItem('booking_badge') || 'null');
            return s && s.badge ? String(s.badge).toUpperCase() : null;
        } catch (e) { return null; }
    }

    function esc(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function fmtWhen(iso) {
        try {
            return new Date(iso).toLocaleString(undefined, {
                weekday: 'short', day: 'numeric', month: 'short',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return iso; }
    }

    function injectStylesOnce() { injectSharedStyles(); }

    function openInterviewsOverlay() {
        injectStylesOnce();
        document.getElementById('cc-overlay')?.remove();
        const wrap = document.createElement('div');
        wrap.id = 'cc-overlay';
        wrap.className = 'cc-overlay';
        wrap.innerHTML = '<div class="cc-modal">'
            + '<button class="cc-close" title="Close" onclick="this.closest(\'.cc-overlay\').remove()">×</button>'
            + '<h3>Your upcoming interviews</h3>'
            + '<p class="cc-sub">Across all CloudCore staff. Join opens the staff member\'s page at your booked time.</p>'
            + '<div id="cc-apt-list"><p class="cc-sub">Loading…</p></div>'
            + '</div>';
        wrap.addEventListener('click', function (e) {
            if (e.target === wrap) wrap.remove();
        });
        document.body.appendChild(wrap);
        loadInterviews();
    }

    async function loadInterviews() {
        const list = document.getElementById('cc-apt-list');
        if (!list) return;
        let badge = storedBadge();
        if (!badge) {
            badge = (prompt('Enter your badge code (e.g. CC-XXXX-XXXX):') || '')
                .trim().toUpperCase();
            if (!badge) { list.innerHTML = '<p class="cc-sub">No badge entered.</p>'; return; }
            localStorage.setItem('booking_badge', JSON.stringify({ badge: badge }));
        }
        try {
            const [apptsRes, usageRes] = await Promise.all([
                fetch(BOOKING_API + '/appointments/mine?badge_code=' + encodeURIComponent(badge)),
                fetch(BOOKING_API + '/appointments/usage?badge_code=' + encodeURIComponent(badge))
            ]);
            if (!apptsRes.ok) throw new Error('HTTP ' + apptsRes.status);
            const appts = await apptsRes.json();
            const usage = usageRes.ok ? await usageRes.json() : [];

            let usageHtml = '';
            if (usage.length) {
                usageHtml = '<div style="margin-bottom:14px;">'
                    + '<div style="font-size:.8rem;font-weight:600;color:#475569;'
                    + 'text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">'
                    + 'Senior staff meeting allowances</div>'
                    + usage.map(function (u) {
                        const bonus = u.bonus > 0 ? ' (includes ' + u.bonus + ' granted extra)' : '';
                        return '<div style="font-size:.88rem;margin-bottom:3px;">'
                            + esc(u.employee_name) + ' — <strong>' + u.used + ' of ' + u.allowance
                            + '</strong> used · ' + (u.left > 0 ? u.left + ' left' : 'none left')
                            + esc(bonus) + '</div>';
                    }).join('') + '</div>';
            }

            if (!appts.length) {
                list.innerHTML = usageHtml
                    + '<p class="cc-sub">No upcoming interviews. Book one from '
                    + 'any staff member\'s page on <a href="https://' + GATED_HOST
                    + '/chatbots/index.html">the chatbots page</a>.</p>';
                return;
            }
            list.innerHTML = usageHtml + appts.map(function (a) {
                const join = 'https://' + GATED_HOST + '/chatbots/bots/'
                    + encodeURIComponent(a.employee_id) + '/';
                return '<div class="cc-apt">'
                    + '<div class="cc-who">' + esc(a.employee_name) + '</div>'
                    + '<div class="cc-when">' + esc(fmtWhen(a.scheduled_start)) + '</div>'
                    + (a.reschedule_count > 0
                        ? '<div class="cc-note">Time was moved by our office — this is the current slot.</div>'
                        : '')
                    + '<a class="cc-join" href="' + join + '">Join</a>'
                    + '<a class="cc-ics" href="' + BOOKING_API + '/appointments/'
                        + encodeURIComponent(a.id) + '/calendar" download>Add to calendar</a>'
                    + '<button class="cc-cancel" data-apt="' + esc(a.id) + '">Cancel</button>'
                    + '</div>';
            }).join('');
            list.querySelectorAll('.cc-cancel').forEach(function (btn) {
                btn.addEventListener('click', async function () {
                    if (!confirm('Cancel this interview? Your meeting allowance is freed.')) return;
                    btn.disabled = true;
                    try {
                        await fetch(BOOKING_API + '/appointments/'
                            + encodeURIComponent(btn.dataset.apt), {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ badge_code: badge, reason: 'Cancelled by student' })
                        });
                    } catch (e) { /* reload list regardless */ }
                    loadInterviews();
                });
            });
        } catch (e) {
            list.innerHTML = '<p class="cc-sub">Could not load bookings — please try again later.</p>';
        }
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
        const myBtn = document.createElement('button');
        myBtn.id = 'cc-interviews-btn';
        myBtn.className = 'cc-auth-btn';
        myBtn.type = 'button';
        myBtn.textContent = 'My interviews';
        myBtn.title = 'See your upcoming interviews';
        myBtn.addEventListener('click', openInterviewsOverlay);
        nav.appendChild(myBtn);
        injectStylesOnce();

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
