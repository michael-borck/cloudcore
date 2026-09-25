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
            + '.cc-close{float:right;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#64748b}'
            // navbar buttons + gate password toggle
            + '.cc-auth-btn{display:inline-block;padding:.32rem .85rem;font-size:.875rem;'
            + 'font-weight:600;border-radius:6px;border:1px solid rgba(15,23,42,.35);'
            + 'background:transparent;color:inherit;cursor:pointer;text-decoration:none;'
            + 'white-space:nowrap;vertical-align:middle}'
            + '.cc-auth-btn:hover{border-color:#2563eb;color:#2563eb}'
            + '.cc-nav-item{display:flex;align-items:center;margin-left:.4rem}'
            + '.cc-pwd-wrap{position:relative}.cc-pwd-wrap .form-control{padding-right:2.6rem}'
            + '.cc-pwd-toggle{position:absolute;right:.6rem;top:50%;transform:translateY(-50%);'
            + 'background:none;border:none;color:#64748b;cursor:pointer;padding:2px;'
            + 'display:flex;align-items:center}'
            + '.cc-pwd-toggle:hover{color:#2563eb}'
            + '.cc-toast{position:fixed;top:72px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 16px;border-radius:10px;z-index:100001;box-shadow:0 10px 30px rgba(0,0,0,.35);font-size:.9rem;max-width:540px;width:calc(100% - 32px);text-align:left}'
            + '.cc-toast .cc-t-close{float:right;background:none;border:none;color:#94a3b8;font-size:1.1rem;cursor:pointer;margin-left:10px}'
            + '.cc-toast .cc-t-ok{color:#4ade80;font-weight:600}'
            + '.cc-toast .cc-t-warn{display:block;margin-top:6px;color:#fbbf24;font-size:.82rem;line-height:1.4}';
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
        injectSharedStyles();
        const form = document.getElementById('unit-gate-form');
        if (!form) return;
        const errBox = document.getElementById('unit-gate-error');

        // show/hide password toggle
        const pwdInput = document.getElementById('unit-gate-password');
        const pwdToggle = document.getElementById('toggle-unit-gate-password');
        if (pwdInput && pwdToggle) {
            const EYE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            const EYE_OFF = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
            pwdToggle.innerHTML = EYE;
            pwdToggle.addEventListener('click', function () {
                const show = pwdInput.type === 'password';
                pwdInput.type = show ? 'text' : 'password';
                pwdToggle.innerHTML = show ? EYE_OFF : EYE;
                pwdToggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            });
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            errBox.textContent = '';
            const unit = document.getElementById('unit-gate-code').value.normalize('NFKC').replace(/_/g, '-').trim().toUpperCase();
            const password = document.getElementById('unit-gate-password').value;
            const badge = document.getElementById('unit-gate-badge').value.normalize('NFKC').replace(/_/g, '-').trim().toUpperCase();
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
                    sessionStorage.setItem('cc_login_toast', '1');
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

    function sweepChatSessions() {
        // AnythingLLM stashes one session id per chatbot interviewed, in THIS
        // browser. Possession of those ids is the download credential.
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            const m = k && k.match(/^allm_(.+)_session_id$/);
            if (m) {
                const sid = localStorage.getItem(k);
                if (sid) out.push({ embed_id: m[1], session_id: sid });
            }
        }
        return out;
    }

    // The download affordance only appears when conversations exist — no point
    // offering a link that ends in "nothing found".
    function updateTranscriptLink() {
        const slot = document.getElementById('cc-transcript-slot');
        if (!slot) return;
        const pairs = sweepChatSessions();
        if (!pairs.length) {
            slot.textContent = 'No conversations found in this browser.';
            return;
        }
        slot.textContent = '';
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = 'Download conversations (' + pairs.length + ' in this browser)';
        a.style.color = '#2563eb';
        a.addEventListener('click', function (e) {
            e.preventDefault();
            downloadTranscripts(a);
        });
        slot.appendChild(a);
    }

    async function downloadTranscripts(link) {
        const badgeInput = document.getElementById('cc-badge-input');
        const badge = (badgeInput && badgeInput.value
            ? badgeInput.value.normalize('NFKC').replace(/_/g, '-').trim().toUpperCase()
            : storedBadge()) || storedBadge();
        const pairs = sweepChatSessions();
        if (!pairs.length) {
            link.textContent = 'No conversations found in this browser.';
            return;
        }
        link.textContent = 'Fetching…';
        try {
            const r = await fetch(BOOKING_API + '/conversations/by-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessions: pairs, badge_code: badge || null })
            });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const data = await r.json();
            const sessions = data.sessions || [];
            if (!sessions.length) {
                link.textContent = 'No conversations found for badge ' + badge + '.';
                return;
            }
            if (sessions.length <= 1) {
                const text = sessions.length ? ccSessionText(sessions[0]) : '(no content)';
                ccDlBlob('cloudcore-interview-transcript.txt', new Blob([text], { type: 'text/plain' }));
                link.textContent = 'Downloaded.';
                return;
            }
            link.textContent = 'Choose conversations ↓';
            ccOpenDownloadChooser(data);
        } catch (e) {
            link.textContent = 'Could not download — please try again later.';
        }
    }

    function ccSessionText(s) {
        const lines = ['=== ' + s.employee_name + ' ==='];
        (s.turns || []).forEach(function (t) {
            lines.push((String(t.role).toLowerCase() === 'user' ? 'Student' : s.employee_name)
                + ': ' + (t.content || ''));
        });
        return lines.join('\n') + '\n';
    }

    function ccSafeName(name) {
        return (name || 'chatbot').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    function ccDlBlob(filename, blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    }

    // Minimal ZIP (store, no compression) — mirrors the builder in
    // chatbot-booking.js. Verified against Info-ZIP unzip.
    function ccMakeZip(files) {
        const enc = new TextEncoder();
        const chunks = [], central = [];
        let offset = 0;
        const crcTable = (function () {
            const t = new Uint32Array(256);
            for (let n = 0; n < 256; n++) {
                let c = n;
                for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                t[n] = c >>> 0;
            }
            return t;
        })();
        const crc32 = function (bytes) {
            let c = 0xFFFFFFFF;
            for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
            return (c ^ 0xFFFFFFFF) >>> 0;
        };
        const u16 = v => new Uint8Array([v & 0xFF, (v >> 8) & 0xFF]);
        const u32 = v => new Uint8Array([v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >>> 24) & 0xFF]);
        for (const f of files) {
            const nameBytes = enc.encode(f.name);
            const fileData = enc.encode(f.text);
            const crc = crc32(fileData);
            const local = new Uint8Array(30 + nameBytes.length);
            local.set(u32(0x04034b50), 0);
            local.set(u16(20), 4);
            local.set(u16(0x0800), 6);
            local.set(u16(0), 8);
            local.set(u16(0), 10);
            local.set(u16(0), 12);
            local.set(u32(crc), 14);
            local.set(u32(fileData.length), 18);
            local.set(u32(fileData.length), 22);
            local.set(u16(nameBytes.length), 26);
            local.set(u16(0), 28);
            local.set(nameBytes, 30);
            chunks.push(local, fileData);
            central.push({ nameBytes, crc, size: fileData.length, offset });
            offset += local.length + fileData.length;
        }
        const centralStart = offset;
        let centralSize = 0;
        for (const c of central) {
            const rec = new Uint8Array(46 + c.nameBytes.length);
            rec.set(u32(0x02014b50), 0);
            rec.set(u16(20), 4);
            rec.set(u16(20), 6);
            rec.set(u16(0x0800), 8);
            rec.set(u16(0), 10);
            rec.set(u16(0), 12);
            rec.set(u16(0), 14);
            rec.set(u32(c.crc), 16);
            rec.set(u32(c.size), 20);
            rec.set(u32(c.size), 24);
            rec.set(u16(c.nameBytes.length), 28);
            rec.set(u32(c.offset), 42);
            rec.set(c.nameBytes, 46);
            chunks.push(rec);
            centralSize += rec.length;
        }
        const eocd = new Uint8Array(22);
        eocd.set(u32(0x06054b50), 0);
        eocd.set(u16(central.length), 8);
        eocd.set(u16(central.length), 10);
        eocd.set(u32(centralSize), 12);
        eocd.set(u32(centralStart), 16);
        chunks.push(eocd);
        return new Blob(chunks, { type: 'application/zip' });
    }

    function ccOpenDownloadChooser(data) {
        injectSharedStyles();
        document.getElementById('cc-dl-chooser')?.remove();
        const sessions = data.sessions || [];
        const wrap = document.createElement('div');
        wrap.id = 'cc-dl-chooser';
        wrap.className = 'cc-overlay';
        wrap.style.zIndex = '100000';
        const rows = sessions.map(function (s, i) {
            const n = (s.turns || []).length;
            return '<label style="display:flex;align-items:center;gap:10px;border:1px solid #e2e8f0;'
                + 'border-radius:8px;padding:10px 12px;margin-bottom:8px;cursor:pointer;">'
                + '<input type="checkbox" class="cc-dl-check" data-i="' + i + '" checked style="width:auto;">'
                + '<span><strong>' + esc(s.employee_name) + '</strong>'
                + '<span style="color:#64748b;font-size:.8rem;"> — ' + n + ' message'
                + (n === 1 ? '' : 's') + '</span></span></label>';
        }).join('');
        const btnCss = 'padding:.45rem .8rem;border-radius:6px;font-size:.85rem;cursor:pointer;';
        wrap.innerHTML = '<div class="cc-modal">'
            + '<h3>Choose conversations to download</h3>'
            + '<p class="cc-sub">' + sessions.length + ' conversation(s) found in this browser.</p>'
            + '<div id="cc-dl-list">' + rows + '</div>'
            + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">'
            + '<button id="cc-dl-zip" class="cc-pwd-toggle" style="position:static;transform:none;'
            + 'background:#2563eb;color:#fff;border:1px solid #2563eb;border-radius:6px;">Selected as ZIP</button>'
            + '<button id="cc-dl-txts" style="' + btnCss + 'background:#fff;color:#2563eb;'
            + 'border:1px solid #cbd5e1;">Selected (.txt each)</button>'
            + '<button id="cc-dl-all" style="' + btnCss + 'background:#fff;color:#495057;'
            + 'border:1px solid #cbd5e1;">All combined (.txt)</button>'
            + '<button id="cc-dl-cancel" style="' + btnCss + 'background:none;border:none;color:#64748b;">Cancel</button>'
            + '</div></div>';
        document.body.appendChild(wrap);

        function selected() {
            return Array.prototype.slice.call(wrap.querySelectorAll('.cc-dl-check'))
                .filter(function (c) { return c.checked; })
                .map(function (c) { return sessions[Number(c.dataset.i)]; });
        }
        function filesFor(list) {
            return list.map(function (s) {
                return {
                    name: ccSafeName(s.employee_name) + '__' + s.session_id.slice(0, 8) + '.txt',
                    text: ccSessionText(s)
                };
            });
        }
        wrap.querySelector('#cc-dl-cancel').onclick = function () { wrap.remove(); };
        wrap.querySelector('#cc-dl-zip').onclick = function () {
            const files = filesFor(selected());
            if (!files.length) return;
            ccDlBlob('cloudcore-interview-transcripts.zip', ccMakeZip(files));
            wrap.remove();
        };
        wrap.querySelector('#cc-dl-txts').onclick = async function () {
            const files = filesFor(selected());
            if (!files.length) return;
            for (const f of files) {
                ccDlBlob(f.name, new Blob([f.text], { type: 'text/plain' }));
                await new Promise(r => setTimeout(r, 350));
            }
            wrap.remove();
        };
        wrap.querySelector('#cc-dl-all').onclick = function () {
            ccDlBlob('cloudcore-interview-transcripts.txt',
                new Blob([data.transcript || ''], { type: 'text/plain' }));
            wrap.remove();
        };
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
        const stored = storedBadge();
        wrap.innerHTML = '<div class="cc-modal">'
            + '<button class="cc-close" title="Close" onclick="this.closest(\'.cc-overlay\').remove()">×</button>'
            + '<h3>Your upcoming interviews</h3>'
            + '<p class="cc-sub">Across all CloudCore staff. Join opens the staff member\'s page at your booked time.</p>'
            + badgeFormHtml(stored)
            + '<p id="cc-transcript-slot" style="margin:0 0 14px;font-size:.85rem;color:#64748b;">Checking for saved conversations…</p>'
            + '<div id="cc-apt-list"><p class="cc-sub">Loading…</p></div>'
            + '</div>';
        wrap.addEventListener('click', function (e) {
            if (e.target === wrap) wrap.remove();
        });
        document.body.appendChild(wrap);
        wireBadgeForm(loadResults);
        document.getElementById('cc-badge-input').focus();
        updateTranscriptLink();
        if (stored) loadResults(stored);
    }

    function badgeFormHtml(prefill) {
        return '<form id="cc-badge-form" style="display:flex;gap:8px;margin-bottom:14px;">'
            + '<input id="cc-badge-input" class="form-control" placeholder="Badge code, e.g. CC-4XKQ-9M2T" '
            + (prefill ? 'value="' + esc(prefill) + '" ' : '')
            + 'autocomplete="off" autocapitalize="characters" spellcheck="false" '
            + 'style="flex:1;padding:.45rem .7rem;border:1px solid #cbd5e1;border-radius:6px;font-size:.9rem;">'
            + '<button type="submit" style="padding:.45rem .9rem;border:1px solid #2563eb;'
            + 'background:#2563eb;color:#fff;border-radius:6px;font-size:.85rem;cursor:pointer;">Load</button>'
            + '</form>';
    }

    function wireBadgeForm(onLoad) {
        const form = document.getElementById('cc-badge-form');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const value = document.getElementById('cc-badge-input').value
                .normalize('NFKC').replace(/_/g, '-').trim().toUpperCase();
            if (!value) return;
            localStorage.setItem('booking_badge', JSON.stringify({ badge: value }));
            onLoad(value);
        });
    }

    async function loadResults(badge) {
        const list = document.getElementById('cc-apt-list');
        if (!list || !badge) return;
        try {
            const [apptsRes, usageRes] = await Promise.all([
                fetch(BOOKING_API + '/appointments/mine?badge_code=' + encodeURIComponent(badge)),
                fetch(BOOKING_API + '/appointments/usage?badge_code=' + encodeURIComponent(badge))
            ]);
            if (!apptsRes.ok) throw new Error('HTTP ' + apptsRes.status);
            const appts = await apptsRes.json();
            const ud = usageRes.ok ? await usageRes.json() : null;
            const usage = ud ? ud.usage : [];
            const visibilityKnown = ud ? ud.visibility_known === true : false;

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
                    }).join('')
                    + '<div style="font-size:.75rem;color:#94a3b8;margin-top:6px;">'
                    + 'Shows staff available to your unit — your Unit Coordinator may '
                    + 'restrict access to some senior staff.'
                    + (visibilityKnown ? '' : ' List could not be filtered for your unit just now.')
                    + '</div></div>';
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
                    loadResults(badge);
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
        injectStylesOnce();
        // Prefer the right-hand icon list in the collapsed navbar (sits after
        // the search icon); fall back to the container on odd layouts.
        const iconNav = document.querySelector('.navbar-collapse .navbar-nav.ms-auto');
        const nav = iconNav
            || document.querySelector('.navbar .navbar-container')
            || document.querySelector('.navbar');
        if (!nav) return;

        function place(el) {
            if (iconNav) {
                const li = document.createElement('li');
                li.className = 'nav-item cc-nav-item';
                li.appendChild(el);
                nav.appendChild(li);
            } else {
                nav.appendChild(el);
            }
        }

        const myBtn = document.createElement('button');
        myBtn.id = 'cc-interviews-btn';
        myBtn.className = 'cc-auth-btn';
        myBtn.type = 'button';
        myBtn.textContent = 'My interviews';
        myBtn.title = 'See your upcoming interviews';
        myBtn.addEventListener('click', openInterviewsOverlay);
        place(myBtn);

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
                // Shared machines: forget the visitor's badge and unit too, so
                // the next person can't see their interviews or book as them.
                localStorage.removeItem(UNIT_KEY);
                localStorage.removeItem('booking_badge');
                window.location.href = '/';
            });
            place(btn);
        } else {
            const a = document.createElement('a');
            a.id = 'cc-auth-btn';
            a.className = 'cc-auth-btn';
            a.textContent = 'Unit Login';
            a.href = (host === GATED_HOST ? '/gate.html?next='
                : 'https://' + GATED_HOST + '/gate.html?next=') + encodeURIComponent(next);
            place(a);
        }
        showLoginToast(me);
    }

    // Explicit confirmation after the gate redirects — otherwise a successful
    // login looks like nothing happened (just the button text changing), and
    // outside business hours students conclude the login itself failed.
    function showLoginToast(me) {
        if (!me || !sessionStorage.getItem('cc_login_toast')) return;
        sessionStorage.removeItem('cc_login_toast');
        const badge = storedBadge();
        const el = document.createElement('div');
        el.className = 'cc-toast';
        let html = '<button class="cc-t-close" title="Dismiss" '
            + 'onclick="this.parentElement.remove()">×</button>'
            + '<span class="cc-t-ok">✓ Logged in as ' + esc(me.unit_code) + '</span>'
            + (badge ? ' <span style="color:#94a3b8;font-size:.8rem;">· badge ' + esc(badge) + '</span>' : '');
        if (me.offices_open === false) {
            html += '<span class="cc-t-warn">CloudCore offices are currently closed ('
                + (me.business_hours || 'staffed hours') + '). Staff chat and gated documents '
                + 'are unavailable until they reopen — My Interviews and your bookings '
                + 'still work.</span>';
        }
        el.innerHTML = html;
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 15000);
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
