/* RADIO REWARDS — live Supabase integration layer */
(() => {
  const CFG = {
    url: "https://krcuvvnuzavkdrmgklah.supabase.co",
    key: "sb_publishable_hvcjCH0yASpUMXJKYQPNaA_mUnApBu5",
    fn: "radio-api"
  };
  const endpoint = `${CFG.url}/functions/v1/${CFG.fn}`;
  const $ = (s, r=document) => r.querySelector(s);
  const page = location.pathname.toLowerCase().endsWith('cashier.html') ? 'cashier' : location.pathname.toLowerCase().endsWith('admin.html') ? 'admin' : 'customer';
  const store = {
    get(k){ try{return localStorage.getItem('rr_'+k)}catch{return null} },
    set(k,v){ try{localStorage.setItem('rr_'+k,v)}catch{} },
    del(k){ try{localStorage.removeItem('rr_'+k)}catch{} }
  };
  let token = store.get(page === 'customer' ? 'customer_session' : 'staff_access');
  let profile = null, selectedDrink = null, quantity = 1, scanner = null, qrTimer = null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(action, data={}, auth=token) {
    const headers = {'Content-Type':'application/json','apikey':CFG.key};
    if(auth) headers.Authorization = `Bearer ${auth}`;
    const res = await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({action,...data})});
    const out = await res.json().catch(()=>({error:'INVALID_SERVER_RESPONSE'}));
    if(!res.ok) throw new Error(out.error || `HTTP_${res.status}`);
    return out;
  }
  function style(){
    const st=document.createElement('style'); st.textContent=`
      #rr-auth{position:fixed;inset:0;z-index:99999;background:rgba(8,8,12,.96);display:grid;place-items:center;padding:20px;font-family:inherit;color:#f8f2e9}
      #rr-auth .box{width:min(440px,100%);background:#19171b;border:1px solid #80613d;border-radius:22px;padding:26px;box-shadow:0 20px 70px #0009}
      #rr-auth h2{margin:0 0 8px;font-size:25px} #rr-auth p{opacity:.75;line-height:1.6}
      #rr-auth input{box-sizing:border-box;width:100%;margin:8px 0;padding:14px;border-radius:12px;border:1px solid #65513c;background:#0f0e11;color:white;font:inherit}
      #rr-auth button,.rr-action{border:0;border-radius:12px;padding:13px 18px;background:#c69b61;color:#17120c;font-weight:800;cursor:pointer;width:100%;margin-top:10px;font:inherit}
      #rr-auth .secondary{background:transparent;color:#e7c99f;border:1px solid #80613d}
      #rr-auth .err{color:#ff9b9b;min-height:22px;font-size:13px} .rr-live{margin:12px 0;padding:14px;border:1px solid #80613d;border-radius:14px;background:#171419;color:inherit}
      .rr-hide-demo{display:none!important} #rr-scanbox{width:100%;max-width:420px;margin:12px auto} #rr-live-qr{background:white;padding:12px;display:inline-block;border-radius:12px}
      .rr-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.rr-toolbar button{flex:1;min-width:120px}
      #rr-notice{position:fixed;z-index:100000;bottom:20px;left:50%;transform:translateX(-50%);background:#242027;color:white;border:1px solid #b48a55;padding:12px 18px;border-radius:12px;max-width:90vw}
    `; document.head.append(st);
  }
  function notice(msg){let n=$('#rr-notice');if(!n){n=document.createElement('div');n.id='rr-notice';document.body.append(n)}n.textContent=msg;n.hidden=false;clearTimeout(notice.t);notice.t=setTimeout(()=>n.hidden=true,4500)}
  function authPanel(){
    const node=document.createElement('div');node.id='rr-auth';node.innerHTML=`<div class="box"><h2>RADIO REWARDS</h2><p>${page==='customer'?'سجّل أو ادخل إلى بطاقة المكافآت':'تسجيل دخول الموظفين'}</p>
      ${page==='customer'?`<div id="rr-mode"><button id="rr-register">إنشاء حساب جديد</button><button class="secondary" id="rr-login">لدي حساب بالفعل</button></div>`:''}
      <form id="rr-form" novalidate><input id="rr-name" name="full_name" autocomplete="name" placeholder="الاسم بالكامل" minlength="2" maxlength="80" ${page==='customer'?'':'hidden disabled'}><input id="rr-email" name="email" type="email" autocomplete="username" placeholder="البريد الإلكتروني" hidden disabled><input id="rr-phone" name="phone" type="tel" autocomplete="tel" placeholder="رقم الموبايل"><input id="rr-password" name="password" type="password" autocomplete="current-password" placeholder="كلمة المرور" hidden disabled><div class="err" id="rr-error" role="status" aria-live="polite"></div><button type="button" id="rr-submit">متابعة</button></form>
      <p style="font-size:12px;margin-top:16px">${page==='customer'?'التسجيل بالاسم ورقم الهاتف لا يثبت ملكية رقم الهاتف.':'استخدم حسابًا أنشأه مدير النظام.'}</p></div>`;
    document.body.append(node);
    let mode='register', busy=false;
    const name=$('#rr-name'), email=$('#rr-email'), phone=$('#rr-phone'), password=$('#rr-password'), form=$('#rr-form'), submit=$('#rr-submit'), error=$('#rr-error');
    form.noValidate=true; form.setAttribute('novalidate','');
    const toggle=m=>{
      mode=m; name.hidden=false; name.disabled=false; name.required=true;
      password.hidden=true; password.disabled=true; password.required=false;
      email.hidden=true; email.disabled=true; email.required=false;
      submit.textContent=m==='register'?'إنشاء الحساب':'دخول';
      name.placeholder=m==='register'?'الاسم بالكامل':'الاسم المسجل بالحساب';
      error.textContent='';
      $('#rr-register').classList.toggle('secondary',m!=='register');
      $('#rr-login').classList.toggle('secondary',m!=='login');
    };
    if(page==='customer'){
      phone.hidden=false; phone.disabled=false; phone.required=true;
      $('#rr-register').onclick=()=>toggle('register'); $('#rr-login').onclick=()=>toggle('login');
      toggle('register');
    } else {
      name.hidden=true; name.disabled=true; name.required=false;
      phone.hidden=true; phone.disabled=true; phone.required=false;
      password.hidden=false; password.disabled=false; password.required=true;
      email.hidden=false; email.disabled=false; email.required=true;
      submit.textContent='دخول'; mode='staff';
    }
    const submitAuth=async e=>{
      if(e)e.preventDefault();
      if(busy)return;
      if(page==='customer'){
        if(name.value.trim().length<2){error.textContent='اكتب الاسم بالكامل (حرفين على الأقل).';name.focus();return;}
        if(!phone.value.trim()){error.textContent='اكتب رقم الموبايل.';phone.focus();return;}
      } else {
        if(!email.value.trim()||!password.value){error.textContent='اكتب البريد الإلكتروني وكلمة المرور.';return;}
      }
      busy=true; submit.disabled=true; submit.textContent='جارٍ الاتصال...'; error.textContent='جارٍ الاتصال بالخادم...';
      try{
        let result;
        if(page==='customer') result=await api(mode==='register'?'register_customer':'customer_login',{full_name:name.value.trim(),phone:phone.value.trim()},null);
        else result=await api('staff_login',{email:email.value.trim(),password:password.value},null);
        if(page==='customer'){token=result.session_token;store.set('customer_session',token);store.set('customer',JSON.stringify(result.customer));}
        else {token=result.access_token;profile=result.profile;store.set('staff_access',token);store.set('staff_profile',JSON.stringify(profile));}
        node.remove(); await boot();
      }catch(err){error.textContent=translateError(err.message);}
      finally{busy=false;submit.disabled=false;submit.textContent=page==='customer'?(mode==='register'?'إنشاء الحساب':'دخول'):'دخول';}
    };
    submit.type='button';
    submit.addEventListener('click',submitAuth);
    form.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitAuth(e)}});
  }
  function translateError(e){const map={PHONE_ALREADY_REGISTERED:'رقم الهاتف مسجل بالفعل. اختر تسجيل الدخول.',CUSTOMER_LOGIN_FAILED:'الاسم أو رقم الهاتف غير صحيح.',LOGIN_FAILED:'البريد الإلكتروني أو كلمة المرور غير صحيحة.',STAFF_NOT_AUTHORIZED:'هذا الحساب ليس لديه صلاحية دخول.',CUSTOMER_SESSION_INVALID:'انتهت الجلسة. سجّل الدخول مرة أخرى.',QR_EXPIRED:'انتهت صلاحية QR. اطلب من العميل تحديثه.',QR_ALREADY_USED:'تم استخدام هذا الكود بالفعل.',QR_INVALID:'كود QR غير صالح.',NO_REWARD_AVAILABLE:'لا توجد مكافأة متاحة لهذا العميل.'};return map[e]||`حصل خطأ: ${e}`}
  function requireAuth(){if(!token){authPanel();return false}return true}
  function doLogout(){
    store.del(page==='customer'?'customer_session':'staff_access');
    store.del('customer'); store.del('staff_profile'); store.del('scanned_qr');
    clearInterval(qrTimer);
    if(scanner){try{scanner.stop()}catch{}}
    location.reload();
  }
  function addLogout(){
    const candidates=[...document.querySelectorAll('.li,button,a,[role="button"]')];
    const target=candidates.find(el=>/sign\\s*out|تسجيل الخروج/i.test(el.textContent||''));
    if(target){target.style.cursor='pointer';target.setAttribute('role','button');target.tabIndex=0;
      target.addEventListener('click',e=>{e.preventDefault();doLogout()});
      target.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();doLogout()}});
    }else{
      const b=document.createElement('button');b.className='rr-action';b.textContent='تسجيل الخروج';b.onclick=doLogout;
      (document.querySelector('main')||document.body).append(b);
    }
  }
  async function customerBoot(){
    const me=await api('customer_me'); const c=me.customer||me.cust; store.set('customer',JSON.stringify(c));
    const nameEls=[...document.querySelectorAll('h3')].filter(x=>x.textContent.trim()==='Sara Ahmed');nameEls.forEach(x=>x.textContent=c.full_name);
    const cnt=$('#cnt'),rem=$('#rem'),pb=$('#pb');if(cnt)cnt.textContent=c.drink_count;if(rem)rem.textContent=Math.max(0,10-c.drink_count);if(pb)pb.style.setProperty('--p',`${c.drink_count*10}%`);
    const member=$('#card .mcard h3');if(member)member.textContent=c.full_name;
    const memberNo=$('#card .mcard .go');if(memberNo&&c.member_number)memberNo.textContent=`RR-${String(c.member_number).padStart(8,'0')}`;
    const phoneText=[...document.querySelectorAll('#profile small')].find(x=>x.textContent.includes('100 000'));if(phoneText)phoneText.textContent=c.phone;
    const act=$('#activity .tl');if(act){act.innerHTML=(me.transactions||[]).map(t=>`<div class="rr-live"><b>${esc(t.drinks?.name_ar||t.drinks?.name||'مشروب')}</b><p>${new Date(t.created_at).toLocaleString()}</p><small>الكمية: ${t.quantity}</small></div>`).join('')||'<p>لا توجد عمليات بعد.</p>'}
    const rewards=$('#rewards');if(rewards){const r=me.rewards?.[0];if(r){const h=rewards.querySelector('h3');if(h)h.textContent=r.name_ar||r.name;}}
    const qrContainers=document.querySelectorAll('#card .qr');
    async function refreshQR(){try{const q=await api('issue_qr');qrContainers.forEach(el=>{el.innerHTML='';if(window.qrcode){const code=qrcode(0,'M');code.addData(q.qr);code.make();el.innerHTML=code.createImgTag(5,8)}else el.textContent=q.qr})}catch(e){notice(translateError(e.message))}}
    await refreshQR();clearInterval(qrTimer);qrTimer=setInterval(refreshQR,25000);
    addLogout();
    setupNearby();
  }
  function setupNearby(){const sw=$('#nb');if(!sw)return;const lat=30.554832,lng=31.014116,radius=500;let watch=null;
    sw.onclick=()=>{if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;sw.classList.add('off');sw.setAttribute('aria-checked','false');$('#ns').textContent='تم إيقاف تنبيه الاقتراب.';return}
      if(!navigator.geolocation){$('#ns').textContent='المتصفح لا يدعم تحديد الموقع.';return}
      navigator.geolocation.getCurrentPosition(()=>{sw.classList.remove('off');sw.setAttribute('aria-checked','true');$('#ns').textContent='تنبيه الاقتراب يعمل أثناء فتح الصفحة.';watch=navigator.geolocation.watchPosition(pos=>{const rad=x=>x*Math.PI/180;const dlat=rad(pos.coords.latitude-lat),dlng=rad(pos.coords.longitude-lng);const a=Math.sin(dlat/2)**2+Math.cos(rad(lat))*Math.cos(rad(pos.coords.latitude))*Math.sin(dlng/2)**2;const d=6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));if(d<=radius&&!sessionStorage.getItem('rr_nearby_shown')){sessionStorage.setItem('rr_nearby_shown','1');if('Notification'in window&&Notification.permission==='granted')new Notification('Radio Café',{body:'مستني إيه؟ كارتك مستنيك'});else notice('مستني إيه؟ كارتك مستنيك')}} ,e=>$('#ns').textContent='تعذر قراءة موقعك: '+e.message,{enableHighAccuracy:true,maximumAge:10000});},e=>$('#ns').textContent='اسمح للموقع بالوصول لموقعك: '+e.message,{enableHighAccuracy:true});
    };
    const preview=$('#nd');if(preview)preview.onclick=()=>notice('مستني إيه؟ كارتك مستنيك');
  }
  async function cashierBoot(){
    const drinks=(await api('list_drinks')).drinks||[];const cp=$('#p-prev');if(!cp)throw Error('CASHIER_UI_NOT_FOUND');
    const start=cp.parentElement.querySelector('button');
    const scanPanel=$('#p-scan');
    if(scanPanel){let btn=scanPanel.querySelector('button');if(btn)btn.onclick=()=>startScan();const invalid=[...scanPanel.querySelectorAll('button')].find(b=>b.textContent.toLowerCase().includes('invalid'));if(invalid)invalid.hidden=true;}
    const chipBox=$('#dr');if(chipBox){chipBox.innerHTML=drinks.map((d,i)=>`<button class="chip ${i===0?'on':''}" data-id="${d.id}">${esc(d.name_ar||d.name)}</button>`).join('');selectedDrink=drinks[0]?.id;chipBox.onclick=e=>{const b=e.target.closest('button[data-id]');if(!b)return;chipBox.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');selectedDrink=b.dataset.id}}
    const qbox=document.createElement('div');qbox.id='rr-scanbox';qbox.className='rr-live';qbox.innerHTML='<h3>مسح QR العميل</h3><div id="rr-reader"></div><p id="rr-scanmsg">اضغط بدء المسح ووجّه الكاميرا إلى QR.</p><button class="rr-action" id="rr-startscan">بدء الكاميرا</button>';scanPanel?.append(qbox);
    $('#rr-startscan').onclick=()=>startScan();
    const reg=$('#reg');if(reg)reg.onclick=async()=>{try{const q=store.get('scanned_qr');if(!q)throw Error('امسح QR العميل أولًا');const out=await api('redeem_qr',{qr:q,drink_id:selectedDrink,quantity});store.del('scanned_qr');$('#okt').textContent=`تم تسجيل ${out.total_drinks} مشروب إجماليًا. المتبقي: ${out.drink_count}. المكافآت الجديدة: ${out.rewards_earned}.`;$('#p-prev').classList.remove('on');$('#p-ok').classList.add('on');notice('تم تسجيل المشروب بنجاح');}catch(e){notice(translateError(e.message));$('#p-err').classList.add('on')}};
    const mn=$('#mn'),pl=$('#pl'),qt=$('#qt');quantity=1;if(qt)qt.textContent=quantity;if(mn)mn.onclick=()=>{quantity=Math.max(1,quantity-1);if(qt)qt.textContent=quantity;notice('الكمية: '+quantity)};if(pl)pl.onclick=()=>{quantity=Math.min(4,quantity+1);if(qt)qt.textContent=quantity;notice('الكمية: '+quantity)};
    document.querySelectorAll('#p-ok button').forEach(b=>b.onclick=()=>{location.reload()});
    addLogout();
  }
  async function startScan(){
    try{if(!window.Html5Qrcode){
        const urls=['https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js','https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'];
        let loaded=false;
        for(const src of urls){try{await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.append(s)});if(window.Html5Qrcode){loaded=true;break}}catch{}}
        if(!loaded)throw Error('تعذر تحميل مكتبة قارئ QR. تحقق من الإنترنت ثم أعد المحاولة.');
      }
      if(scanner){try{await scanner.stop()}catch{}}
      scanner=new Html5Qrcode('rr-reader');const onScan=async text=>{try{await scanner.stop();scanner=null;store.set('scanned_qr',text);$('#rr-scanmsg').textContent='تم قراءة QR. اختر المشروب والكمية ثم سجل العملية.';$('#p-scan').classList.remove('on');$('#p-prev').classList.add('on');}catch(e){notice(e.message)}};
      const config={fps:10,qrbox:{width:240,height:240}};
      try{await scanner.start({facingMode:'environment'},config,onScan,()=>{});}
      catch(first){const cams=await Html5Qrcode.getCameras();if(!cams?.length)throw first;await scanner.start(cams[cams.length-1].id,config,onScan,()=>{});}
    }catch(e){notice('تعذر تشغيل الكاميرا. افتح الموقع عبر HTTPS واسمح للمتصفح باستخدام الكاميرا. '+e.message)}
  }
  async function adminBoot(){
    const data=await api('admin_dashboard');
    const set=(key,value)=>{const el=document.querySelector(`[data-kpi="${key}"]`);if(el)el.textContent=Number(value||0).toLocaleString();}
    set('customers',data.total_customers);set('visits',data.total_visits);
    set('drinks',data.drinks_collected);set('rewards',data.rewards_redeemed);
    const tbody=$('#tb');
    const customers=data.customers||[];
    if(tbody){
      tbody.innerHTML=customers.map(c=>{
        const tier=Number(c.total_drinks||0)>=25?'Gold':Number(c.total_drinks||0)>=10?'Silver':'New';
        const last=(data.transactions||[]).find(t=>t.customer_id===c.id);
        return `<tr><td>${esc(c.full_name)}</td><td>RR-${String(c.member_number||'').padStart(8,'0')}</td><td>${Number(c.drink_count||0)}</td><td>${tier}</td><td>${last?new Date(last.created_at).toLocaleString():'—'}</td></tr>`;
      }).join('')||'<tr><td colspan="5">لا يوجد عملاء مسجلون حتى الآن.</td></tr>';
    }
    const search=$('#q'),filter=$('#tf');
    const apply=()=>{if(!tbody)return;const term=(search?.value||'').toLowerCase();const tier=filter?.value||'';
      [...tbody.querySelectorAll('tr')].forEach((tr,i)=>{const c=customers[i];if(!c)return;const t=Number(c.total_drinks||0)>=25?'Gold':Number(c.total_drinks||0)>=10?'Silver':'New';tr.hidden=!((`${c.full_name} RR-${String(c.member_number||'')}`).toLowerCase().includes(term)&&(!tier||tier===t));});
    };
    search?.addEventListener('input',apply);filter?.addEventListener('change',apply);
    const table=$('#tb');
    if(table){const heading=table.closest('.gl')?.querySelector('h3');if(heading)heading.textContent='العملاء المسجلون';}
    addLogout();
  }
  async function boot(){try{if(page==='customer')await customerBoot();else if(page==='cashier')await cashierBoot();else await adminBoot()}catch(e){notice(translateError(e.message));if(['CUSTOMER_SESSION_INVALID','STAFF_SESSION_INVALID','STAFF_NOT_AUTHORIZED','STAFF_LOGIN_REQUIRED','CUSTOMER_SESSION_REQUIRED'].includes(e.message)){store.del(page==='customer'?'customer_session':'staff_access');authPanel()}}}
  style();
  if(!token)authPanel();else boot();
})();
