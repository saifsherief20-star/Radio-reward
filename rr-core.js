/* RADIO REWARDS — shared core: API client, sessions, i18n, auth screen, toasts, PWA helpers. */
(() => {
  'use strict';
  const CFG = window.RR_CONFIG || {};
  const ENDPOINT = `${CFG.url}/functions/v1/${CFG.fn || 'radio-api'}`;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };

  /* ------------------------------------------------------------ i18n */
  const D = { en: {}, ar: {} };
  let lang = ls.get('rr') || ((navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en');
  if (lang !== 'ar' && lang !== 'en') lang = 'en';
  const langCbs = [];
  const add = (en, ar) => { Object.assign(D.en, en); Object.assign(D.ar, ar); };
  const t = (key, vars) => {
    let s = D[lang][key] ?? D.en[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
    return s;
  };
  const loc = () => (lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB');
  const fmtDate = (d) => { try { return new Date(d).toLocaleString(loc(), { dateStyle: 'medium', timeStyle: 'short' }); } catch { return String(d); } };
  const fmtDay = (d) => { try { return new Date(d).toLocaleDateString(loc(), { dateStyle: 'medium' }); } catch { return String(d); } };
  const num = (n) => Number(n || 0).toLocaleString(loc());
  const pick = (o, base = 'name') => (o ? (lang === 'ar' && o[base + '_ar'] ? o[base + '_ar'] : o[base]) || '' : '');
  function applyI18n(root = document) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]', root).forEach((e) => { e.textContent = t(e.dataset.i18n); });
    $$('[data-i18n-ph]', root).forEach((e) => { e.placeholder = t(e.dataset.i18nPh); });
    $$('[data-i18n-aria]', root).forEach((e) => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
    $$('[data-i18n-title]', root).forEach((e) => { e.title = t(e.dataset.i18nTitle); });
    const lg = $('#lg'); if (lg) lg.textContent = lang === 'ar' ? 'EN' : 'AR';
    const tk = document.body && document.body.dataset.title;
    if (tk) document.title = `RADIO REWARDS · ${t(tk)}`;
  }
  function setLang(l) {
    lang = l === 'ar' ? 'ar' : 'en'; ls.set('rr', lang);
    applyI18n(); langCbs.forEach((f) => { try { f(lang); } catch (e) { console.error(e); } });
  }
  const onLang = (f) => langCbs.push(f);

  add({
    app: 'RADIO REWARDS', loading: 'Loading…', retry: 'Try again', cancel: 'Cancel', save: 'Save', close: 'Close', back: 'Back', next: 'Next', prev: 'Previous',
    signout: 'Sign out', yes: 'Yes', no: 'No', active: 'Active', disabled: 'Disabled', none: '—', ok: 'OK',
    'auth.customer.title': 'Welcome to Radio Café', 'auth.customer.sub': 'Collect drinks, earn rewards.',
    'auth.register': 'Create account', 'auth.login': 'Sign in', 'auth.name': 'Full name', 'auth.phone': 'Phone number',
    'auth.phone.hint': 'Egyptian mobile, e.g. 01012345678. This is how the cashier finds you.',
    'auth.noOtp': 'No SMS code needed. Use the same name and phone each time you sign in.',
    'auth.staff.title': 'Staff sign in', 'auth.staff.sub': 'Authorized Radio Café staff only.', 'auth.email': 'Email', 'auth.password': 'Password',
    'auth.show': 'Show', 'auth.hide': 'Hide', 'auth.submitting': 'Please wait…',
    'staff.role.title': 'Not authorized', 'staff.role.msg': 'Your account does not have access to this page.', 'staff.role.go': 'Go to the cashier page',
    'nav.cashier': 'Cashier', 'nav.admin': 'Admin',
    'err.NETWORK_ERROR': 'Cannot reach the server. Check your connection and try again.',
    'err.SERVER_ERROR': 'Server error. Please try again in a moment.',
    'err.RATE_LIMITED': 'Too many attempts. Please wait a few minutes and try again.',
    'err.INVALID_NAME': 'Please enter a valid full name (2–80 characters).',
    'err.INVALID_PHONE': 'Please enter a valid phone number, e.g. 01012345678.',
    'err.PHONE_ALREADY_REGISTERED': 'This phone number is already registered. Please sign in instead.',
    'err.CUSTOMER_LOGIN_FAILED': 'Name or phone number does not match an account.',
    'err.INVALID_CREDENTIALS': 'Please enter your full name and phone number.',
    'err.CUSTOMER_SESSION_REQUIRED': 'Please sign in again.', 'err.CUSTOMER_SESSION_INVALID': 'Your session ended. Please sign in again.',
    'err.CUSTOMER_NOT_ACTIVE': 'This account is not active.',
    'err.LOGIN_FAILED': 'Wrong email or password.',
    'err.STAFF_LOGIN_REQUIRED': 'Please sign in.', 'err.STAFF_SESSION_INVALID': 'Your session ended. Please sign in again.',
    'err.STAFF_NOT_AUTHORIZED': 'This account is not authorized or has been disabled.',
    'err.QR_INVALID': 'This is not a valid Radio Café QR code.', 'err.QR_EXPIRED': 'This QR code expired. Ask the customer to refresh their code.',
    'err.QR_ALREADY_USED': 'This QR code was already used or is being handled by another cashier.',
    'err.INVALID_QUANTITY': 'Quantity must be between 1 and 4.', 'err.DRINK_NOT_FOUND': 'Please choose a drink.',
    'err.NO_REWARD_AVAILABLE': 'This customer has no reward available.', 'err.REWARD_NOT_FOUND': 'Reward not found or not active.',
    'err.MANUAL_PURCHASE_DISABLED': 'Manual purchase entry is turned off. Scan the customer QR instead.',
    'err.CASHIER_NOT_AUTHORIZED': 'Your cashier account is not authorized.',
    'err.CUSTOMER_NOT_FOUND': 'Customer not found.', 'err.STAFF_NOT_FOUND': 'Staff account not found.',
    'err.INVALID_EMAIL': 'Please enter a valid email address.', 'err.WEAK_PASSWORD': 'Password must be 10–72 characters.',
    'err.INVALID_ROLE': 'Invalid role.', 'err.EMAIL_ALREADY_EXISTS': 'This email already has an account.',
    'err.CANNOT_CHANGE_SELF': 'You cannot disable or change the role of your own account.', 'err.LAST_ADMIN': 'There must always be at least one active admin.',
    'err.STAFF_HAS_HISTORY': 'This account has transaction history, so it cannot be deleted. Disable it instead.',
    'err.NAME_ALREADY_EXISTS': 'That name already exists.', 'err.INVALID_LOCATION': 'Invalid coordinates.', 'err.INVALID_MESSAGE': 'The message is too short.',
    'err.NOTHING_TO_UPDATE': 'Nothing to update.', 'err.BAD_REQUEST': 'Bad request.', 'err.UNKNOWN_ACTION': 'Unsupported action.',
  }, {
    app: 'RADIO REWARDS', loading: 'جاري التحميل…', retry: 'حاول تاني', cancel: 'إلغاء', save: 'حفظ', close: 'إغلاق', back: 'رجوع', next: 'التالي', prev: 'السابق',
    signout: 'تسجيل الخروج', yes: 'نعم', no: 'لا', active: 'نشط', disabled: 'موقوف', none: '—', ok: 'تمام',
    'auth.customer.title': 'أهلاً بيك في راديو كافيه', 'auth.customer.sub': 'اجمع مشروباتك واكسب مكافآتك.',
    'auth.register': 'إنشاء حساب', 'auth.login': 'تسجيل الدخول', 'auth.name': 'الاسم بالكامل', 'auth.phone': 'رقم الموبايل',
    'auth.phone.hint': 'رقم موبايل مصري، مثلاً 01012345678. الكاشير بيدوّر بيه عليك.',
    'auth.noOtp': 'مش محتاج كود SMS. استخدم نفس الاسم والرقم كل مرة تدخل.',
    'auth.staff.title': 'دخول الموظفين', 'auth.staff.sub': 'لموظفي راديو كافيه المصرّح لهم فقط.', 'auth.email': 'البريد الإلكتروني', 'auth.password': 'كلمة المرور',
    'auth.show': 'إظهار', 'auth.hide': 'إخفاء', 'auth.submitting': 'من فضلك استنى…',
    'staff.role.title': 'غير مصرّح', 'staff.role.msg': 'حسابك مالوش صلاحية على الصفحة دي.', 'staff.role.go': 'روح لصفحة الكاشير',
    'nav.cashier': 'الكاشير', 'nav.admin': 'الإدارة',
    'err.NETWORK_ERROR': 'مش قادر أوصل للسيرفر. اتأكد من الإنترنت وحاول تاني.',
    'err.SERVER_ERROR': 'في مشكلة في السيرفر. حاول تاني بعد لحظات.',
    'err.RATE_LIMITED': 'محاولات كتير. استنى كام دقيقة وحاول تاني.',
    'err.INVALID_NAME': 'اكتب اسم كامل صحيح (من 2 إلى 80 حرف).',
    'err.INVALID_PHONE': 'اكتب رقم موبايل صحيح، مثلاً 01012345678.',
    'err.PHONE_ALREADY_REGISTERED': 'الرقم ده متسجل قبل كده. سجّل دخول بدل ما تعمل حساب جديد.',
    'err.CUSTOMER_LOGIN_FAILED': 'الاسم أو رقم الموبايل مش مطابق لأي حساب.',
    'err.INVALID_CREDENTIALS': 'اكتب اسمك الكامل ورقم موبايلك.',
    'err.CUSTOMER_SESSION_REQUIRED': 'سجّل دخول تاني من فضلك.', 'err.CUSTOMER_SESSION_INVALID': 'الجلسة خلصت. سجّل دخول تاني.',
    'err.CUSTOMER_NOT_ACTIVE': 'الحساب ده مش نشط.',
    'err.LOGIN_FAILED': 'البريد أو كلمة المرور غلط.',
    'err.STAFF_LOGIN_REQUIRED': 'سجّل دخول من فضلك.', 'err.STAFF_SESSION_INVALID': 'الجلسة خلصت. سجّل دخول تاني.',
    'err.STAFF_NOT_AUTHORIZED': 'الحساب ده غير مصرّح له أو تم إيقافه.',
    'err.QR_INVALID': 'ده مش كود QR صحيح لراديو كافيه.', 'err.QR_EXPIRED': 'الكود انتهت صلاحيته. اطلب من العميل يحدّث الكود.',
    'err.QR_ALREADY_USED': 'الكود ده اتستخدم قبل كده أو كاشير تاني شغال عليه.',
    'err.INVALID_QUANTITY': 'الكمية لازم تكون من 1 لـ 4.', 'err.DRINK_NOT_FOUND': 'اختار المشروب.',
    'err.NO_REWARD_AVAILABLE': 'العميل ده معندوش مكافأة متاحة.', 'err.REWARD_NOT_FOUND': 'المكافأة مش موجودة أو مش مفعّلة.',
    'err.MANUAL_PURCHASE_DISABLED': 'التسجيل اليدوي متوقف. امسح كود العميل.',
    'err.CASHIER_NOT_AUTHORIZED': 'حساب الكاشير مش مصرّح له.',
    'err.CUSTOMER_NOT_FOUND': 'العميل مش موجود.', 'err.STAFF_NOT_FOUND': 'حساب الموظف مش موجود.',
    'err.INVALID_EMAIL': 'اكتب بريد إلكتروني صحيح.', 'err.WEAK_PASSWORD': 'كلمة المرور لازم تكون من 10 لـ 72 حرف.',
    'err.INVALID_ROLE': 'صلاحية غير صحيحة.', 'err.EMAIL_ALREADY_EXISTS': 'البريد ده عليه حساب بالفعل.',
    'err.CANNOT_CHANGE_SELF': 'مينفعش توقف حسابك أو تغيّر صلاحيتك.', 'err.LAST_ADMIN': 'لازم يفضل أدمن واحد نشط على الأقل.',
    'err.STAFF_HAS_HISTORY': 'الحساب ده عليه عمليات سابقة فمينفعش يتمسح. أوقفه بدل كده.',
    'err.NAME_ALREADY_EXISTS': 'الاسم ده موجود بالفعل.', 'err.INVALID_LOCATION': 'إحداثيات غير صحيحة.', 'err.INVALID_MESSAGE': 'الرسالة قصيرة جداً.',
    'err.NOTHING_TO_UPDATE': 'مفيش حاجة تتحدّث.', 'err.BAD_REQUEST': 'طلب غير صحيح.', 'err.UNKNOWN_ACTION': 'إجراء غير مدعوم.',
  });
  const errMsg = (code) => {
    const k = 'err.' + code;
    return D[lang][k] || D.en[k] ? t(k) : t('err.SERVER_ERROR') + ' (' + code + ')';
  };

  /* ------------------------------------------------------------ toast */
  function toast(msg, kind = '') {
    let box = $('#toast');
    if (!box) { box = document.createElement('div'); box.id = 'toast'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const d = document.createElement('div'); if (kind) d.className = kind; d.textContent = msg; box.appendChild(d);
    setTimeout(() => d.remove(), kind === 'bad' ? 6500 : 3800);
  }

  /* ------------------------------------------------------------ API + sessions */
  class ApiError extends Error { constructor(code, status) { super(code); this.code = code; this.status = status; } }
  async function request(action, data = {}, token) {
    const headers = { 'Content-Type': 'application/json', apikey: CFG.key };
    if (token) headers.Authorization = 'Bearer ' + token;
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 25000);
    let res;
    try { res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ ...data, action }), signal: ctl.signal }); }
    catch { throw new ApiError('NETWORK_ERROR', 0); } finally { clearTimeout(timer); }
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(out.error || 'SERVER_ERROR', res.status);
    return out;
  }

  const KEY = { customer: 'rr_customer_session', staff: 'rr_staff_session' };
  let kind = 'customer';
  let authLostCb = null;
  const sess = {
    load() { try { return JSON.parse(ls.get(KEY[kind]) || 'null'); } catch { return null; } },
    save(o) { ls.set(KEY[kind], JSON.stringify(o)); },
    clear() { ls.del(KEY[kind]); },
  };
  let refreshing = null;
  async function refreshStaff() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      const s = sess.load();
      if (!s || !s.refresh_token) throw new ApiError('STAFF_SESSION_INVALID', 401);
      const out = await request('staff_refresh', { refresh_token: s.refresh_token });
      sess.save({ access_token: out.access_token, refresh_token: out.refresh_token, expires_at: out.expires_at, profile: out.profile });
      return out;
    })();
    try { return await refreshing; } finally { refreshing = null; }
  }
  const isAuthErr = (e) => e && (e.status === 401 || ['STAFF_NOT_AUTHORIZED', 'CUSTOMER_NOT_ACTIVE'].includes(e.code));
  async function api(action, data = {}) {
    let s = sess.load();
    if (!s) { authLost(); throw new ApiError(kind === 'staff' ? 'STAFF_LOGIN_REQUIRED' : 'CUSTOMER_SESSION_REQUIRED', 401); }
    try {
      if (kind === 'staff') {
        if (s.expires_at && s.expires_at * 1000 - Date.now() < 60000) { await refreshStaff(); s = sess.load(); }
        try { return await request(action, data, s.access_token); }
        catch (e) {
          if (e.status === 401 && e.code === 'STAFF_SESSION_INVALID') { await refreshStaff(); s = sess.load(); return await request(action, data, s.access_token); }
          throw e;
        }
      }
      return await request(action, data, s.session_token);
    } catch (e) {
      if (isAuthErr(e) && e.code !== 'NETWORK_ERROR') { sess.clear(); authLost(); }
      throw e;
    }
  }
  function authLost() { if (authLostCb) authLostCb(); }

  async function logout() {
    const s = sess.load();
    try {
      const p = s ? request(kind === 'staff' ? 'staff_logout' : 'customer_logout', {}, kind === 'staff' ? s.access_token : s.session_token) : Promise.resolve();
      await Promise.race([p, new Promise((r) => setTimeout(r, 3000))]);
    } catch { /* best effort: local session is cleared regardless */ }
    sess.clear();
    location.reload();
  }

  /* ------------------------------------------------------------ auth screen */
  function showAuth({ mode, onDone }) {
    document.body.classList.add('locked');
    let box = $('#rr-auth'); if (box) box.remove();
    box = document.createElement('div'); box.id = 'rr-auth'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    const isStaff = mode === 'staff';
    box.innerHTML = `<div class="box"><div class="logo"><img src="icons/logo.png" alt="" width="44" height="44"><b class="brand" style="font:700 15px Manrope,sans-serif;letter-spacing:.14em">RADIO REWARDS</b></div>
      <h2 data-i18n="${isStaff ? 'auth.staff.title' : 'auth.customer.title'}"></h2><p class="mut" data-i18n="${isStaff ? 'auth.staff.sub' : 'auth.customer.sub'}"></p>
      ${isStaff ? '' : `<div class="seg" role="tablist"><button type="button" data-m="register" class="on" data-i18n="auth.register"></button><button type="button" data-m="login" data-i18n="auth.login"></button></div>`}
      <form id="rr-form" novalidate>
        ${isStaff ? `<div class="field"><label for="rr-email" data-i18n="auth.email"></label><input id="rr-email" name="email" type="email" autocomplete="username" required></div>
        <div class="field"><label for="rr-pw" data-i18n="auth.password"></label><div class="pwrow"><input id="rr-pw" name="password" type="password" autocomplete="current-password" required><button type="button" id="rr-pwt" data-i18n="auth.show"></button></div></div>`
        : `<div class="field"><label for="rr-name" data-i18n="auth.name"></label><input id="rr-name" name="name" type="text" autocomplete="name" maxlength="80" required></div>
        <div class="field"><label for="rr-phone" data-i18n="auth.phone"></label><input id="rr-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01012345678" required><small class="mut" data-i18n="auth.phone.hint"></small></div>`}
        <p id="rr-err" class="err-text" role="alert" aria-live="assertive"></p>
        <button class="btn" id="rr-submit" type="submit" style="width:100%"></button>
        ${isStaff ? '' : '<p class="mut" style="font-size:12px;margin:12px 0 0" data-i18n="auth.noOtp"></p>'}
        <p style="text-align:center;margin:14px 0 0"><button type="button" class="chip" id="rr-lang2"></button></p>
      </form></div>`;
    document.body.appendChild(box);
    let m = isStaff ? 'staff' : 'register';
    const err = $('#rr-err', box), submit = $('#rr-submit', box);
    const label = () => { submit.textContent = t(isStaff ? 'auth.login' : (m === 'register' ? 'auth.register' : 'auth.login')); $('#rr-lang2', box).textContent = lang === 'ar' ? 'English' : 'العربية'; };
    const render = () => { applyI18n(box); label(); const pt = $('#rr-pwt', box); if (pt) pt.textContent = t($('#rr-pw', box).type === 'password' ? 'auth.show' : 'auth.hide'); };
    onLang(() => { if ($('#rr-auth')) render(); });
    render();
    $$('.seg button', box).forEach((b) => b.addEventListener('click', () => {
      m = b.dataset.m; $$('.seg button', box).forEach((x) => x.classList.toggle('on', x === b)); err.textContent = ''; label();
    }));
    const pt = $('#rr-pwt', box);
    if (pt) pt.addEventListener('click', () => { const i = $('#rr-pw', box); i.type = i.type === 'password' ? 'text' : 'password'; render(); });
    $('#rr-lang2', box).addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
    const first = $(isStaff ? '#rr-email' : '#rr-name', box); if (first) first.focus();
    $('#rr-form', box).addEventListener('submit', async (ev) => {
      ev.preventDefault(); err.textContent = '';
      submit.disabled = true; submit.innerHTML = `<span class="spin"></span> ${esc(t('auth.submitting'))}`;
      try {
        let out;
        if (isStaff) {
          out = await request('staff_login', { email: $('#rr-email', box).value.trim(), password: $('#rr-pw', box).value });
          sess.save({ access_token: out.access_token, refresh_token: out.refresh_token, expires_at: out.expires_at, profile: out.profile });
        } else {
          out = await request(m === 'register' ? 'register_customer' : 'customer_login', { full_name: $('#rr-name', box).value, phone: $('#rr-phone', box).value });
          sess.save({ session_token: out.session_token, expires_at: out.expires_at, customer: out.customer });
        }
        box.remove(); document.body.classList.remove('locked'); onDone(out);
      } catch (e) { err.textContent = errMsg(e.code || 'SERVER_ERROR'); submit.disabled = false; label(); }
    });
  }

  /* ------------------------------------------------------------ boot */
  function boot({ kind: k, roles, start }) {
    kind = k;
    document.body.dataset.v = k;
    applyI18n();
    const lg = $('#lg'); if (lg) lg.addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
    $$('[data-act=signout]').forEach((b) => b.addEventListener('click', logout));
    registerSW();
    const run = async () => {
      const s = sess.load();
      if (k === 'staff' && s && roles && !roles.includes(s.profile && s.profile.role)) {
        // Role may have changed server-side: confirm with the server before showing the page.
        try { const me = await api('staff_me'); s.profile = me.profile; sess.save(s); } catch { /* handled by authLost */ }
      }
      const cur = sess.load();
      if (k === 'staff' && cur && roles && !roles.includes(cur.profile && cur.profile.role)) return showDenied();
      document.body.classList.remove('locked');
      try { await start(cur); } catch (e) { if (!isAuthErr(e)) { console.error(e); toast(errMsg(e.code || 'SERVER_ERROR'), 'bad'); } }
    };
    const login = () => showAuth({ mode: k, onDone: () => { run(); } });
    authLostCb = () => { if (!$('#rr-auth')) login(); };
    if (!sess.load()) login(); else run();
  }
  function showDenied() {
    document.body.classList.add('locked');
    const d = document.createElement('div'); d.id = 'rr-auth';
    d.innerHTML = `<div class="box"><h2 data-i18n="staff.role.title"></h2><p class="mut" data-i18n="staff.role.msg"></p><p><a class="btn" href="cashier.html" data-i18n="staff.role.go"></a></p><p><button class="chip" data-act="signout" data-i18n="signout"></button></p></div>`;
    document.body.appendChild(d); applyI18n(d);
    $$('[data-act=signout]', d).forEach((b) => b.addEventListener('click', logout));
  }

  /* ------------------------------------------------------------ PWA */
  let deferredPrompt = null;
  const installCbs = [];
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; installCbs.forEach((f) => f(true)); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; installCbs.forEach((f) => f(false)); });
  async function install() { if (!deferredPrompt) return false; deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch { /* ignore */ } deferredPrompt = null; return true; }
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function registerSW() {
    if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW registration failed', e));
  }

  /* ------------------------------------------------------------ small UI helpers */
  async function busy(btn, fn) {
    if (!btn) return fn();
    const old = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${esc(t('loading'))}`;
    try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = old; }
  }
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15); return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
  const memberNo = (n) => 'RR-' + String(n || 0).padStart(6, '0');

  window.RR = { $, $$, esc, add, t, setLang, onLang, applyI18n, getLang: () => lang, fmtDate, fmtDay, num, pick, errMsg, toast, api, request, boot, logout,
    session: () => sess.load(), install, isStandalone, isIOS, onInstallChange: (f) => installCbs.push(f), canInstall: () => !!deferredPrompt, busy, uuid, memberNo, ApiError };
})();
