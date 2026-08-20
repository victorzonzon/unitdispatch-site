const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];

const header = $('.site-header');
const setHeader = () => header.classList.toggle('scrolled', scrollY > 18);
setHeader(); addEventListener('scroll', setHeader, {passive:true});

const menuBtn = $('.menu-button');
const mobileMenu = $('#mobile-menu');
menuBtn?.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!open));
  mobileMenu.hidden = open;
});
$$('#mobile-menu a').forEach(a => a.addEventListener('click', () => {
  menuBtn?.setAttribute('aria-expanded','false');
  if(mobileMenu) mobileMenu.hidden = true;
}));

$$('[data-scroll]').forEach(btn => btn.addEventListener('click', () => {
  document.querySelector(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth'});
}));

const io = new IntersectionObserver(entries => entries.forEach(e => {
  if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
}), {threshold:.12, rootMargin:'0px 0px -40px'});
$$('.reveal').forEach(el => io.observe(el));

let heroSeconds = 18;
setInterval(() => {
  heroSeconds = heroSeconds >= 59 ? 18 : heroSeconds + 1;
  const el = $('#hero-call-time');
  if(el) el.textContent = `00:${String(heroSeconds).padStart(2,'0')}`;
}, 1000);

const scenarios = {
  emergency: {
    lines:[
      ['caller','Caller','Hi, our AC stopped cooling and the house is already getting hot.'],
      ['ai','UnitDispatch','I can help with that. Is the system completely off, or is it running without cold air?'],
      ['caller','Caller','It is running, but only warm air is coming out.'],
      ['ai','UnitDispatch','Understood. What ZIP code is the property in?'],
      ['caller','Caller','75001.'],
      ['ai','UnitDispatch','That is inside the service area. Because this is an after-hours no-cooling call, I’m routing it to the on-call technician now.']
    ],
    outcome:'Urgency identified → Address captured → On-call dispatch triggered',
    decisions:['Intent: no-cooling emergency','After-hours routing rule matched','ZIP + service details captured','On-call transfer initiated']
  },
  lead: {
    lines:[
      ['caller','Caller','I’m looking to replace my water heater and wanted to get an estimate.'],
      ['ai','UnitDispatch','Absolutely. Is the current unit gas, electric, or tankless?'],
      ['caller','Caller','Gas, 50 gallon.'],
      ['ai','UnitDispatch','Thanks. Is it still operating, or has it failed?'],
      ['caller','Caller','It still works. We just want to replace it before it goes.'],
      ['ai','UnitDispatch','Got it. I’ll treat this as a non-emergency replacement estimate and can move you into the correct appointment window.']
    ],
    outcome:'Lead qualified → Job type captured → Estimate path selected',
    decisions:['Intent: replacement estimate','Qualified as new opportunity','Equipment + urgency captured','Estimate booking path selected']
  },
  existing: {
    lines:[
      ['caller','Caller','Your technician was here yesterday and I have a question about the invoice.'],
      ['ai','UnitDispatch','I can get this to the right person. May I have the name or phone number on the service account?'],
      ['caller','Caller','Jordan Miller, 214-555-0184.'],
      ['ai','UnitDispatch','Thank you. I found the service context. Is your question about the work performed, payment, or a charge on the invoice?'],
      ['caller','Caller','A charge on the invoice.'],
      ['ai','UnitDispatch','Understood. I’ll route this as an existing-customer billing question with your account context attached.']
    ],
    outcome:'Existing customer identified → Context preserved → Billing route created',
    decisions:['Intent: post-service question','Existing-customer path matched','Account + issue type captured','Billing follow-up routed']
  }
};
let activeScenario='emergency', demoRunning=false, demoTimer=null, demoSecs=0;
const transcript=$('#demo-transcript'), outcome=$('#demo-outcome'), timer=$('#demo-timer'), decisions=$$('#decision-list .decision');
function clearDemo(){
  demoRunning=false; clearInterval(demoTimer); demoSecs=0; if(timer) timer.textContent='00:00';
  if(transcript) transcript.innerHTML='';
  if(outcome) outcome.innerHTML='<span>Outcome</span><strong>Ready to run scenario</strong>';
  decisions.forEach((d,i)=>{d.className='decision waiting'; d.querySelector('p').textContent=['Understand caller intent','Apply business rules','Capture required details','Take the correct action'][i]});
  const run=$('#run-demo'); if(run){run.disabled=false; run.textContent='▶ Run this call';}
}
$$('.scenario-tab').forEach(tab=>tab.addEventListener('click',()=>{
  $$('.scenario-tab').forEach(t=>{t.classList.remove('active');t.setAttribute('aria-selected','false')});
  tab.classList.add('active');tab.setAttribute('aria-selected','true');activeScenario=tab.dataset.scenario;clearDemo();
}));
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function runDemo(){
  if(demoRunning) return; clearDemo(); demoRunning=true;
  const run=$('#run-demo'); run.disabled=true; run.textContent='Handling call…';
  demoTimer=setInterval(()=>{demoSecs++;timer.textContent=`00:${String(demoSecs).padStart(2,'0')}`},1000);
  const s=scenarios[activeScenario];
  for(let i=0;i<s.lines.length;i++){
    const [type,speaker,text]=s.lines[i];
    const b=document.createElement('div'); b.className=`bubble ${type}`; b.innerHTML=`<span class="speaker">${speaker}</span>${text}`;
    transcript.appendChild(b); transcript.scrollTop=transcript.scrollHeight;
    if(i===0){decisions[0].className='decision done';decisions[0].querySelector('p').textContent=s.decisions[0]}
    if(i===1){decisions[1].className='decision done';decisions[1].querySelector('p').textContent=s.decisions[1]}
    if(i===3){decisions[2].className='decision done';decisions[2].querySelector('p').textContent=s.decisions[2]}
    if(i===5){decisions[3].className='decision done';decisions[3].querySelector('p').textContent=s.decisions[3]}
    await wait(820);
  }
  clearInterval(demoTimer); outcome.innerHTML=`<span>Outcome</span><strong>${s.outcome}</strong>`; run.textContent='✓ Call complete'; demoRunning=false;
}
$('#run-demo')?.addEventListener('click',runDemo); $('#reset-demo')?.addEventListener('click',clearDemo); clearDemo();

function calcROI(){
  const missed=Math.max(0,+$('#missedCalls').value||0), qual=Math.max(0,Math.min(100,+$('#qualifiedRate').value||0))/100,
        close=Math.max(0,Math.min(100,+$('#closeRate').value||0))/100, value=Math.max(0,+$('#jobValue').value||0);
  const monthly=missed*4.33*qual*close*value;
  $('#roiResult').textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(monthly);
  $('#roiFormula').textContent=`Based on ${missed} missed calls/week`;
}
['missedCalls','qualifiedRate','closeRate','jobValue'].forEach(id=>$('#'+id)?.addEventListener('input',calcROI));calcROI();

$$('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open) $$('.faq-list details').forEach(o=>{if(o!==d)o.open=false})}));

$$('[data-modal]').forEach(btn=>btn.addEventListener('click',()=>$('#'+btn.dataset.modal+'-modal')?.showModal()));
$$('.modal-close').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog').close()));
$$('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}));

const form=$('#lead-form'), status=$('#form-status');
form?.addEventListener('submit',async e=>{
  e.preventDefault(); status.textContent=''; status.className='form-status';
  const required=$$('input[required]',form); let valid=true;
  required.forEach(el=>{el.classList.remove('invalid'); if(!el.value.trim() || (el.type==='email'&&!/^\S+@\S+\.\S+$/.test(el.value))){el.classList.add('invalid');valid=false;}});
  if(!valid){status.textContent='Please complete the required fields with valid information.';status.classList.add('error');required.find(x=>x.classList.contains('invalid'))?.focus();return}
  form.classList.add('loading'); $('button[type="submit"]',form).disabled=true;
  try{
    const data=new FormData(form);
    const res=await fetch(form.action,{method:'POST',body:data,headers:{'Accept':'application/json'}});
    const body=await res.json().catch(()=>({}));
    if(!res.ok || body.success===false) throw new Error(body.message||'Submission failed');
    form.reset(); status.textContent='Request received. We’ll review your call flow and follow up using the contact details you provided.';status.classList.add('success');
  }catch(err){
    status.textContent='The request could not be sent automatically. Please call +1 469 825 4387 and we’ll take it from there.';status.classList.add('error');
  }finally{form.classList.remove('loading');$('button[type="submit"]',form).disabled=false}
});
$$('input,select,textarea',form).forEach(el=>el.addEventListener('input',()=>el.classList.remove('invalid')));

$('#year').textContent=new Date().getFullYear();