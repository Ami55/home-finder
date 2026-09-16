const $=s=>document.querySelector(s);
const regions=['Vancouver','Burnaby','Port Coquitlam','Coquitlam','Burquitlam','New Westminster','Port Moody'];
const names={Condo:'Condo',Townhouse:'Townhouse',Duplex:'Duplex'};
const initial=[
['209–5818 Lincoln St','Vancouver',598000,'Condo',2,1997,980,500],
['74–2733 E Kent Ave','Vancouver',614888,'Townhouse',2,1995,986,423],
['141–7388 Macpherson Ave','Burnaby',598000,'Townhouse',2,2006,1013,406],
['204B–7025 Stride Ave','Burnaby',599888,'Condo',2,1993,903,336],
['305–1009 Howay St','New Westminster',550000,'Condo',2,1993,1022,620],
['803–719 Princess St','New Westminster',649800,'Condo',2,1995,null,591],
['108E–3081 Glen Dr','Coquitlam',619000,'Townhouse',2,1993,1197,542],
['10–1561 Booth Ave','Coquitlam',619000,'Townhouse',2,1997,982,363],
['2301–2955 Atlantic Ave','Coquitlam',599000,'Condo',2,2013,896,478],
['312–3136 St Johns St','Port Moody',600000,'Condo',2,1999,901,566],
['505–200 Newport Dr','Port Moody',639988,'Condo',2,1996,1116,654]
].map((r,i)=>({id:'conversation-'+i,address:r[0],city:r[1],price:r[2],type:r[3],bed:String(r[4]),year:r[5],area:r[6],strata:r[7],added:0,origin:'conversation'}));
const defaults=()=>({min:550000,max:680000,budgetRevision:'550-680',cities:regions.slice(0,5),beds:['2','1den','1'],types:['Condo','Townhouse','Duplex'],year:'',strata:'',sort:'match'});
function read(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}}
let pref={...defaults(),...read('home-preferences',{})};
if(read('home-preferences',{}).budgetRevision!=='550-680'){pref.min=550000;pref.max=680000;pref.budgetRevision='550-680';}
let custom=read('home-custom',[]);if(!Array.isArray(custom))custom=[];
let favorites=new Set(read('home-favorites',[]));let savedOnly=false;
function persist(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{toast('Browser storage is unavailable. Changes will last for this session only.');return false}}
function toast(text){$('#toast').textContent=text;$('#toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').style.display='none',4500)}
const money=n=>n===null||n===undefined?'Unknown':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n);
const fa=n=>new Intl.NumberFormat('en-CA').format(n);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeURL(url){try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
const searchURL=q=>'https://www.google.com/search?q='+encodeURIComponent(q);
function checks(id,values,labels,key){const root=$('#'+id);root.innerHTML='';values.forEach((v,i)=>{const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.value=v;input.checked=pref[key].includes(v);input.addEventListener('change',()=>{pref[key]=[...root.querySelectorAll('input:checked')].map(x=>x.value);saveRender()});label.append(input,document.createTextNode(labels[i]));root.append(label)})}
function sync(){checks('cities',regions,regions,'cities');checks('beds',['2','1den','1'],['2 bedrooms · preferred','1 bedroom + den','1 bedroom'],'beds');checks('types',Object.keys(names),Object.values(names),'types');['min','max','year','strata','sort'].forEach(k=>$('#'+k).value=pref[k])}
function results(){let rows=[...initial,...custom].filter(x=>x.price>=Number(pref.min)&&x.price<=Number(pref.max)&&pref.cities.includes(x.city)&&pref.beds.includes(x.bed)&&pref.types.includes(x.type)&&(!pref.year||(x.year!==null&&x.year>=Number(pref.year)))&&(pref.strata===''||(x.strata!==null&&x.strata<=Number(pref.strata)))&&(!savedOnly||favorites.has(x.id)));
const sorters={price:(a,b)=>a.price-b.price,year:(a,b)=>(b.year||0)-(a.year||0),strata:(a,b)=>(a.strata??Infinity)-(b.strata??Infinity),added:(a,b)=>b.added-a.added,match:(a,b)=>Number(b.bed==='2')-Number(a.bed==='2')||(b.year||0)-(a.year||0)||a.price-b.price};return rows.sort(sorters[pref.sort]||sorters.match)}
function saveRender(){persist('home-preferences',pref);render()}
function render(){let invalid=Number(pref.min)>Number(pref.max)||Number(pref.min)<0;$('#price-error').textContent=invalid?'Enter a valid price range. Minimum must not exceed maximum.':'';$('#budget-summary').textContent=money(Number(pref.min))+' — '+money(Number(pref.max));const rows=invalid?[]:results();$('#count').textContent=fa(rows.length);$('#all').setAttribute('aria-pressed',String(!savedOnly));$('#saved').setAttribute('aria-pressed',String(savedOnly));$('#saved').textContent='♡ Saved homes ('+fa(favorites.size)+')';
$('#cards').innerHTML=rows.length?rows.map(x=>{const url=safeURL(x.url)||searchURL('site:rew.ca '+x.address+' '+x.city);return `<article class="card"><div class="card-top"><span class="kind">${escapeHTML(names[x.type])}</span><button class="favorite ${favorites.has(x.id)?'active':''}" data-fav="${escapeHTML(x.id)}" aria-label="Save ${escapeHTML(x.address)}" aria-pressed="${favorites.has(x.id)}">${favorites.has(x.id)?'♥':'♡'}</button></div><strong class="price" dir="ltr">${money(x.price)}</strong><h3 class="address">${escapeHTML(x.address)}</h3><div class="location">${escapeHTML(x.city)}, BC</div><div class="specs"><div>${x.bed==='1den'?'1 + den':fa(Number(x.bed))}<small>Bedrooms</small></div><div>${x.year?new Intl.NumberFormat('en-CA',{useGrouping:false}).format(x.year):'—'}<small>Year built</small></div><div>${x.area?fa(x.area):'—'}<small>Sq ft</small></div><div dir="ltr">${money(x.strata)}<small dir="ltr">Strata / mo</small></div></div><div class="card-bottom"><span class="unverified">${x.origin==='conversation'?'Conversation · unverified':'Added by you · unverified'}</span><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${x.url?'View listing':'Search address'} ↗</a></div><div class="card-links"><a href="${escapeHTML(searchURL('site:rew.ca '+x.address+' '+x.city))}" target="_blank" rel="noopener noreferrer">Find on REW ↗</a><a href="${escapeHTML(searchURL('site:realtor.ca '+x.address+' '+x.city))}" target="_blank" rel="noopener noreferrer">Find on REALTOR.ca ↗</a></div>${x.origin==='manual'?`<button class="delete-btn" data-delete="${escapeHTML(x.id)}">Remove home</button>`:''}</article>`}).join(''):'<div class="empty"><h2>No homes match these filters</h2><p>Try a different budget or location, or add a home.<br>This is your shortlist, not all homes on the market.</p></div>';
$('#source-links').innerHTML=pref.cities.map(city=>`<div class="source-row"><strong>${escapeHTML(city)}</strong>${['rew.ca','realtor.ca'].map(site=>`<a href="${escapeHTML(searchURL('site:'+site+' '+'"'+city+'" ('+pref.types.join(' OR ')+') ('+pref.beds.map(b=>b==='1den'?'"1 bedroom den"':'"'+b+' bedroom"').join(' OR ')+') '+pref.min+'..'+pref.max))}" target="_blank" rel="noopener noreferrer">${site==='rew.ca'?'REW':'REALTOR.ca'} ↗</a>`).join('')}</div>`).join('');
}
['min','max','year','strata','sort'].forEach(k=>$('#'+k).addEventListener('input',e=>{pref[k]=e.target.value;saveRender()}));
$('#reset').onclick=()=>{pref=defaults();savedOnly=false;sync();saveRender()};$('#all').onclick=()=>{savedOnly=false;render()};$('#saved').onclick=()=>{savedOnly=true;render()};
$('#cards').addEventListener('click',e=>{const fav=e.target.closest('[data-fav]');if(fav){const id=fav.dataset.fav;favorites.has(id)?favorites.delete(id):favorites.add(id);persist('home-favorites',[...favorites]);render()}const del=e.target.closest('[data-delete]');if(del){custom=custom.filter(x=>x.id!==del.dataset.delete);favorites.delete(del.dataset.delete);persist('home-custom',custom);persist('home-favorites',[...favorites]);render();toast('Home removed from this browser’s shortlist.')}});
$('#daily-open').onclick=()=>$('#daily').showModal();$('#add-open').onclick=()=>$('#add').showModal();document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('#add-city').innerHTML=regions.map(x=>`<option>${x}</option>`).join('');
$('#add-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const url=safeURL(f.get('url'));if(!url){$('#add-error').textContent='Enter a valid listing URL starting with https:// or http://.';return}const optional=k=>f.get(k)===''?null:Number(f.get(k));const record={id:(crypto.randomUUID?crypto.randomUUID():'home-'+Date.now()+'-'+Math.random().toString(36).slice(2)),address:String(f.get('address')).trim(),url,price:Number(f.get('price')),city:f.get('city'),bed:f.get('bed'),type:f.get('type'),year:optional('year'),area:optional('area'),strata:optional('strata'),added:Date.now(),origin:'manual'};if(!record.address)return;custom.push(record);persist('home-custom',custom);$('#add').close();e.target.reset();$('#add-error').textContent='';render();toast(results().some(x=>x.id===record.id)?'Home added to your shortlist.':'Home saved. Adjust your filters to see it.')};
sync();render();
if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'get_filtered_homes',description:'Read the currently filtered personal home shortlist. Records are unverified conversation or manually entered data, not a live market feed.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input||Object.keys(input).length)throw new Error('Expected empty object');return {liveFeedConnected:false,homes:results()}}})}catch{}}

function emailHomes(){return $('#email-scope').value==='saved'?[...initial,...custom].filter(x=>favorites.has(x.id)):results()}
function emailMessage(){const homes=emailHomes();return ['My Metro Vancouver home shortlist','',...homes.flatMap((x,i)=>[
`${i+1}. ${x.address}, ${x.city}`,
`${money(x.price)} CAD | ${x.bed==='1den'?'1 bedroom + den':x.bed+' bedrooms'} | ${names[x.type]}`,
`Built: ${x.year??'Unknown'} | Area: ${x.area?x.area+' sq ft':'Unknown'} | Strata: ${money(x.strata)} / month`,
...(safeURL(x.url)?['Listing: '+safeURL(x.url)]:[]),
'REW search: '+searchURL('site:rew.ca '+x.address+' '+x.city),
'REALTOR.ca search: '+searchURL('site:realtor.ca '+x.address+' '+x.city),
'Status: unverified. Confirm price and availability on the source site.',''
]),'Prepared with Home Finder. This is a personal shortlist, not a live listing feed.'].join('\n')}
function updateEmail(){const count=emailHomes().length;$('#email-body').value=count?emailMessage():'';$('#email-error').textContent=count?`${count} home${count===1?'':'s'} included.`:'No homes to include. Save a home or choose currently visible homes.';$('#email-form button[type="submit"]').disabled=!count;$('#download-email').disabled=!count;$('#copy-email').disabled=!count}
$('#email-open').onclick=()=>{$('#email-scope').value=favorites.size?'saved':'visible';updateEmail();$('#email').showModal()};
$('#email-scope').onchange=updateEmail;
function validateEmailForm(){if(!$('#email-form').reportValidity())return false;if(!emailHomes().length){updateEmail();return false}return true}
function draftMailto(){return 'mailto:'+encodeURIComponent($('#email-to').value.trim())+'?subject='+encodeURIComponent($('#email-subject').value)+'&body='+encodeURIComponent($('#email-body').value)}
$('#email-form').onsubmit=e=>{e.preventDefault();if(!validateEmailForm())return;const link=draftMailto();if(link.length>7000){$('#email-error').textContent='This shortlist is too long for a reliable email link. Download the email draft or copy the message instead.';return}window.location.href=link;toast('Email draft requested. Review and send it in your email app.')};
const utf8base64=s=>btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));
function emailFile(){const subject=$('#email-subject').value.replace(/[\r\n]/g,' ');const to=$('#email-to').value.trim().replace(/[\r\n]/g,'');const encoded=utf8base64($('#email-body').value).match(/.{1,76}/g).join('\r\n');return 'To: '+to+'\r\nSubject: =?UTF-8?B?'+utf8base64(subject)+'?=\r\nX-Unsent: 1\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n'+encoded+'\r\n'}
$('#download-email').onclick=()=>{if(!validateEmailForm())return;const url=URL.createObjectURL(new Blob([emailFile()],{type:'message/rfc822'}));const a=document.createElement('a');a.href=url;a.download='home-shortlist.eml';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Draft downloaded. Open it in your email app to review and send.')};
$('#copy-email').onclick=async()=>{try{await navigator.clipboard.writeText($('#email-body').value);toast('Message copied. Paste it into your email.')}catch{$('#email-body').focus();$('#email-body').select();$('#email-error').textContent='Select and copy the message using your keyboard.'}};
