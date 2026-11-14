/* RADIO REWARDS — customer app logic */
(() => {
  'use strict';
  const { $, $$, esc, t, add, api, num, fmtDate, fmtDay, pick, toast, errMsg } = RR;

  add({
    'title.customer': 'My card', 'lang.aria': 'Language', 'cup.aria': 'RADIO coffee cup showing your loyalty progress',
    'nav.home': 'Home', 'nav.rewards': 'Rewards', 'nav.card': 'Card', 'nav.activity': 'Activity', 'nav.profile': 'Profile',
    'greet.morning': 'Good morning', 'greet.afternoon': 'Good afternoon', 'greet.evening': 'Good evening',
    'head.ready': '{name}, a free reward is waiting for you!', 'head.one': '{name}, you’re 1 drink from a free {reward}', 'head.n': '{name}, you’re {n} drinks from a free {reward}',
    'reward.generic': 'reward', 'badge.unlocked': 'Reward unlocked: {reward}',
    'home.collected': 'drinks collected', 'home.remaining': 'drinks remaining', 'home.next': 'Next reward', 'home.showqr': 'Show my QR', 'home.recent': 'Recent activity',
    'home.nextTxt': '{reward} at {n} drinks', 'home.none': 'No activity yet. Your first drink will show up here.',
    'card.title': 'Membership card', 'card.member': 'Member', 'card.holder': 'Member', 'card.qr.aria': 'Your personal QR code',
    'card.refresh': 'Refresh code', 'card.hint': 'Show this code to the cashier. It changes every 30 seconds, so a screenshot can’t be reused.',
    'card.expires': 'Code refreshes in {s}s', 'card.loading': 'Preparing your code…', 'card.offline': 'Couldn’t load your code.',
    'rw.title': 'Rewards', 'rw.progress': 'Your progress', 'rw.history': 'Redemption history',
    'rw.ready': '{n} reward(s) ready to redeem', 'rw.ready.d': 'Show your QR code to the cashier to redeem. Only the cashier can redeem rewards.', 'rw.show': 'Show my QR',
    'rw.of': '{a} of {b} drinks', 'rw.nohist': 'No rewards redeemed yet.', 'rw.none': 'No rewards are available right now.', 'rw.redeemed': 'Redeemed',
    'act.title': 'Activity', 'act.drink': 'Drink', 'act.qty': '{n} × {drink}', 'act.redeemed': '{reward} redeemed', 'act.joined': 'Joined RADIO REWARDS',
    'act.joined.d': '{d} · {n} drinks so far', 'act.none': 'Nothing here yet.',
    'prof.title': 'Profile', 'prof.name': 'Name', 'prof.phone': 'Phone', 'prof.no': 'Member no.', 'prof.since': 'Member since', 'prof.tier': 'Tier', 'prof.lang': 'Language',
    'tier.Gold': 'Gold', 'tier.Silver': 'Silver', 'tier.New': 'New',
    'prof.push': 'App notifications', 'prof.push.d': 'Reward and offer alerts on this phone.',
    'push.on': 'Notifications are on.', 'push.off': 'Notifications are off.', 'push.denied': 'Notifications are blocked in your browser settings.',
    'push.unsupported': 'This browser doesn’t support push notifications.', 'push.notsetup': 'Push notifications aren’t enabled for this café yet.',
    'push.ios': 'On iPhone, add the app to your Home Screen first, then enable notifications.', 'push.fail': 'Couldn’t turn notifications on.',
    'prof.install': 'Install the app', 'prof.ios': 'To install: tap Share, then “Add to Home Screen”.',
    'prof.nearby': 'Nearby alert', 'prof.nearby.d': 'Get a reminder when you’re close to RADIO CAFÉ.', 'prof.preview': 'Preview the alert',
    'prof.nearby.limit': 'Works while this page is open. Alerts in the background need a native app or a Wallet card — web browsers can’t do that reliably.',
    'nb.on': 'Watching your location while the app is open.', 'nb.off': 'Nearby alert is off.', 'nb.denied': 'Location access was denied.', 'nb.unsupported': 'This browser doesn’t support location.',
    'nb.insecure': 'Location needs a secure (HTTPS) page.', 'nb.nocafe': 'The café location isn’t set yet.', 'nb.disabled': 'Nearby alerts are turned off by the café.',
    'nearby.title': 'RADIO CAFÉ', 'nearby.msg': 'What are you waiting for? Your card is waiting for you.',
  }, {
    'title.customer': 'كارتي', 'lang.aria': 'اللغة', 'cup.aria': 'كوب راديو بيوضّح تقدمك في المكافآت',
    'nav.home': 'الرئيسية', 'nav.rewards': 'المكافآت', 'nav.card': 'الكارت', 'nav.activity': 'النشاط', 'nav.profile': 'حسابي',
    'greet.morning': 'صباح الخير', 'greet.afternoon': 'مساء الخير', 'greet.evening': 'مساء النور',
    'head.ready': '{name}، في مكافأة ببلاش مستنياك!', 'head.one': '{name}، فاضلك مشروب واحد على {reward} ببلاش', 'head.n': '{name}، فاضلك {n} مشروبات على {reward} ببلاش',
    'reward.generic': 'مكافأة', 'badge.unlocked': 'اتفتحت مكافأة: {reward}',
    'home.collected': 'مشروبات اتجمعت', 'home.remaining': 'مشروبات فاضلة', 'home.next': 'المكافأة الجاية', 'home.showqr': 'اعرض الكود', 'home.recent': 'آخر نشاط',
    'home.nextTxt': '{reward} عند {n} مشروبات', 'home.none': 'لسه مفيش نشاط. أول مشروب هيظهر هنا.',
    'card.title': 'كارت العضوية', 'card.member': 'عضو', 'card.holder': 'العضو', 'card.qr.aria': 'كود QR الخاص بيك',
    'card.refresh': 'تحديث الكود', 'card.hint': 'اعرض الكود ده للكاشير. بيتغيّر كل 30 ثانية فمينفعش حد يستخدم سكرين شوت.',
    'card.expires': 'الكود هيتحدّث بعد {s} ث', 'card.loading': 'بجهّز الكود…', 'card.offline': 'مقدرتش أحمّل الكود.',
    'rw.title': 'المكافآت', 'rw.progress': 'تقدّمك', 'rw.history': 'سجل الاستلام',
    'rw.ready': '{n} مكافأة جاهزة للاستلام', 'rw.ready.d': 'اعرض كود QR على الكاشير عشان يسلّمهالك. الكاشير بس هو اللي يقدر يسلّم المكافآت.', 'rw.show': 'اعرض الكود',
    'rw.of': '{a} من {b} مشروبات', 'rw.nohist': 'لسه ماستلمتش مكافآت.', 'rw.none': 'مفيش مكافآت متاحة دلوقتي.', 'rw.redeemed': 'تم الاستلام',
    'act.title': 'النشاط', 'act.drink': 'مشروب', 'act.qty': '{n} × {drink}', 'act.redeemed': 'استلمت {reward}', 'act.joined': 'انضممت لـ RADIO REWARDS',
    'act.joined.d': '{d} · {n} مشروب لحد دلوقتي', 'act.none': 'مفيش حاجة هنا لسه.',
    'prof.title': 'حسابي', 'prof.name': 'الاسم', 'prof.phone': 'الموبايل', 'prof.no': 'رقم العضوية', 'prof.since': 'عضو من', 'prof.tier': 'المستوى', 'prof.lang': 'اللغة',
    'tier.Gold': 'ذهبي', 'tier.Silver': 'فضي', 'tier.New': 'جديد',
    'prof.push': 'إشعارات التطبيق', 'prof.push.d': 'تنبيهات المكافآت والعروض على موبايلك.',
    'push.on': 'الإشعارات شغالة.', 'push.off': 'الإشعارات متوقفة.', 'push.denied': 'الإشعارات محظورة من إعدادات المتصفح.',
    'push.unsupported': 'المتصفح ده مش بيدعم الإشعارات.', 'push.notsetup': 'الإشعارات لسه متفعّلتش للكافيه.',
    'push.ios': 'على الآيفون ضيف التطبيق للشاشة الرئيسية الأول وبعدين فعّل الإشعارات.', 'push.fail': 'معرفتش أشغّل الإشعارات.',
    'prof.install': 'ثبّت التطبيق', 'prof.ios': 'للتثبيت: اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».',
    'prof.nearby': 'تنبيه القرب', 'prof.nearby.d': 'يفكّرك لما تكون قريب من RADIO CAFÉ.', 'prof.preview': 'جرّب التنبيه',
    'prof.nearby.limit': 'بيشتغل والصفحة مفتوحة. التنبيه في الخلفية محتاج تطبيق أصلي أو كارت في المحفظة — متصفحات الويب مش بتعمل كده بشكل موثوق.',
    'nb.on': 'بتابع موقعك طول ما التطبيق مفتوح.', 'nb.off': 'تنبيه القرب متوقف.', 'nb.denied': 'تم رفض الوصول للموقع.', 'nb.unsupported': 'المتصفح ده مش بيدعم تحديد الموقع.',
    'nb.insecure': 'تحديد الموقع محتاج صفحة آمنة (HTTPS).', 'nb.nocafe': 'موقع الكافيه لسه مش متحدد.', 'nb.disabled': 'تنبيهات القرب متوقفة من الكافيه.',
    'nearby.title': 'RADIO CAFÉ', 'nearby.msg': 'مستني إيه؟ كارتك مستنيك',
  });

  const NAV = [['home', 'M4 11l8-7 8 7v9h-5v-6H9v6H4z'], ['rewards', 'M4 9h16v4H4zM6 13v7h12v-7M12 9v11M12 9c-3 0-4-4-1-4 2 0 1 4 1 4zm0 0c3 0 4-4 1-4-2 0-1 4-1 4z'],
    ['card', 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM19 14v6M14 20h3'], ['activity', 'M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4'], ['profile', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-5 15-5 16 0']];
  const ROUTES = NAV.map((n) => n[0]);
  let me = null, route = 'home', qrTimer = null, tickTimer = null, qrExpiry = 0, qrBusy = false;
  const tierOf = (n) => (n >= 25 ? 'Gold' : n >= 10 ? 'Silver' : 'New'); // display-only (unconfirmed business rule — see report)

  function renderNav() {
    $('#bn').innerHTML = NAV.map(([id, d]) => `<a href="#${id}" data-n="${id}"${id === 'card' ? ' class="c"' : ''} aria-label="${esc(t('nav.' + id))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>${id === 'card' ? '' : esc(t('nav.' + id))}</a>`).join('');
    $$('#bn a').forEach((a) => a.classList.toggle('on', a.dataset.n === route));
  }

  /* ----- derived values */
  const required = () => Number((me.settings && me.settings.drinks_required) || 10) || 10;
  // The headline already says "a free …", so drop a leading "Free" / trailing "ببلاش" from the reward's own name.
  const rewardName = () => { const r = (me.rewards || [])[0]; if (!r) return t('reward.generic'); return pick(r).replace(/^\s*free\s+/i, '').replace(/\s*ببلاش\s*/g, ' ').trim() || pick(r); };
  const firstName = () => (me.customer.full_name || '').split(' ')[0];

  function renderHome() {
    const c = me.customer, req = required(), cnt = c.drink_count, rem = Math.max(0, req - cnt);
    const h = new Date().getHours();
    $('#greet').textContent = t(h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening');
    const ready = c.available_rewards > 0;
    $('#headline').textContent = ready ? t('head.ready', { name: firstName() }) : rem === 1 ? t('head.one', { name: firstName(), reward: rewardName() }) : t('head.n', { name: firstName(), n: num(rem), reward: rewardName() });
    $('#cnt').textContent = num(cnt); $('#rem').textContent = num(rem);
    const p = Math.min(100, Math.round((cnt / req) * 100));
    $('#pb').style.setProperty('--p', p + '%');
    $('#liq').style.transform = `translateY(${Math.round(250 - 180 * (ready ? 1 : cnt / req))}px)`;
    $('#stage').classList.toggle('win', ready);
    $('#badge').textContent = t('badge.unlocked', { reward: rewardName() });
    $('#nextTxt').textContent = t('home.nextTxt', { reward: rewardName(), n: num(req) });
    const items = feed().slice(0, 3);
    $('#recent').innerHTML = items.length ? items.map((i) => `<div class="li"><span class="d">${i.reward ? '✦' : '☕'}</span><div>${esc(i.title)}</div><small>${esc(fmtDay(i.at))}</small></div>`).join('') : `<p class="empty">${esc(t('home.none'))}</p>`;
  }

  function feed() {
    const tx = (me.transactions || []).map((x) => ({ at: x.created_at, reward: false, title: x.quantity > 1 ? t('act.qty', { n: num(x.quantity), drink: pick(x.drinks) || t('act.drink') }) : (pick(x.drinks) || t('act.drink')) }));
    const rd = (me.redemptions || []).map((x) => ({ at: x.created_at, reward: true, title: t('act.redeemed', { reward: pick(x.rewards) || t('reward.generic') }) }));
    return [...tx, ...rd].sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  function renderCard() {
    const c = me.customer;
    $('#cName').textContent = c.full_name; $('#cNo').textContent = RR.memberNo(c.member_number);
  }

  function drawQr(text) {
    const svg = RRQR.toSvg(RRQR.encode(text), 2, t('card.qr.aria'));
    $('#qrBig').innerHTML = svg; $('#qrSmall').innerHTML = svg;
  }
  async function loadQr() {
    if (qrBusy || route !== 'card') return;
    qrBusy = true; $('#qrStatus').textContent = t('card.loading');
    try {
      const out = await api('issue_qr');
      drawQr(out.qr); qrExpiry = Date.now() + (out.refresh_seconds || 25) * 1000;
      clearTimeout(qrTimer); qrTimer = setTimeout(() => { qrBusy = false; loadQr(); }, (out.refresh_seconds || 25) * 1000);
    } catch (e) {
      $('#qrStatus').textContent = e.code === 'NETWORK_ERROR' ? t('card.offline') : errMsg(e.code);
      clearTimeout(qrTimer); qrTimer = setTimeout(() => { qrBusy = false; loadQr(); }, 8000);
    } finally { qrBusy = false; }
  }
  function startQrLoop() {
    stopQrLoop(); loadQr();
    tickTimer = setInterval(() => { const s = Math.max(0, Math.round((qrExpiry - Date.now()) / 1000)); if (qrExpiry && $('#qrBig svg')) $('#qrStatus').textContent = t('card.expires', { s }); }, 1000);
  }
  function stopQrLoop() { clearTimeout(qrTimer); clearInterval(tickTimer); qrTimer = tickTimer = null; qrExpiry = 0; }

  function renderRewards() {
    const c = me.customer, req = required();
    $('#rwReady').innerHTML = c.available_rewards > 0
      ? `<div class="rw a1"><span class="ic">${num(c.available_rewards)}</span><div><h3>${esc(t('rw.ready', { n: num(c.available_rewards) }))}</h3><p class="mut">${esc(t('rw.ready.d'))}</p></div><a class="btn" href="#card">${esc(t('rw.show'))}</a></div>` : '';
    const rs = me.rewards || [];
    $('#rwProgress').innerHTML = rs.length ? rs.map((r, i) => `<div class="rw a2" style="margin-bottom:10px"><span class="ic">☕</span><div><h3>${esc(pick(r))}</h3><p class="mut">${esc(r.description || '')}</p><p class="mut">${esc(t('rw.of', { a: num(c.drink_count), b: num(req) }))}</p><div class="bar"><b style="--p:${Math.min(100, Math.round(c.drink_count / req * 100))}%"></b></div></div></div>`).join('') : `<p class="empty">${esc(t('rw.none'))}</p>`;
    const rd = me.redemptions || [];
    $('#rwHistory').innerHTML = rd.length ? rd.map((x) => `<div class="li"><span class="d">✦</span><div>${esc(pick(x.rewards) || t('reward.generic'))}<br><span class="mut">${esc(t('rw.redeemed'))}</span></div><small>${esc(fmtDate(x.created_at))}</small></div>`).join('') : `<p class="empty">${esc(t('rw.nohist'))}</p>`;
  }

  function renderActivity() {
    const c = me.customer, items = feed();
    const rows = items.map((i) => `<div class="gl"><h3>${esc(i.title)}</h3><p class="mut">${esc(fmtDate(i.at))}</p></div>`);
    rows.push(`<div class="gl"><h3>${esc(t('act.joined'))}</h3><p class="mut">${esc(t('act.joined.d', { d: fmtDay(c.created_at), n: num(c.total_drinks) }))}</p></div>`);
    $('#timeline').innerHTML = rows.join('');
  }

  function renderProfile() {
    const c = me.customer;
    $('#profInfo').innerHTML = [
      ['prof.name', esc(c.full_name)], ['prof.phone', `<bdi dir="ltr">${esc(c.phone)}</bdi>`], ['prof.no', `<bdi dir="ltr">${esc(RR.memberNo(c.member_number))}</bdi>`],
      ['prof.since', esc(fmtDay(c.created_at))], ['prof.tier', `<span class="go">${esc(t('tier.' + tierOf(c.total_drinks)))}</span>`],
    ].map(([k, v]) => `<div class="li"><span>${esc(t(k))}</span><small>${v}</small></div>`).join('');
    $('#langRow').textContent = RR.getLang() === 'ar' ? 'English' : 'العربية';
    paintPush(); paintNearby();
  }

  function renderAll() { if (!me) return; renderNav(); renderHome(); renderCard(); renderRewards(); renderActivity(); renderProfile(); }

  /* ----- routing */
  function go() {
    const h = (location.hash || '#home').slice(1); route = ROUTES.includes(h) ? h : 'home';
    ROUTES.forEach((r) => { const s = $('#' + r); if (s) s.hidden = r !== route; });
    $$('#bn a').forEach((a) => a.classList.toggle('on', a.dataset.n === route));
    window.scrollTo(0, 0);
    if (route === 'card') startQrLoop(); else stopQrLoop();
    if (me && route !== 'card') refresh(true);
  }
  let lastRefresh = 0;
  async function refresh(quiet) {
    if (quiet && Date.now() - lastRefresh < 8000) return;
    lastRefresh = Date.now();
    try { me = await api('customer_me'); renderAll(); } catch (e) { if (!quiet && e.status !== 401) toast(errMsg(e.code), 'bad'); }
  }

  /* ----- nearby alert (works while the page is open) */
  const NB_KEY = 'rr_nearby_on', NB_LAST = 'rrn';
  let watchId = null, cfg = {};
  const dist = (a, b, c, d) => { const R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r; const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const nearbyMsg = () => (RR.getLang() === 'ar' ? (cfg.nearby_message || t('nearby.msg')) : t('nearby.msg'));
  function say(sel, key) { const el = $(sel); el.dataset.k = key || ''; el.textContent = key ? t(key) : ''; }
  async function ping(force) {
    $('#nh').textContent = t('nearby.title'); $('#nm').textContent = nearbyMsg();
    $('#nt').classList.add('on'); setTimeout(() => $('#nt').classList.remove('on'), 7000);
    try { if (window.Notification && Notification.permission === 'granted' && navigator.serviceWorker) { const reg = await navigator.serviceWorker.ready; reg.showNotification(t('nearby.title'), { body: nearbyMsg(), icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './#card' }, tag: 'rr-nearby' }); } } catch { /* ignore */ }
  }
  function stopWatch() { if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; } }
  function startWatch() {
    stopWatch();
    watchId = navigator.geolocation.watchPosition((p) => {
      if (dist(p.coords.latitude, p.coords.longitude, Number(cfg.latitude), Number(cfg.longitude)) <= Number(cfg.geofence_radius || 500)) {
        const now = Date.now(); let last = 0; try { last = +localStorage.getItem(NB_LAST) || 0; } catch { /* ignore */ }
        if (now - last > 6 * 3600e3) { try { localStorage.setItem(NB_LAST, String(now)); } catch { /* ignore */ } ping(); }
      }
    }, (err) => { if (err.code === 1) { localStorage.setItem(NB_KEY, '0'); stopWatch(); paintNearby('nb.denied'); } }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 });
  }
  function nearbyBlock() {
    if (cfg.nearby_alert_enabled === false) return 'nb.disabled';
    if (cfg.latitude == null || cfg.longitude == null) return 'nb.nocafe';
    if (!('geolocation' in navigator)) return 'nb.unsupported';
    if (!window.isSecureContext) return 'nb.insecure';
    return '';
  }
  function paintNearby(forced) {
    const on = localStorage.getItem(NB_KEY) === '1' && !nearbyBlock();
    const sw = $('#nb'); sw.classList.toggle('off', !on); sw.setAttribute('aria-checked', String(on));
    say('#ns', forced || nearbyBlock() || (on ? 'nb.on' : 'nb.off'));
  }
  async function toggleNearby() {
    const blocked = nearbyBlock(); if (blocked) return paintNearby();
    if (localStorage.getItem(NB_KEY) === '1') { localStorage.setItem(NB_KEY, '0'); stopWatch(); return paintNearby(); }
    try { if (window.Notification && Notification.permission === 'default') await Notification.requestPermission(); } catch { /* optional */ }
    localStorage.setItem(NB_KEY, '1'); startWatch(); paintNearby();
  }

  /* ----- web push (needs VAPID key configured on the server; see deployment guide) */
  const b64ToU8 = (s) => { const p = '='.repeat((4 - s.length % 4) % 4), b = (s + p).replace(/-/g, '+').replace(/_/g, '/'), r = atob(b); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
  async function paintPush(forced) {
    const sw = $('#pn'); let key = forced;
    let on = false;
    if (!key) {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !window.Notification) key = RR.isIOS() && !RR.isStandalone() ? 'push.ios' : 'push.unsupported';
      else if (!cfg.vapid_public_key) key = 'push.notsetup';
      else if (Notification.permission === 'denied') key = 'push.denied';
      else { try { const reg = await navigator.serviceWorker.ready; on = !!(await reg.pushManager.getSubscription()); } catch { /* ignore */ } key = on ? 'push.on' : 'push.off'; }
    }
    sw.disabled = ['push.ios', 'push.unsupported', 'push.notsetup', 'push.denied'].includes(key);
    sw.classList.toggle('off', !on); sw.setAttribute('aria-checked', String(on)); say('#ps', key);
  }
  async function togglePush() {
    const sw = $('#pn'); if (sw.disabled) return;
    try {
      const reg = await navigator.serviceWorker.ready, cur = await reg.pushManager.getSubscription();
      if (cur) { await api('push_unsubscribe', { endpoint: cur.endpoint }).catch(() => {}); await cur.unsubscribe(); return paintPush(); }
      if ((await Notification.requestPermission()) !== 'granted') return paintPush('push.denied');
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(cfg.vapid_public_key) });
      await api('push_subscribe', { subscription: sub.toJSON() }); paintPush();
    } catch (e) { console.warn(e); paintPush('push.fail'); }
  }

  /* ----- install */
  function paintInstall() {
    const ib = $('#ib'), hint = $('#iosHint');
    ib.hidden = !RR.canInstall() || RR.isStandalone();
    hint.hidden = !(RR.isIOS() && !RR.isStandalone());
  }

  /* ----- start */
  RR.boot({
    kind: 'customer',
    async start() {
      $('#nt').classList.remove('on');
      me = await api('customer_me');
      try { cfg = await RR.request('public_config'); } catch { cfg = me.settings || {}; }
      renderAll(); go();
      if (localStorage.getItem(NB_KEY) === '1' && !nearbyBlock()) startWatch();
      paintInstall();
    },
  });
  addEventListener('hashchange', go);
  RR.onLang(() => { renderAll(); if (me) { paintPush(); } });
  RR.onInstallChange(paintInstall);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && me) { if (route === 'card') { clearTimeout(qrTimer); qrBusy = false; loadQr(); } else refresh(true); } });
  $('#qrRefresh').addEventListener('click', () => { clearTimeout(qrTimer); qrBusy = false; loadQr(); });
  $('#langRow').addEventListener('click', () => RR.setLang(RR.getLang() === 'ar' ? 'en' : 'ar'));
  $('#ib').addEventListener('click', () => RR.install());
  $('#pn').addEventListener('click', togglePush);
  $('#nb').addEventListener('click', toggleNearby);
  $('#nd').addEventListener('click', () => ping(true));
  document.getElementById('nt').addEventListener('click', () => $('#nt').classList.remove('on'));
})();
