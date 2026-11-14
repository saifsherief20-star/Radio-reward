/* RADIO REWARDS — admin dashboard logic */
(() => {
  'use strict';
  const { $, $$, esc, t, add, api, num, fmtDate, fmtDay, pick, toast, errMsg } = RR;
  const PAGE = 25;

  add({
    'title.admin': 'Admin', 'lang.aria': 'Language',
    'tab.dashboard': 'Dashboard', 'tab.customers': 'Customers', 'tab.purchases': 'Purchases', 'tab.rewards': 'Rewards', 'tab.redemptions': 'Redemptions', 'tab.staff': 'Staff', 'tab.activity': 'Activity log', 'tab.settings': 'Settings',
    'k.customers': 'Customers', 'k.tx': 'Transactions', 'k.drinks': 'Drinks collected', 'k.redeemed': 'Rewards redeemed', 'k.earned': 'Rewards earned', 'k.available': 'Rewards available', 'k.new7': 'New customers (7 days)', 'k.disabled': 'Disabled customers',
    'd.bydrink': 'Drinks by type', 'd.byday': 'Visits per day (last 14 days)', 'd.recent': 'Recent transactions', 'd.nodata': 'No data yet.',
    'c.search': 'Search name, phone or RR-number', 'c.all': 'All', 'c.active': 'Active', 'c.disabled': 'Disabled', 'c.go': 'Search', 'c.view': 'View',
    'col.name': 'Name', 'col.phone': 'Phone', 'col.no': 'Member no.', 'col.points': 'Progress', 'col.total': 'Total drinks', 'col.rewards': 'Rewards', 'col.tier': 'Tier', 'col.status': 'Status', 'col.joined': 'Joined', 'col.date': 'Date', 'col.customer': 'Customer', 'col.drink': 'Drink', 'col.qty': 'Qty', 'col.cashier': 'Cashier', 'col.method': 'Method', 'col.reward': 'Reward', 'col.email': 'Email', 'col.role': 'Role', 'col.actions': 'Actions', 'col.actor': 'Who', 'col.action': 'Action', 'col.details': 'Details', 'col.req': 'Drinks required', 'col.desc': 'Description',
    'tier.Gold': 'Gold', 'tier.Silver': 'Silver', 'tier.New': 'New', 'm.qr': 'QR', 'm.manual': 'Manual', 'none': 'Nothing to show.',
    'cd.title': 'Customer profile', 'cd.tx': 'Purchases', 'cd.red': 'Redemptions', 'cd.disable': 'Disable account', 'cd.enable': 'Enable account', 'cd.rename': 'Save name', 'cd.disable.confirm': 'Disable this customer? They will be signed out and lose access.',
    'r.title': 'Rewards', 'r.add': 'Add reward', 'r.edit': 'Edit', 'r.name': 'Name (English)', 'r.name_ar': 'Name (Arabic)', 'r.desc': 'Description', 'r.req': 'Drinks required (informational)', 'r.active': 'Active',
    'r.note': 'The loyalty rule that actually awards rewards is “{n} drinks = 1 reward” (set in the database). A reward’s own “drinks required” value is informational only.',
    'dr.title': 'Drinks', 'dr.add': 'Add drink',
    's.add': 'Add staff account', 's.name': 'Full name', 's.email': 'Email', 's.password': 'Password (min 10 characters)', 's.newpw': 'New password (leave empty to keep)', 's.role': 'Role', 's.cashier': 'Cashier', 's.admin': 'Admin',
    's.delete': 'Delete', 's.delete.confirm': 'Permanently delete this account? (Only possible if it has no transactions.)', 's.disable': 'Disable', 's.enable': 'Enable', 's.edit': 'Edit', 's.created': 'Account created.', 's.saved': 'Saved.',
    'a.filter': 'Filter by action', 'a.all': 'All actions',
    'st.title': 'Settings', 'st.cafe': 'Café name', 'st.lat': 'Latitude', 'st.lng': 'Longitude', 'st.radius': 'Nearby alert radius (meters)', 'st.alert': 'Nearby alert enabled', 'st.msg': 'Nearby alert message (Arabic)',
    'st.qr': 'QR code validity (seconds)', 'st.hold': 'Scan hold time (seconds)', 'st.manual': 'Allow manual purchase entry (without QR)', 'st.rule': 'Loyalty rule (drinks per reward)', 'st.rule.note': 'Read-only here. Change it deliberately in the database.',
    'st.here': 'Use my current location', 'st.saved': 'Settings saved.', 'st.geo.fail': 'Couldn’t get your location.',
    'save': 'Save', 'prev': 'Previous', 'next': 'Next', 'page': '{a}–{b} of {c}', 'cancel': 'Cancel', 'close': 'Close',
    'log.customer_registered': 'Customer registered', 'log.customer_login': 'Customer login', 'log.customer_logout': 'Customer logout', 'log.staff_login': 'Staff login', 'log.staff_login_failed': 'Failed staff login', 'log.staff_logout': 'Staff logout',
    'log.purchase_registered': 'Purchase registered', 'log.reward_redeemed': 'Reward redeemed', 'log.customer_disabled': 'Customer disabled', 'log.customer_enabled': 'Customer enabled', 'log.customer_updated': 'Customer updated',
    'log.reward_created': 'Reward created', 'log.reward_updated': 'Reward updated', 'log.drink_created': 'Drink created', 'log.drink_updated': 'Drink updated', 'log.staff_created': 'Staff created', 'log.staff_updated': 'Staff updated', 'log.staff_deleted': 'Staff deleted', 'log.settings_updated': 'Settings updated',
  }, {
    'title.admin': 'الإدارة', 'lang.aria': 'اللغة',
    'tab.dashboard': 'لوحة التحكم', 'tab.customers': 'العملاء', 'tab.purchases': 'المشتريات', 'tab.rewards': 'المكافآت', 'tab.redemptions': 'الاستلامات', 'tab.staff': 'الموظفين', 'tab.activity': 'سجل النشاط', 'tab.settings': 'الإعدادات',
    'k.customers': 'العملاء', 'k.tx': 'العمليات', 'k.drinks': 'مشروبات اتباعت', 'k.redeemed': 'مكافآت اتسلّمت', 'k.earned': 'مكافآت اتكسبت', 'k.available': 'مكافآت متاحة', 'k.new7': 'عملاء جدد (7 أيام)', 'k.disabled': 'عملاء موقوفين',
    'd.bydrink': 'المشروبات حسب النوع', 'd.byday': 'الزيارات يومياً (آخر 14 يوم)', 'd.recent': 'آخر العمليات', 'd.nodata': 'مفيش بيانات لسه.',
    'c.search': 'ابحث بالاسم أو الموبايل أو رقم RR', 'c.all': 'الكل', 'c.active': 'نشط', 'c.disabled': 'موقوف', 'c.go': 'بحث', 'c.view': 'عرض',
    'col.name': 'الاسم', 'col.phone': 'الموبايل', 'col.no': 'رقم العضوية', 'col.points': 'التقدّم', 'col.total': 'إجمالي المشروبات', 'col.rewards': 'المكافآت', 'col.tier': 'المستوى', 'col.status': 'الحالة', 'col.joined': 'انضم', 'col.date': 'التاريخ', 'col.customer': 'العميل', 'col.drink': 'المشروب', 'col.qty': 'الكمية', 'col.cashier': 'الكاشير', 'col.method': 'الطريقة', 'col.reward': 'المكافأة', 'col.email': 'البريد', 'col.role': 'الصلاحية', 'col.actions': 'إجراءات', 'col.actor': 'بواسطة', 'col.action': 'الإجراء', 'col.details': 'تفاصيل', 'col.req': 'المشروبات المطلوبة', 'col.desc': 'الوصف',
    'tier.Gold': 'ذهبي', 'tier.Silver': 'فضي', 'tier.New': 'جديد', 'm.qr': 'QR', 'm.manual': 'يدوي', 'none': 'مفيش حاجة تتعرض.',
    'cd.title': 'ملف العميل', 'cd.tx': 'المشتريات', 'cd.red': 'الاستلامات', 'cd.disable': 'إيقاف الحساب', 'cd.enable': 'تفعيل الحساب', 'cd.rename': 'حفظ الاسم', 'cd.disable.confirm': 'توقف العميل ده؟ هيتسجّل خروجه ويفقد الوصول.',
    'r.title': 'المكافآت', 'r.add': 'إضافة مكافأة', 'r.edit': 'تعديل', 'r.name': 'الاسم (إنجليزي)', 'r.name_ar': 'الاسم (عربي)', 'r.desc': 'الوصف', 'r.req': 'المشروبات المطلوبة (للعرض فقط)', 'r.active': 'مفعّلة',
    'r.note': 'قاعدة الولاء اللي بتمنح المكافآت فعلياً هي «{n} مشروبات = مكافأة» (محددة في قاعدة البيانات). رقم «المشروبات المطلوبة» في المكافأة للعرض فقط.',
    'dr.title': 'المشروبات', 'dr.add': 'إضافة مشروب',
    's.add': 'إضافة حساب موظف', 's.name': 'الاسم بالكامل', 's.email': 'البريد الإلكتروني', 's.password': 'كلمة المرور (10 حروف على الأقل)', 's.newpw': 'كلمة مرور جديدة (سيبها فاضية للإبقاء)', 's.role': 'الصلاحية', 's.cashier': 'كاشير', 's.admin': 'أدمن',
    's.delete': 'حذف', 's.delete.confirm': 'تمسح الحساب نهائياً؟ (ممكن بس لو مفيش عليه عمليات.)', 's.disable': 'إيقاف', 's.enable': 'تفعيل', 's.edit': 'تعديل', 's.created': 'تم إنشاء الحساب.', 's.saved': 'تم الحفظ.',
    'a.filter': 'فلتر حسب الإجراء', 'a.all': 'كل الإجراءات',
    'st.title': 'الإعدادات', 'st.cafe': 'اسم الكافيه', 'st.lat': 'خط العرض', 'st.lng': 'خط الطول', 'st.radius': 'نطاق تنبيه القرب (متر)', 'st.alert': 'تفعيل تنبيه القرب', 'st.msg': 'رسالة تنبيه القرب',
    'st.qr': 'مدة صلاحية الكود (ثانية)', 'st.hold': 'مدة تثبيت المسح (ثانية)', 'st.manual': 'السماح بتسجيل الشراء يدوياً (بدون QR)', 'st.rule': 'قاعدة الولاء (مشروبات لكل مكافأة)', 'st.rule.note': 'للعرض فقط هنا. غيّرها من قاعدة البيانات بشكل مقصود.',
    'st.here': 'استخدم موقعي الحالي', 'st.saved': 'تم حفظ الإعدادات.', 'st.geo.fail': 'معرفتش أجيب موقعك.',
    'save': 'حفظ', 'prev': 'السابق', 'next': 'التالي', 'page': '{a}–{b} من {c}', 'cancel': 'إلغاء', 'close': 'إغلاق',
    'log.customer_registered': 'تسجيل عميل', 'log.customer_login': 'دخول عميل', 'log.customer_logout': 'خروج عميل', 'log.staff_login': 'دخول موظف', 'log.staff_login_failed': 'محاولة دخول فاشلة', 'log.staff_logout': 'خروج موظف',
    'log.purchase_registered': 'تسجيل عملية شراء', 'log.reward_redeemed': 'تسليم مكافأة', 'log.customer_disabled': 'إيقاف عميل', 'log.customer_enabled': 'تفعيل عميل', 'log.customer_updated': 'تعديل عميل',
    'log.reward_created': 'إضافة مكافأة', 'log.reward_updated': 'تعديل مكافأة', 'log.drink_created': 'إضافة مشروب', 'log.drink_updated': 'تعديل مشروب', 'log.staff_created': 'إضافة موظف', 'log.staff_updated': 'تعديل موظف', 'log.staff_deleted': 'حذف موظف', 'log.settings_updated': 'تعديل الإعدادات',
  });

  const TABS = ['dashboard', 'customers', 'purchases', 'rewards', 'redemptions', 'staff', 'activity', 'settings'];
  let route = 'dashboard', state = {}, myId = null, required = 10;
  const view = () => $('#view');
  const tierOf = (n) => (n >= 25 ? 'Gold' : n >= 10 ? 'Silver' : 'New'); // display-only (unconfirmed rule)
  const tw = (head, rows) => `<div class="tw"><table><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${head.length}" class="empty">${esc(t('none'))}</td></tr>`}</tbody></table></div>`;
  const pager = (total, offset, limit) => `<div class="pager"><button class="chip" data-p="prev" ${offset <= 0 ? 'disabled' : ''}>${esc(t('prev'))}</button><span class="mut">${esc(t('page', { a: total ? offset + 1 : 0, b: Math.min(total, offset + limit), c: num(total) }))}</span><button class="chip" data-p="next" ${offset + limit >= total ? 'disabled' : ''}>${esc(t('next'))}</button></div>`;
  const bindPager = (offset, limit, fn) => { const p = $('[data-p=prev]'), n = $('[data-p=next]'); if (p) p.onclick = () => fn(Math.max(0, offset - limit)); if (n) n.onclick = () => fn(offset + limit); };
  const field = (id, label, type, value, extra = '') => `<div class="field"><label for="${id}">${esc(label)}</label><input id="${id}" type="${type}" value="${esc(value ?? '')}" ${extra}></div>`;
  const check = (id, label, on) => `<label class="row" style="justify-content:flex-start;gap:10px;margin-top:12px"><input id="${id}" type="checkbox" ${on ? 'checked' : ''}> <span>${esc(label)}</span></label>`;

  function openModal(html, onBind) {
    const m = $('#modal'); m.hidden = false; m.className = 'modal'; m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}<p style="margin-top:14px"><button class="chip" id="mClose" type="button">${esc(t('close'))}</button></p></div>`;
    $('#mClose').onclick = closeModal; m.onclick = (e) => { if (e.target === m) closeModal(); };
    document.addEventListener('keydown', escClose); if (onBind) onBind(m);
    const f = $('input,select,button', m); if (f) f.focus();
  }
  const escClose = (e) => { if (e.key === 'Escape') closeModal(); };
  function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; document.removeEventListener('keydown', escClose); }
  const fail = (e) => toast(errMsg(e.code), 'bad');

  /* ---------------------------------------------------------- tabs */
  function renderTabs() { $('#tabs').innerHTML = TABS.map((k) => `<a class="chip${k === route ? ' on' : ''}" href="#${k}">${esc(t('tab.' + k))}</a>`).join(''); }
  async function show() {
    const h = (location.hash || '#dashboard').slice(1); route = TABS.includes(h) ? h : 'dashboard'; renderTabs();
    view().innerHTML = `<p class="loading"><span class="spin"></span></p>`;
    try { await V[route](); } catch (e) { if (e.status !== 401) view().innerHTML = `<div class="gl"><p class="err-text">${esc(errMsg(e.code))}</p><button class="btn" id="retry">${esc(t('retry'))}</button></div>`; const r = $('#retry'); if (r) r.onclick = show; }
  }

  /* ---------------------------------------------------------- views */
  const V = {
    async dashboard() {
      const d = await api('admin_dashboard'), s = d.stats; required = s.required || required;
      const kp = (label, v) => `<div class="gl"><b>${esc(num(v))}</b><span class="mut">${esc(label)}</span></div>`;
      const max = Math.max(1, ...s.by_drink.map((x) => x.qty)), dmax = Math.max(1, ...s.by_day.map((x) => x.visits));
      view().innerHTML = `<div class="kp">${kp(t('k.customers'), s.total_customers)}${kp(t('k.tx'), s.total_transactions)}${kp(t('k.drinks'), s.drinks_collected)}${kp(t('k.redeemed'), s.rewards_redeemed)}</div>
      <div class="kp mt">${kp(t('k.earned'), s.rewards_earned)}${kp(t('k.available'), s.rewards_available)}${kp(t('k.new7'), s.new_customers_7d)}${kp(t('k.disabled'), s.disabled_customers)}</div>
      <div class="two-col mt"><div class="gl"><h3>${esc(t('d.bydrink'))}</h3>${s.by_drink.length ? s.by_drink.map((x) => `<div class="hbar"><span>${esc(pick(x))}</span><i style="width:${Math.round(x.qty / max * 100)}%"></i><b>${esc(num(x.qty))}</b></div>`).join('') : `<p class="empty">${esc(t('d.nodata'))}</p>`}</div>
      <div class="gl"><h3>${esc(t('d.byday'))}</h3>${s.by_day.length ? `<div class="daybars" role="img" aria-label="${esc(t('d.byday'))}">${s.by_day.map((x) => `<div title="${esc(x.day)}: ${x.visits}"><span>${x.visits}</span><i style="height:${Math.max(3, Math.round(x.visits / dmax * 100))}%"></i><span>${esc(x.day.slice(5))}</span></div>`).join('')}</div>` : `<p class="empty">${esc(t('d.nodata'))}</p>`}</div></div>
      <div class="gl mt"><h3>${esc(t('d.recent'))}</h3>${tw([t('col.date'), t('col.customer'), t('col.drink'), t('col.qty'), t('col.cashier')], d.transactions.map((x) => `<tr><td>${esc(fmtDate(x.created_at))}</td><td>${esc(x.customer_name)}</td><td>${esc(pick(x.drinks))}</td><td>${esc(x.quantity)}</td><td>${esc(x.cashier_name)}</td></tr>`))}</div>`;
    },

    async customers(offset = 0) {
      const f = state.cust || (state.cust = { q: '', status: '' });
      const d = await api('admin_customers', { query: f.q, status: f.status, offset, limit: PAGE });
      view().innerHTML = `<div class="gl"><form class="tools" id="cf" novalidate><input id="cq" type="search" value="${esc(f.q)}" placeholder="${esc(t('c.search'))}" aria-label="${esc(t('c.search'))}"><select id="cs" aria-label="${esc(t('col.status'))}"><option value="">${esc(t('c.all'))}</option><option value="active"${f.status === 'active' ? ' selected' : ''}>${esc(t('c.active'))}</option><option value="disabled"${f.status === 'disabled' ? ' selected' : ''}>${esc(t('c.disabled'))}</option></select><button class="btn" type="submit">${esc(t('c.go'))}</button></form>
      <div class="mt">${tw([t('col.name'), t('col.phone'), t('col.no'), t('col.points'), t('col.total'), t('col.rewards'), t('col.tier'), t('col.status'), t('col.joined'), ''], d.customers.map((c) => `<tr><td>${esc(c.full_name)}</td><td dir="ltr">${esc(c.phone)}</td><td dir="ltr">${esc(RR.memberNo(c.member_number))}</td><td>${esc(c.drink_count)}</td><td>${esc(c.total_drinks)}</td><td>${esc(c.available_rewards)}</td><td>${esc(t('tier.' + tierOf(c.total_drinks)))}</td><td><span class="pill ${c.is_active ? '' : 'r'}">${esc(t(c.is_active ? 'c.active' : 'c.disabled'))}</span></td><td>${esc(fmtDay(c.created_at))}</td><td><button class="chip" data-id="${esc(c.id)}">${esc(t('c.view'))}</button></td></tr>`))}</div>${pager(d.total, d.offset, d.limit)}</div>`;
      $('#cf').onsubmit = (e) => { e.preventDefault(); state.cust = { q: $('#cq').value.trim(), status: $('#cs').value }; V.customers(0).catch(fail); };
      $$('button[data-id]').forEach((b) => b.onclick = () => customerDetail(b.dataset.id));
      bindPager(d.offset, d.limit, (o) => V.customers(o).catch(fail));
    },

    async purchases(offset = 0) {
      const d = await api('admin_transactions', { offset, limit: PAGE });
      view().innerHTML = `<div class="gl">${tw([t('col.date'), t('col.customer'), t('col.drink'), t('col.qty'), t('col.cashier'), t('col.method')], d.transactions.map((x) => `<tr><td>${esc(fmtDate(x.created_at))}</td><td>${esc(x.customer_name)}</td><td>${esc(pick(x.drinks))}</td><td>${esc(x.quantity)}</td><td>${esc(x.cashier_name)}</td><td><span class="tag">${esc(t(x.method === 'qr' ? 'm.qr' : 'm.manual'))}</span></td></tr>`))}${pager(d.total, offset, PAGE)}</div>`;
      bindPager(offset, PAGE, (o) => V.purchases(o).catch(fail));
    },

    async redemptions(offset = 0) {
      const d = await api('admin_redemptions', { offset, limit: PAGE });
      view().innerHTML = `<div class="gl">${tw([t('col.date'), t('col.customer'), t('col.reward'), t('col.cashier')], d.redemptions.map((x) => `<tr><td>${esc(fmtDate(x.created_at))}</td><td>${esc(x.customer_name)}</td><td>${esc(pick(x.rewards))}</td><td>${esc(x.cashier_name)}</td></tr>`))}${pager(d.total, offset, PAGE)}</div>`;
      bindPager(offset, PAGE, (o) => V.redemptions(o).catch(fail));
    },

    async rewards() {
      const [d, s] = await Promise.all([api('admin_rewards_list'), api('admin_settings_get')]); required = s.settings.drinks_required || 10;
      view().innerHTML = `<div class="gl"><div class="row wrap"><h2>${esc(t('r.title'))}</h2><button class="btn sm" id="addR">${esc(t('r.add'))}</button></div><p class="mut">${esc(t('r.note', { n: required }))}</p>
      ${tw([t('r.name'), t('r.name_ar'), t('col.desc'), t('col.req'), t('col.status'), ''], d.rewards.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.name_ar)}</td><td>${esc(r.description || '')}</td><td>${esc(r.drinks_required)}</td><td><span class="pill ${r.is_active ? '' : 'off'}">${esc(t(r.is_active ? 'c.active' : 'c.disabled'))}</span></td><td><button class="chip" data-r="${esc(r.id)}">${esc(t('r.edit'))}</button></td></tr>`))}</div>
      <div class="gl mt"><div class="row wrap"><h2>${esc(t('dr.title'))}</h2><button class="btn sm" id="addD">${esc(t('dr.add'))}</button></div>
      ${tw([t('r.name'), t('r.name_ar'), t('col.status'), ''], d.drinks.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.name_ar)}</td><td><span class="pill ${r.is_active ? '' : 'off'}">${esc(t(r.is_active ? 'c.active' : 'c.disabled'))}</span></td><td><button class="chip" data-d="${esc(r.id)}">${esc(t('r.edit'))}</button></td></tr>`))}</div>`;
      $('#addR').onclick = () => rewardForm(null); $('#addD').onclick = () => drinkForm(null);
      $$('[data-r]').forEach((b) => b.onclick = () => rewardForm(d.rewards.find((x) => x.id === b.dataset.r)));
      $$('[data-d]').forEach((b) => b.onclick = () => drinkForm(d.drinks.find((x) => x.id === b.dataset.d)));
    },

    async staff() {
      const d = await api('admin_staff_list');
      view().innerHTML = `<div class="gl"><div class="row wrap"><h2>${esc(t('tab.staff'))}</h2><button class="btn sm" id="addS">${esc(t('s.add'))}</button></div>
      ${tw([t('col.name'), t('col.email'), t('col.role'), t('col.status'), t('col.joined'), ''], d.staff.map((s) => `<tr><td>${esc(s.full_name)}</td><td dir="ltr">${esc(s.email)}</td><td><span class="tag">${esc(t('s.' + s.role))}</span></td><td><span class="pill ${s.is_active ? '' : 'r'}">${esc(t(s.is_active ? 'c.active' : 'c.disabled'))}</span></td><td>${esc(fmtDay(s.created_at))}</td><td class="acts"><button class="chip" data-s="${esc(s.id)}">${esc(t('s.edit'))}</button></td></tr>`))}</div>`;
      $('#addS').onclick = () => staffCreate();
      $$('[data-s]').forEach((b) => b.onclick = () => staffEdit(d.staff.find((x) => x.id === b.dataset.s)));
    },

    async activity(offset = 0) {
      const f = state.act || '';
      const d = await api('admin_activity_logs', { offset, limit: PAGE, action_filter: f || undefined });
      const actions = ['purchase_registered', 'reward_redeemed', 'customer_registered', 'customer_login', 'staff_login', 'staff_login_failed', 'customer_disabled', 'customer_enabled', 'staff_created', 'staff_updated', 'staff_deleted', 'reward_created', 'reward_updated', 'drink_created', 'drink_updated', 'settings_updated'];
      const det = (x) => { const o = x.details || {}; const keys = Object.keys(o).filter((k) => !['password_changed'].includes(k) || o[k]); return keys.length ? keys.map((k) => `${k}: ${typeof o[k] === 'object' ? JSON.stringify(o[k]) : o[k]}`).join(', ') : ''; };
      view().innerHTML = `<div class="gl"><div class="tools"><select id="af" aria-label="${esc(t('a.filter'))}"><option value="">${esc(t('a.all'))}</option>${actions.map((a) => `<option value="${a}"${f === a ? ' selected' : ''}>${esc(t('log.' + a))}</option>`).join('')}</select></div><div class="mt">${tw([t('col.date'), t('col.actor'), t('col.action'), t('col.details')], d.logs.map((x) => `<tr><td>${esc(fmtDate(x.created_at))}</td><td>${esc(x.actor_name || x.actor_type)}</td><td>${esc(t('log.' + x.action) === 'log.' + x.action ? x.action : t('log.' + x.action))}</td><td style="white-space:normal;max-width:420px"><small>${esc(det(x).slice(0, 220))}</small></td></tr>`))}</div>${pager(d.total, offset, PAGE)}</div>`;
      $('#af').onchange = (e) => { state.act = e.target.value; V.activity(0).catch(fail); };
      bindPager(offset, PAGE, (o) => V.activity(o).catch(fail));
    },

    async settings() {
      const { settings: s } = await api('admin_settings_get');
      view().innerHTML = `<div class="gl"><h2>${esc(t('st.title'))}</h2><form id="sf" novalidate>
        ${field('f_cafe', t('st.cafe'), 'text', s.cafe_name, 'maxlength="80"')}
        <div class="two-col">${field('f_lat', t('st.lat'), 'number', s.latitude, 'step="any" class="ltr"')}${field('f_lng', t('st.lng'), 'number', s.longitude, 'step="any" class="ltr"')}</div>
        <p><button type="button" class="chip" id="here">${esc(t('st.here'))}</button></p>
        ${field('f_rad', t('st.radius'), 'number', s.geofence_radius, 'min="50" max="5000"')}
        ${check('f_alert', t('st.alert'), s.nearby_alert_enabled)}
        ${field('f_msg', t('st.msg'), 'text', s.nearby_message, 'maxlength="140"')}
        <div class="two-col">${field('f_qr', t('st.qr'), 'number', s.qr_validity_seconds, 'min="10" max="120"')}${field('f_hold', t('st.hold'), 'number', s.scan_hold_seconds, 'min="30" max="900"')}</div>
        ${check('f_manual', t('st.manual'), s.allow_manual_purchase !== false)}
        <div class="field"><label>${esc(t('st.rule'))}</label><input value="${esc(s.drinks_required)}" disabled><small class="mut">${esc(t('st.rule.note'))}</small></div>
        <p class="err-text" id="sErr" role="alert"></p><button class="btn" type="submit">${esc(t('save'))}</button></form></div>`;
      $('#here').onclick = () => navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => { $('#f_lat').value = p.coords.latitude.toFixed(6); $('#f_lng').value = p.coords.longitude.toFixed(6); }, () => toast(t('st.geo.fail'), 'bad')) : toast(t('st.geo.fail'), 'bad');
      $('#sf').onsubmit = async (e) => {
        e.preventDefault();
        await RR.busy($('#sf button[type=submit]'), async () => {
          try {
            await api('admin_settings_save', { cafe_name: $('#f_cafe').value, latitude: $('#f_lat').value === '' ? undefined : Number($('#f_lat').value), longitude: $('#f_lng').value === '' ? undefined : Number($('#f_lng').value), geofence_radius: Number($('#f_rad').value), nearby_alert_enabled: $('#f_alert').checked, nearby_message: $('#f_msg').value, qr_validity_seconds: Number($('#f_qr').value), scan_hold_seconds: Number($('#f_hold').value), allow_manual_purchase: $('#f_manual').checked });
            toast(t('st.saved'), 'good'); $('#sErr').textContent = '';
          } catch (er) { $('#sErr').textContent = errMsg(er.code); }
        });
      };
    },
  };

  /* ---------------------------------------------------------- modals / forms */
  async function customerDetail(id) {
    let d; try { d = await api('admin_customer_detail', { customer_id: id }); } catch (e) { return fail(e); }
    const c = d.customer;
    openModal(`<h2>${esc(t('cd.title'))}</h2>
      <div class="gl"><div class="li"><span>${esc(t('col.name'))}</span><small>${esc(c.full_name)}</small></div><div class="li"><span>${esc(t('col.phone'))}</span><small dir="ltr">${esc(c.phone)}</small></div><div class="li"><span>${esc(t('col.no'))}</span><small dir="ltr">${esc(RR.memberNo(c.member_number))}</small></div><div class="li"><span>${esc(t('col.points'))}</span><small>${esc(c.drink_count)}</small></div><div class="li"><span>${esc(t('col.total'))}</span><small>${esc(c.total_drinks)}</small></div><div class="li"><span>${esc(t('col.rewards'))}</span><small>${esc(c.available_rewards)} / ${esc(c.total_rewards)}</small></div><div class="li"><span>${esc(t('col.joined'))}</span><small>${esc(fmtDate(c.created_at))}</small></div><div class="li"><span>${esc(t('col.status'))}</span><small>${esc(t(c.is_active ? 'c.active' : 'c.disabled'))}</small></div></div>
      <div class="row wrap mt"><button class="btn sm ${c.is_active ? 'danger' : ''}" id="cdToggle">${esc(t(c.is_active ? 'cd.disable' : 'cd.enable'))}</button></div>
      <div class="field"><label for="cdName">${esc(t('col.name'))}</label><div class="row"><input id="cdName" value="${esc(c.full_name)}" maxlength="80"><button class="btn sm" id="cdRename" type="button">${esc(t('cd.rename'))}</button></div></div>
      <h3 class="mt">${esc(t('cd.tx'))}</h3>${tw([t('col.date'), t('col.drink'), t('col.qty'), t('col.cashier'), t('col.method')], d.transactions.map((x) => `<tr><td>${esc(fmtDate(x.created_at))}</td><td>${esc(pick(x.drinks))}</td><td>${esc(x.quantity)}</td><td>${esc(x.cashier_name)}</td><td>${esc(t(x.qr_token_id ? 'm.qr' : 'm.manual'))}</td></tr>`))}
      <h3 class="mt">${esc(t('cd.red'))}</h3>${tw([t('col.date'), t('col.reward'), t('col.cashier')], d.redemptions.map((x) => `<tr><td>${esc(fmtDate(x.created_at))}</td><td>${esc(pick(x.rewards))}</td><td>${esc(x.cashier_name)}</td></tr>`))}`, () => {
      $('#cdToggle').onclick = async () => { if (c.is_active && !confirm(t('cd.disable.confirm'))) return; try { await api('admin_set_customer', { customer_id: id, is_active: !c.is_active }); closeModal(); show(); toast(t('s.saved'), 'good'); } catch (e) { fail(e); } };
      $('#cdRename').onclick = async () => { try { await api('admin_set_customer', { customer_id: id, full_name: $('#cdName').value }); closeModal(); show(); toast(t('s.saved'), 'good'); } catch (e) { fail(e); } };
    });
  }
  function rewardForm(r) {
    openModal(`<h2>${esc(t(r ? 'r.edit' : 'r.add'))}</h2><form id="rf" novalidate>${field('r_n', t('r.name'), 'text', r && r.name, 'maxlength="80" required')}${field('r_a', t('r.name_ar'), 'text', r && r.name_ar, 'maxlength="80" required')}${field('r_d', t('r.desc'), 'text', r && r.description, 'maxlength="300"')}${field('r_q', t('r.req'), 'number', r ? r.drinks_required : required, 'min="1" max="1000"')}${check('r_on', t('r.active'), r ? r.is_active : true)}<p class="err-text" id="rErr" role="alert"></p><button class="btn" type="submit">${esc(t('save'))}</button></form>`, () => {
      $('#rf').onsubmit = async (e) => { e.preventDefault(); try { await api('admin_reward_save', { id: r && r.id, name: $('#r_n').value, name_ar: $('#r_a').value, description: $('#r_d').value, drinks_required: Number($('#r_q').value), is_active: $('#r_on').checked }); closeModal(); show(); toast(t('s.saved'), 'good'); } catch (er) { $('#rErr').textContent = errMsg(er.code); } };
    });
  }
  function drinkForm(r) {
    openModal(`<h2>${esc(t(r ? 'r.edit' : 'dr.add'))}</h2><form id="df" novalidate>${field('d_n', t('r.name'), 'text', r && r.name, 'maxlength="60" required')}${field('d_a', t('r.name_ar'), 'text', r && r.name_ar, 'maxlength="60" required')}${check('d_on', t('r.active'), r ? r.is_active : true)}<p class="err-text" id="dErr" role="alert"></p><button class="btn" type="submit">${esc(t('save'))}</button></form>`, () => {
      $('#df').onsubmit = async (e) => { e.preventDefault(); try { await api('admin_drink_save', { id: r && r.id, name: $('#d_n').value, name_ar: $('#d_a').value, is_active: $('#d_on').checked }); closeModal(); show(); toast(t('s.saved'), 'good'); } catch (er) { $('#dErr').textContent = errMsg(er.code); } };
    });
  }
  const roleSel = (id, v) => `<div class="field"><label for="${id}">${esc(t('s.role'))}</label><select id="${id}"><option value="cashier"${v === 'cashier' ? ' selected' : ''}>${esc(t('s.cashier'))}</option><option value="admin"${v === 'admin' ? ' selected' : ''}>${esc(t('s.admin'))}</option></select></div>`;
  function staffCreate() {
    openModal(`<h2>${esc(t('s.add'))}</h2><form id="sf2" novalidate>${field('n_n', t('s.name'), 'text', '', 'maxlength="80" required')}${field('n_e', t('s.email'), 'email', '', 'autocomplete="off" required')}${field('n_p', t('s.password'), 'password', '', 'autocomplete="new-password" required')}${roleSel('n_r', 'cashier')}<p class="err-text" id="nErr" role="alert"></p><button class="btn" type="submit">${esc(t('save'))}</button></form>`, () => {
      $('#sf2').onsubmit = async (e) => { e.preventDefault(); try { await api('admin_staff_create', { full_name: $('#n_n').value, email: $('#n_e').value, password: $('#n_p').value, role: $('#n_r').value }); closeModal(); show(); toast(t('s.created'), 'good'); } catch (er) { $('#nErr').textContent = errMsg(er.code); } };
    });
  }
  function staffEdit(s) {
    const me = s.id === myId;
    openModal(`<h2>${esc(t('s.edit'))}: ${esc(s.email)}</h2><form id="ef" novalidate>${field('e_n', t('s.name'), 'text', s.full_name, 'maxlength="80"')}${me ? '' : roleSel('e_r', s.role)}${me ? '' : check('e_on', t('c.active'), s.is_active)}${field('e_p', t('s.newpw'), 'password', '', 'autocomplete="new-password"')}<p class="err-text" id="eErr" role="alert"></p><div class="row wrap"><button class="btn" type="submit">${esc(t('save'))}</button>${me ? '' : `<button class="btn danger sm" type="button" id="eDel">${esc(t('s.delete'))}</button>`}</div></form>`, () => {
      $('#ef').onsubmit = async (e) => { e.preventDefault(); const b = { id: s.id, full_name: $('#e_n').value }; if (!me) { b.role = $('#e_r').value; b.is_active = $('#e_on').checked; } if ($('#e_p').value) b.password = $('#e_p').value; try { await api('admin_staff_update', b); closeModal(); show(); toast(t('s.saved'), 'good'); } catch (er) { $('#eErr').textContent = errMsg(er.code); } };
      const del = $('#eDel'); if (del) del.onclick = async () => { if (!confirm(t('s.delete.confirm'))) return; try { await api('admin_staff_delete', { id: s.id }); closeModal(); show(); toast(t('s.saved'), 'good'); } catch (er) { $('#eErr').textContent = errMsg(er.code); } };
    });
  }

  /* ---------------------------------------------------------- boot */
  RR.boot({
    kind: 'staff', roles: ['admin'],
    async start(session) { myId = session.profile.id; $('#who').textContent = `${session.profile.full_name} · ${session.profile.role}`; await show(); },
  });
  addEventListener('hashchange', () => { if (RR.session()) show(); });
  RR.onLang(() => { if (RR.session()) { closeModal(); show(); } });
})();
