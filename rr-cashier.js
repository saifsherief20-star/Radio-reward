/* RADIO REWARDS — cashier dashboard logic */
(() => {
  'use strict';
  const { $, $$, esc, t, add, api, num, fmtDate, pick, toast, errMsg } = RR;

  add({
    'title.cashier': 'Cashier', 'lang.aria': 'Language',
    'scan.title': 'Scan customer QR', 'scan.idle': 'Camera is off', 'scan.live': 'Point the camera at the customer’s QR code', 'scan.start': 'Start camera', 'scan.stop': 'Stop camera',
    'scan.starting': 'Starting camera…', 'scan.denied': 'Camera permission was denied. Allow camera access in the browser settings, or search for the customer below.',
    'scan.nocam': 'No camera was found on this device. Search for the customer below.', 'scan.busy': 'The camera is being used by another app.',
    'scan.unsupported': 'Camera scanning isn’t supported here (it needs HTTPS and a modern browser). Search for the customer below.',
    'scan.libfail': 'The scanner component couldn’t be loaded (check the internet connection). Search for the customer below.', 'scan.fail': 'Couldn’t start the camera. Search for the customer below.',
    'scan.checking': 'Checking the code…', 'scan.badqr': 'This is not a Radio Café QR code.',
    'find.title': 'Find a customer', 'find.ph': 'Phone, name or RR-number', 'find.btn': 'Search', 'find.none': 'No customer found.', 'find.short': 'Type at least 3 digits of the phone, or 2 letters of the name.',
    'find.disabled': 'disabled',
    'cust.selected': 'Selected customer', 'cust.points': 'drinks toward next reward', 'cust.rewards': 'rewards available', 'cust.done': 'Done — next customer',
    'src.qr': 'QR scanned', 'src.manual': 'Manual lookup',
    'hold.left': 'This scan stays valid for {s} more seconds.', 'hold.expired': 'The scan expired. Scan the customer’s QR again{manual}.', 'hold.manualOk': ' or register manually',
    'buy.title': 'Register purchase', 'buy.drink': 'Drink', 'buy.qty': 'Number of drinks', 'buy.less': 'Fewer', 'buy.more': 'More', 'buy.btn': 'Register purchase',
    'buy.pick': 'Choose the drink first.', 'buy.manualOff': 'Manual registration is turned off. Scan the customer’s QR code to register a purchase.',
    'buy.ok': 'Purchase registered', 'buy.dup': 'Already registered', 'buy.dup.d': 'This purchase had already been saved. Nothing was added twice.',
    'buy.sum': '{n} × {drink} for {name}', 'buy.points': 'Progress: {a} of {b} drinks', 'buy.earned': 'Reward earned! {n} reward(s) now available.',
    'claim.title': 'Redeem a reward', 'claim.btn': 'Redeem reward', 'claim.confirm': 'Redeem “{reward}” for {name}?', 'claim.ok': 'Reward redeemed', 'claim.dup': 'Already redeemed', 'claim.left': '{n} reward(s) left for this customer.',
    'hist.title': 'My recent transactions', 'hist.refresh': 'Refresh', 'hist.none': 'No transactions yet.', 'hist.rewardRow': 'Reward: {reward}', 'hist.qr': 'QR', 'hist.manual': 'Manual',
    'res.again': 'Next customer',
  }, {
    'title.cashier': 'الكاشير', 'lang.aria': 'اللغة',
    'scan.title': 'مسح كود العميل', 'scan.idle': 'الكاميرا مقفولة', 'scan.live': 'وجّه الكاميرا على كود QR بتاع العميل', 'scan.start': 'شغّل الكاميرا', 'scan.stop': 'اقفل الكاميرا',
    'scan.starting': 'بشغّل الكاميرا…', 'scan.denied': 'تم رفض إذن الكاميرا. اسمح بالكاميرا من إعدادات المتصفح، أو دوّر على العميل تحت.',
    'scan.nocam': 'مفيش كاميرا على الجهاز ده. دوّر على العميل تحت.', 'scan.busy': 'الكاميرا مستخدمة في تطبيق تاني.',
    'scan.unsupported': 'مسح الكاميرا مش مدعوم هنا (محتاج HTTPS ومتصفح حديث). دوّر على العميل تحت.',
    'scan.libfail': 'معرفتش أحمّل مكوّن المسح (اتأكد من الإنترنت). دوّر على العميل تحت.', 'scan.fail': 'معرفتش أشغّل الكاميرا. دوّر على العميل تحت.',
    'scan.checking': 'بتأكد من الكود…', 'scan.badqr': 'ده مش كود QR بتاع راديو كافيه.',
    'find.title': 'دوّر على عميل', 'find.ph': 'الموبايل أو الاسم أو رقم RR', 'find.btn': 'بحث', 'find.none': 'مفيش عميل بالبيانات دي.', 'find.short': 'اكتب 3 أرقام على الأقل من الموبايل، أو حرفين من الاسم.',
    'find.disabled': 'موقوف',
    'cust.selected': 'العميل المختار', 'cust.points': 'مشروبات للمكافأة الجاية', 'cust.rewards': 'مكافآت متاحة', 'cust.done': 'تمام — العميل اللي بعده',
    'src.qr': 'تم مسح الكود', 'src.manual': 'بحث يدوي',
    'hold.left': 'المسح ده صالح {s} ثانية كمان.', 'hold.expired': 'المسح انتهى. امسح كود العميل تاني{manual}.', 'hold.manualOk': ' أو سجّل يدوي',
    'buy.title': 'تسجيل عملية شراء', 'buy.drink': 'المشروب', 'buy.qty': 'عدد المشروبات', 'buy.less': 'أقل', 'buy.more': 'أكتر', 'buy.btn': 'سجّل العملية',
    'buy.pick': 'اختار المشروب الأول.', 'buy.manualOff': 'التسجيل اليدوي متوقف. امسح كود QR بتاع العميل عشان تسجّل عملية.',
    'buy.ok': 'تم تسجيل العملية', 'buy.dup': 'متسجّلة قبل كده', 'buy.dup.d': 'العملية دي كانت اتحفظت بالفعل. مفيش حاجة اتضافت مرتين.',
    'buy.sum': '{n} × {drink} لـ {name}', 'buy.points': 'التقدّم: {a} من {b} مشروبات', 'buy.earned': 'العميل كسب مكافأة! دلوقتي متاح {n} مكافأة.',
    'claim.title': 'تسليم مكافأة', 'claim.btn': 'سلّم المكافأة', 'claim.confirm': 'تسلّم «{reward}» لـ {name}؟', 'claim.ok': 'تم تسليم المكافأة', 'claim.dup': 'اتسلّمت قبل كده', 'claim.left': 'فاضل {n} مكافأة للعميل ده.',
    'hist.title': 'آخر عملياتي', 'hist.refresh': 'تحديث', 'hist.none': 'مفيش عمليات لسه.', 'hist.rewardRow': 'مكافأة: {reward}', 'hist.qr': 'QR', 'hist.manual': 'يدوي',
    'res.again': 'العميل اللي بعده',
  });

  const QR_RE = /^RR1\.[A-Za-z0-9_-]{30,80}$/;
  let boot = { drinks: [], rewards: [], settings: {} };
  let sel = null;            // selected customer
  let drinkId = null, rewardId = null, qty = 1, buyKey = RR.uuid(), claimKey = RR.uuid();
  let holdTimer = null, stream = null, scanLoop = null, html5 = null, lastText = '', lastAt = 0, scanning = false, checking = false;

  /* ================================================================ camera */
  const setMsg = (key) => { $('#scanMsg').textContent = key ? t(key) : ''; $('#scanMsg').dataset.k = key || ''; };
  const hint = (key) => { $('#vfHint').dataset.i18n = key; $('#vfHint').textContent = t(key); };
  function loadLib() {
    if (window.Html5Qrcode) return Promise.resolve();
    const urls = ['https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js', 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'];
    return urls.reduce((p, u) => p.catch(() => new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.onload = () => (window.Html5Qrcode ? res() : rej(new Error('lib'))); s.onerror = () => rej(new Error('lib')); document.head.appendChild(s); })), Promise.reject(new Error('start')));
  }
  function cameraErr(e) {
    const n = (e && (e.name || '')) + ' ' + (e && (e.message || e) || '');
    if (/NotAllowed|Permission|denied/i.test(n)) return 'scan.denied';
    if (/NotFound|DevicesNotFound|no camera|Requested device not found/i.test(n)) return 'scan.nocam';
    if (/NotReadable|TrackStart|in use/i.test(n)) return 'scan.busy';
    return 'scan.fail';
  }
  async function startScan() {
    if (scanning) return;
    setMsg('');
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return setMsg('scan.unsupported');
    scanning = true; $('#startBtn').hidden = true; $('#stopBtn').hidden = false; hint('scan.starting');
    try {
      // Always ask for the camera first so the user gets the accurate reason (denied / no camera / busy),
      // independent of whether the scanner library can load.
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if ('BarcodeDetector' in window) {
        const v = $('#rr-video'); v.srcObject = stream; v.hidden = false; await v.play();
        const det = new BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (!scanning) return;
          try { const codes = await det.detect(v); if (codes.length) onDecoded(codes[0].rawValue); } catch { /* frame not ready */ }
          scanLoop = setTimeout(tick, 250);
        };
        tick();
      } else {
        stream.getTracks().forEach((tr) => tr.stop()); stream = null;   // the library opens its own stream
        try { await loadLib(); } catch { throw Object.assign(new Error('lib'), { name: 'LibError' }); }
        html5 = new Html5Qrcode('rr-reader');
        await html5.start({ facingMode: 'environment' }, { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s }; } }, (text) => onDecoded(text), () => {});
      }
      $('#vf').classList.add('live'); hint('scan.live');
    } catch (e) {
      await stopScan(); setMsg(e && e.name === 'LibError' ? 'scan.libfail' : cameraErr(e));
    }
  }
  async function stopScan() {
    scanning = false; clearTimeout(scanLoop);
    if (stream) { stream.getTracks().forEach((tr) => tr.stop()); stream = null; }
    const v = $('#rr-video'); v.srcObject = null; v.hidden = true;
    if (html5) { try { await html5.stop(); } catch { /* not running */ } try { html5.clear(); } catch { /* ignore */ } html5 = null; }
    $('#vf').classList.remove('live'); $('#startBtn').hidden = false; $('#stopBtn').hidden = true; hint('scan.idle');
  }
  function onDecoded(text) {
    const now = Date.now(); text = String(text || '').trim();
    if (checking || (text === lastText && now - lastAt < 3500)) return;
    lastText = text; lastAt = now; handleScan(text);
  }
  async function handleScan(text) {
    text = String(text || '').trim();
    if (!QR_RE.test(text)) { setMsg('scan.badqr'); if (navigator.vibrate) navigator.vibrate(120); return; }
    checking = true; setMsg('scan.checking');
    try {
      const info = await api('scan_qr', { qr: text });
      setMsg(''); if (navigator.vibrate) navigator.vibrate(60);
      await stopScan();
      select({ id: info.customer_id, full_name: info.full_name, phone: info.phone, member_number: info.member_number, drink_count: info.drink_count, available_rewards: info.available_rewards, total_drinks: info.total_drinks, required: info.drinks_required, source: 'qr', qr: text, holdUntil: new Date(info.hold_expires_at).getTime() });
    } catch (e) { $('#scanMsg').dataset.k = ''; $('#scanMsg').textContent = errMsg(e.code); }
    finally { checking = false; }
  }

  /* ================================================================ search */
  async function doFind(ev) {
    ev.preventDefault();
    const q = $('#q').value.trim(), out = $('#results');
    if (q.length < 2) { out.innerHTML = `<p class="empty">${esc(t('find.short'))}</p>`; return; }
    out.innerHTML = `<p class="loading"><span class="spin"></span></p>`;
    try {
      const { customers } = await api('find_customer', { query: q });
      out.innerHTML = customers.length ? '' : `<p class="empty">${esc(t('find.none'))}</p>`;
      customers.forEach((c) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'item'; b.disabled = !c.is_active;
        b.innerHTML = `<span><b>${esc(c.full_name)}</b><br><small class="mut" dir="ltr">${esc(c.phone)} · ${esc(RR.memberNo(c.member_number))}</small></span><span>${c.is_active ? `<span class="tag">${esc(num(c.drink_count))}</span>` : `<span class="pill r">${esc(t('find.disabled'))}</span>`}</span>`;
        b.addEventListener('click', () => { stopScan(); select({ id: c.id, full_name: c.full_name, phone: c.phone, member_number: c.member_number, drink_count: c.drink_count, available_rewards: c.available_rewards, total_drinks: c.total_drinks, required: boot.settings.drinks_required || 10, source: 'manual', qr: null }); });
        out.appendChild(b);
      });
    } catch (e) { out.innerHTML = `<p class="err-text">${esc(errMsg(e.code))}</p>`; }
  }

  /* ================================================================ selected customer */
  const manualOk = () => boot.settings.allow_manual_purchase !== false;
  function select(c) {
    sel = c; qty = 1; drinkId = null; buyKey = RR.uuid(); claimKey = RR.uuid();
    $('#resultSec').hidden = true; $('#custSec').hidden = false;
    renderSel(); $('#custSec').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#custH').focus && $('#custH').setAttribute('tabindex', '-1');
  }
  function holdActive() { return sel && sel.source === 'qr' && sel.qr && sel.holdUntil > Date.now(); }
  function renderSel() {
    if (!sel) { $('#custSec').hidden = true; return; }
    const req = sel.required || 10;
    $('#custH').textContent = sel.full_name; $('#custMeta').textContent = `${sel.phone} · ${RR.memberNo(sel.member_number)}`;
    const pill = $('#srcPill'); pill.textContent = t(sel.source === 'qr' && sel.qr ? 'src.qr' : 'src.manual'); pill.className = 'pill ' + (sel.source === 'qr' && sel.qr ? '' : 'g');
    $('#kPts').textContent = `${num(sel.drink_count)} / ${num(req)}`; $('#kRw').textContent = num(sel.available_rewards);
    $('#kBar').style.setProperty('--p', Math.min(100, Math.round(sel.drink_count / req * 100)) + '%');
    const canBuy = (sel.source === 'qr' && sel.qr && holdActive()) || manualOk();
    $('#buySec').hidden = !canBuy; $('#manualOff').hidden = canBuy;
    $('#drinkChips').innerHTML = boot.drinks.map((d) => `<button type="button" class="chip${d.id === drinkId ? ' on' : ''}" role="radio" aria-checked="${d.id === drinkId}" data-id="${esc(d.id)}">${esc(pick(d))}</button>`).join('');
    $$('#drinkChips .chip').forEach((b) => b.addEventListener('click', () => { drinkId = b.dataset.id; renderSel(); }));
    $('#qVal').textContent = num(qty);
    $('#claimSec').hidden = !(sel.available_rewards > 0);
    $('#rewardChips').innerHTML = boot.rewards.map((r) => `<button type="button" class="chip${r.id === rewardId ? ' on' : ''}" data-id="${esc(r.id)}">${esc(pick(r))}</button>`).join('');
    if (boot.rewards.length && !boot.rewards.some((r) => r.id === rewardId)) rewardId = boot.rewards[0].id;
    $$('#rewardChips .chip').forEach((b) => { b.classList.toggle('on', b.dataset.id === rewardId); b.addEventListener('click', () => { rewardId = b.dataset.id; renderSel(); }); });
    tickHold(); clearInterval(holdTimer); holdTimer = setInterval(tickHold, 1000);
  }
  function tickHold() {
    const el = $('#holdMsg'); if (!sel || !(sel.source === 'qr' && sel.qr)) { el.textContent = ''; return; }
    const s = Math.round((sel.holdUntil - Date.now()) / 1000);
    if (s > 0) el.textContent = t('hold.left', { s });
    else { el.textContent = t('hold.expired', { manual: manualOk() ? t('hold.manualOk') : '' }); sel.qr = null; sel.source = 'manual'; clearInterval(holdTimer); renderSel(); el.textContent = t('hold.expired', { manual: manualOk() ? t('hold.manualOk') : '' }); }
  }
  async function reloadSel() {
    try { const { customers } = await api('find_customer', { query: RR.memberNo(sel.member_number) }); const c = customers.find((x) => x.id === sel.id); if (c) { Object.assign(sel, { drink_count: c.drink_count, available_rewards: c.available_rewards, total_drinks: c.total_drinks }); } } catch { /* keep what we have */ }
  }

  function showResult(kind, title, lines) {
    const r = $('#resultSec'); r.hidden = false;
    r.innerHTML = `<div class="${kind === 'ok' ? 'ok' : 'er'}" aria-hidden="true">${kind === 'ok' ? '✓' : '!'}</div><h2 style="text-align:center;margin-top:10px">${esc(title)}</h2>${lines.map((l) => `<p class="mut" style="text-align:center">${esc(l)}</p>`).join('')}`;
    r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function register() {
    if (!sel) return;
    if (!drinkId) { toast(t('buy.pick'), 'bad'); return; }
    const body = { drink_id: drinkId, quantity: qty, idempotency_key: buyKey };
    if (sel.source === 'qr' && sel.qr && holdActive()) body.qr = sel.qr; else body.customer_id = sel.id;
    await RR.busy($('#regBtn'), async () => {
      try {
        const r = await api('register_purchase', body);
        const drink = boot.drinks.find((d) => d.id === drinkId);
        if (r.duplicate) { await reloadSel(); showResult('ok', t('buy.dup'), [t('buy.dup.d')]); }
        else {
          Object.assign(sel, { drink_count: r.drink_count, available_rewards: r.available_rewards, total_drinks: r.total_drinks });
          const lines = [t('buy.sum', { n: num(qty), drink: pick(drink), name: sel.full_name }), t('buy.points', { a: num(r.drink_count), b: num(r.drinks_required || sel.required) })];
          if (r.rewards_earned > 0) lines.push(t('buy.earned', { n: num(r.available_rewards) }));
          showResult('ok', t('buy.ok'), lines);
        }
        sel.qr = null; sel.source = 'manual'; qty = 1; drinkId = null; buyKey = RR.uuid(); renderSel(); loadHistory();
      } catch (e) {
        showResult('bad', errMsg(e.code), []);
        if (['QR_EXPIRED', 'QR_ALREADY_USED', 'QR_INVALID'].includes(e.code)) { sel.qr = null; sel.source = 'manual'; buyKey = RR.uuid(); renderSel(); }
        else if (e.code === 'NETWORK_ERROR') toast(t('err.NETWORK_ERROR'), 'bad'); // key is kept: a retry cannot double-register
      }
    });
  }

  async function claim() {
    if (!sel || !rewardId) return;
    const r = boot.rewards.find((x) => x.id === rewardId);
    if (!confirm(t('claim.confirm', { reward: pick(r), name: sel.full_name }))) return;
    await RR.busy($('#claimBtn'), async () => {
      try {
        const out = await api('claim_reward', { customer_id: sel.id, reward_id: rewardId, idempotency_key: claimKey });
        sel.available_rewards = out.available_rewards;
        showResult('ok', out.duplicate ? t('claim.dup') : t('claim.ok'), [`${pick(r)} — ${sel.full_name}`, t('claim.left', { n: num(out.available_rewards) })]);
        claimKey = RR.uuid(); renderSel(); loadHistory();
      } catch (e) { showResult('bad', errMsg(e.code), []); if (e.code === 'NO_REWARD_AVAILABLE') { await reloadSel(); renderSel(); } }
    });
  }

  function done() { sel = null; clearInterval(holdTimer); $('#custSec').hidden = true; $('#resultSec').hidden = true; $('#q').value = ''; $('#results').innerHTML = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }

  /* ================================================================ history */
  async function loadHistory() {
    const box = $('#history');
    try {
      const h = await api('cashier_history');
      const rows = [
        ...h.transactions.map((x) => ({ at: x.created_at, a: `${num(x.quantity)} × ${pick(x.drinks)}`, b: x.customer_name, tag: x.qr_token_id ? t('hist.qr') : t('hist.manual'), reward: false })),
        ...h.redemptions.map((x) => ({ at: x.created_at, a: t('hist.rewardRow', { reward: pick(x.rewards) }), b: x.customer_name, tag: '', reward: true })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 30);
      box.innerHTML = rows.length ? rows.map((r) => `<div class="li"><span class="d">${r.reward ? '✦' : '☕'}</span><div>${esc(r.a)}<br><span class="mut">${esc(r.b)}${r.tag ? ' · ' + esc(r.tag) : ''}</span></div><small>${esc(fmtDate(r.at))}</small></div>`).join('') : `<p class="empty">${esc(t('hist.none'))}</p>`;
    } catch (e) { if (e.status !== 401) box.innerHTML = `<p class="err-text">${esc(errMsg(e.code))}</p>`; }
  }

  /* ================================================================ boot */
  RR.boot({
    kind: 'staff', roles: ['cashier', 'admin'],
    async start(session) {
      const p = session.profile; $('#who').textContent = `${p.full_name} · ${p.role}`; $('#adminLink').hidden = p.role !== 'admin';
      boot = await api('cashier_bootstrap');
      hint('scan.idle'); loadHistory();
    },
  });
  RR.onLang(() => { const k = $('#scanMsg').dataset.k; if (k) setMsg(k); if (sel) renderSel(); loadHistory(); $('#vfHint').textContent = t($('#vfHint').dataset.i18n || 'scan.idle'); });
  $('#startBtn').addEventListener('click', startScan);
  $('#stopBtn').addEventListener('click', stopScan);
  $('#findForm').addEventListener('submit', doFind);
  $('#qMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#qVal').textContent = num(qty); });
  $('#qPlus').addEventListener('click', () => { qty = Math.min(4, qty + 1); $('#qVal').textContent = num(qty); });
  $('#regBtn').addEventListener('click', register);
  $('#claimBtn').addEventListener('click', claim);
  $('#doneBtn').addEventListener('click', done);
  $('#histRefresh').addEventListener('click', loadHistory);
  document.addEventListener('visibilitychange', () => { if (document.hidden && scanning) stopScan(); });
  window.RRCashier = { handleScan };
})();
