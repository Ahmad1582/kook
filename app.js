const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const weekdays = ['ش','ی','د','س','چ','پ','ج'];
const defaults = { tasks: [], buys: [], events: [], transactions: [], settings: { day: 29, month: 8, year: 1405, theme: '#355b48' } };
let data;
try { data = JSON.parse(localStorage.getItem('kook-data-v3') || 'null') || structuredClone(defaults); }
catch { data = structuredClone(defaults); }
data = { ...defaults, ...data, settings: { ...defaults.settings, ...(data.settings || {}) } };
data.tasks ||= []; data.buys ||= []; data.events ||= []; data.transactions ||= [];
const $ = (s, root=document) => root.querySelector(s);
const fa = n => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jalaliKey = (day=data.settings.day) => `${data.settings.year}/${String(data.settings.month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
const dateLabel = () => `${fa(data.settings.day)} ${monthNames[data.settings.month-1]} ${fa(data.settings.year)}`;
function daysInMonth(month, year) { return month <= 6 ? 31 : month <= 11 ? 30 : ((year % 4) === 3 ? 30 : 29); }
function firstWeekday(month, year) { let m=8,y=1405,index=6; while(y<year||(y===year&&m<month)){index=(index+daysInMonth(m,y))%7;m++;if(m===13){m=1;y++;}} while(y>year||(y===year&&m>month)){m--;if(m===0){m=12;y--;}index=(index-daysInMonth(m,y)+7)%7;}return index; }
function persist() { localStorage.setItem('kook-data-v3', JSON.stringify(data)); localStorage.setItem('kook-pending-at',String(Date.now())); render(); if(window.KookCloud)window.KookCloud.save(data); }
function toast(message) { const node=$('#toast'); node.textContent=message; node.classList.add('show'); setTimeout(()=>node.classList.remove('show'),2200); }
function renderTasks() {
  const html = data.tasks.length ? data.tasks.map((t,i)=>`<div class="task ${t.done?'done':''}" onclick="toggleTask(${i})"><span class="check">${t.done?'✓':''}</span><span class="task-text">${escapeHtml(t.text)}</span><small>${escapeHtml(t.time||'امروز')}</small></div>`).join('') : '<div class="empty">هنوز کاری ثبت نکردی. یک کار کوچک برای امروز اضافه کن.</div>';
  ['#taskList','#taskList2'].forEach(sel=>{ const node=$(sel); if(node) node.innerHTML=html; });
  const done=data.tasks.filter(t=>t.done).length, total=data.tasks.length;
  $('#progressBar').style.width=(total ? done*100/total : 0)+'%'; $('#progressText').textContent=`${fa(done)} از ${fa(total)} کار`;
  $('#taskStat').innerHTML=`${fa(total)}<small>کار ثبت‌شده</small>`;
  const head=$('#tasks .card-head .tag'); if(head) head.textContent=`${fa(done)} انجام‌شده`;
}
function renderBuys() {
  const html=data.buys.length ? data.buys.map((x,i)=>`<label class="buy-row ${x.checked?'checked':''}"><input type="checkbox" ${x.checked?'checked':''} onchange="toggleBuy(${i})"><span>${escapeHtml(x.text)}</span><small>${escapeHtml(x.price||'')}</small></label>`).join('') : '<div class="empty">فهرست خریدت هنوز خالی است.</div>';
  ['#buyList','#buyList2'].forEach(sel=>{const node=$(sel);if(node)node.innerHTML=html;});
  const remaining=data.buys.filter(x=>!x.checked).length;
  $('#buyStat').innerHTML=`${fa(remaining)}<small>قلم باقی‌مانده</small>`; $('#shoppingCount').textContent=`${fa(remaining)} قلم باقی‌مانده`;
}
function renderCalendar() {
  const {month,year,day}=data.settings, max=daysInMonth(month,year);
  const first=firstWeekday(month,year);
  let cells=weekdays.map(d=>`<div class="weekday">${d}</div>`).join('');
  for(let i=0;i<first;i++) cells+='<div></div>';
  for(let n=1;n<=max;n++) { const has=data.events.some(e=>e.date===jalaliKey(n)); cells+=`<div class="${n===day?'today ':''}${has?'has-event':''}" onclick="selectDay(${n})">${fa(n)}</div>`; }
  $('#calendarGrid').innerHTML=cells;
  $('#calendar .calendar-wide h2').textContent=`${monthNames[month-1]} ${fa(year)}`;
  $('#week').innerHTML=Array.from({length:7},(_,i)=>{let n=((day-1+i)%max)+1;return `<button class="day ${i===0?'selected':''}" onclick="selectDay(${n})"><span>${weekdays[i]}</span><b>${fa(n)}</b>${data.events.some(e=>e.date===jalaliKey(n))?'<i></i>':''}</button>`;}).join('');
  $('#todayLabel').textContent=dateLabel(); $('#todaySchedule').textContent=dateLabel();
  $('#tasks .card-head p').textContent=dateLabel();
  renderEvents();
}
function renderEvents() {
  const events=data.events.filter(e=>e.date===jalaliKey()).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const html=events.length?events.map((e,i)=>`<div class="event"><time>${escapeHtml(e.time||'—')}</time><i class="bar" style="background:${['#e88f72','#a4bf84','#8eb7cb','#e1bf72'][i%4]}"></i><div><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.note||'برنامه‌ی شخصی')}</small></div><button class="link-btn" onclick="deleteEvent(${data.events.indexOf(e)})" aria-label="حذف برنامه">×</button></div>`).join(''):'<div class="empty">برای این روز هنوز برنامه‌ای ثبت نکردی.</div>';
  const home=$('#home .events'), calendar=$('#calendar .events'); if(home)home.innerHTML=html;if(calendar)calendar.innerHTML=html;
  const stat=$('#home .stats .stat:nth-child(2) strong'); if(stat)stat.innerHTML=`${fa(events.length)}<small>مورد امروز</small>`;
}
function renderTransactions() {
  const body=$('#ledgerBody'), transactions=data.transactions;
  body.innerHTML=transactions.length?transactions.slice().reverse().map(t=>`<tr><td>${escapeHtml(t.title)}</td><td>${t.type==='income'?'درآمد':'هزینه'}</td><td>${escapeHtml(t.date)}</td><td class="${t.type==='income'?'income':'expense'}">${t.type==='income'?'+':'−'} ${Number(t.amount).toLocaleString('fa-IR')}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">تراکنشی ثبت نشده است.</td></tr>';
  const income=transactions.filter(t=>t.type==='income').reduce((a,t)=>a+Number(t.amount),0), expense=transactions.filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0), balance=income-expense;
  const stats=$$('#money .stat strong'); stats[0].innerHTML=`${income.toLocaleString('fa-IR')}<small>تومان</small>`;stats[1].innerHTML=`${expense.toLocaleString('fa-IR')}<small>تومان</small>`;stats[2].innerHTML=`${balance.toLocaleString('fa-IR')}<small>تومان</small>`;
  $('#home .money-total strong').textContent=balance.toLocaleString('fa-IR'); const legends=$$('#home .money-legend b');legends[0].textContent=income.toLocaleString('fa-IR')+' تومان';legends[1].textContent=expense.toLocaleString('fa-IR')+' تومان';
  const total=income+expense,bar=$('#home .moneybar');bar.children[0].style.width=(total?income/total*100:0)+'%';bar.children[1].style.width=(total?expense/total*100:0)+'%';
}
function $$(s,root=document){return [...root.querySelectorAll(s)];}
function render(){renderTasks();renderBuys();renderEvents();renderTransactions();}
function toggleTask(i){data.tasks[i].done=!data.tasks[i].done;persist();}
function toggleBuy(i){data.buys[i].checked=!data.buys[i].checked;persist();}
function addBuy(id='quickBuy'){const input=document.getElementById(id),text=input.value.trim();if(!text)return;data.buys.unshift({text,price:'',checked:false});input.value='';persist();toast('به فهرست خرید اضافه شد');}
function addTask(){const input=$('#quickTask'),text=input.value.trim();if(!text)return;data.tasks.push({text,time:'امروز',done:false});input.value='';persist();toast('کار تازه اضافه شد');}
function addTaskPrompt(){const text=prompt('عنوان کار تازه:');if(text?.trim()){data.tasks.push({text:text.trim(),time:'امروز',done:false});persist();}}
function clearBought(){data.buys=data.buys.filter(x=>!x.checked);persist();toast('موارد تیک‌خورده پاک شدند');}
function go(page){$$('.screen').forEach(x=>x.classList.toggle('active',x.id===page));$$('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===page));$('#crumb').textContent=({home:'نمای کلی',calendar:'تقویم و برنامه',tasks:'کارهای من',money:'دخل‌وخرج',shopping:'فهرست خرید',settings:'تنظیمات'})[page];window.scrollTo({top:0,behavior:'smooth'});if(page==='settings')loadSettings();}
$$('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));$$('[data-goto]').forEach(b=>b.onclick=()=>go(b.dataset.goto));
function selectDay(n){data.settings.day=n;persist();renderCalendar();}
function shiftMonth(amount){let m=data.settings.month+amount,y=data.settings.year;if(m<1){m=12;y--;}if(m>12){m=1;y++;}data.settings.month=m;data.settings.year=y;data.settings.day=Math.min(data.settings.day,daysInMonth(m,y));persist();renderCalendar();}
function openModal(type='plan'){ $('#modalWrap').classList.add('open');$('#planFields').style.display=type==='money'?'none':'grid';$('#moneyFields').style.display=type==='money'?'grid':'none';$('#modalTitle').textContent=type==='money'?'ثبت تراکنش':'برنامه‌ی تازه';const date=$('#planFields input[name="date"]');if(date)date.value=jalaliKey(); }
function closeModal(){$('#modalWrap').classList.remove('open');}
$('#entryForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);if($('#moneyFields').style.display!=='none'){data.transactions.push({title:fd.get('title'),amount:Number(fd.get('amount')||0),type:fd.get('type'),date:dateLabel()});persist();}else{data.events.push({title:fd.get('title'),date:fd.get('date')||jalaliKey(),time:fd.get('time')||'',note:fd.get('note')||''});persist();}closeModal();e.target.reset();toast('با موفقیت ذخیره شد');};
function deleteEvent(index){data.events.splice(index,1);persist();}
function setTheme(color){data.settings.theme=color;const root=document.documentElement.style;root.setProperty('--green',color);root.setProperty('--side',`color-mix(in srgb, ${color} 5%, #f4f5f0)`);root.setProperty('--note',`color-mix(in srgb, ${color} 13%, white)`);root.setProperty('--tint',`color-mix(in srgb, ${color} 10%, white)`);root.setProperty('--line',`color-mix(in srgb, ${color} 10%, #eceee8)`);root.setProperty('--paper',`color-mix(in srgb, ${color} 2%, white)`);root.setProperty('--shadow',`0 12px 36px color-mix(in srgb, ${color} 7%, transparent)`);localStorage.setItem('kook-data-v3',JSON.stringify(data));const picker=$('#customColor');if(picker)picker.value=color;if(window.KookCloud)window.KookCloud.save(data);}
function loadSettings(){$('#settingDay').value=data.settings.day;$('#settingMonth').value=data.settings.month;$('#settingYear').value=data.settings.year;$('#customColor').value=data.settings.theme;$('#settingDatePreview').textContent=dateLabel();}
function saveSettings(){const month=Number($('#settingMonth').value),year=Number($('#settingYear').value),day=Math.max(1,Math.min(daysInMonth(month,year),Number($('#settingDay').value)||1));data.settings={day,month,year,theme:$('#customColor').value||data.settings.theme};persist();setTheme(data.settings.theme);renderCalendar();loadSettings();toast('تنظیمات ذخیره شد');}
$('#settingDay').oninput=$('#settingYear').oninput=$('#settingMonth').onchange=()=>{$('#settingDatePreview').textContent=`${fa($('#settingDay').value)} ${monthNames[Number($('#settingMonth').value)-1]} ${fa($('#settingYear').value)}`;};
$$('.calendar-wide .secondary').forEach((b,i)=>b.onclick=()=>shiftMonth(i===0?-1:1));
$('#customColor').onchange=e=>setTheme(e.target.value);
$$('.swatches button').forEach(b=>b.onclick=()=>setTheme(getComputedStyle(b).getPropertyValue('--sw').trim()));
$('#todayLabel').textContent=dateLabel(); setTheme(data.settings.theme); loadSettings(); renderCalendar(); render();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
window.Kook={getData:()=>data,setRemoteData:remote=>{data={...defaults,...remote,settings:{...defaults.settings,...(remote.settings||{})}};localStorage.setItem('kook-data-v3',JSON.stringify(data));setTheme(data.settings.theme);renderCalendar();loadSettings();render();}};
function exportBackup(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='kook-backup.json';a.click();URL.revokeObjectURL(url);}
function importBackup(event){const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const incoming=JSON.parse(reader.result);if(!Array.isArray(incoming.tasks)||!Array.isArray(incoming.buys))throw new Error();data={...defaults,...incoming,settings:{...defaults.settings,...(incoming.settings||{})}};persist();setTheme(data.settings.theme);renderCalendar();loadSettings();toast('اطلاعات بازیابی شد');}catch{toast('فایل پشتیبان معتبر نیست');}};reader.readAsText(file);}
