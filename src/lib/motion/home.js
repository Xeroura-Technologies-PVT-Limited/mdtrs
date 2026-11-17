/* Homepage motion: the pinned globe story, patient/attender switch, city map,
   slide-to-quote, the weaving journey plane and scroll-linked details.
   Ported from the approved single-page prototype. Runs on the client only. */
import { createGlobe } from './globe';

const $ = (s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const openModal = () => window.dispatchEvent(new CustomEvent('mt:enquire'));

/* ---------- Split words ---------- */
function splitWords(el){
  const walk = node => [...node.childNodes].forEach(n=>{
    if(n.nodeType===3){
      const frag=document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(p=>{
        if(!p) return;
        if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(p));return;}
        const w=document.createElement('span');w.className='w';
        const i=document.createElement('span');i.className='wi';i.textContent=p;
        w.appendChild(i);frag.appendChild(w);
      });
      n.replaceWith(frag);
    } else if(n.nodeType===1) walk(n);
  });
  walk(el);
}

export function initHome({ gsap: G, ScrollTrigger: ST, reduce }){
const hasG = !!(G && ST) && !reduce;
const cleanups = [];
$$('[data-split]').forEach(el=>{ if(el.dataset.splitDone) return; el.dataset.splitDone='1'; splitWords(el); });
const quote=$('#quote');
if(quote && !quote.dataset.splitDone){ quote.dataset.splitDone='1'; quote.innerHTML=quote.textContent.split(' ').map(w=>`<span class="pw">${w}</span>`).join(' '); }

/* ---------- Hero globe story ---------- */
const globe = createGlobe($('#globe'), {reduce, start: 0});
cleanups.push(()=>globe.destroy());
const STAGES=[0,.12,.36,.6,.86];
let stageNow=0;
function setStage(p){
  let st=0; STAGES.forEach((v,i)=>{ if(p>=v) st=i; });
  if(st===stageNow) return; stageNow=st;
  $$('.stage').forEach(el=>el.classList.toggle('off', +el.dataset.stage!==st));
  $$('.hero-steps span').forEach(el=>el.classList.toggle('on', +el.dataset.step===st));
}

/* ---------- Patient / attender ---------- */
let persona='patient';
const NOTES={patient:'Your treatment, planned with a doctor, from the first report to your last follow-up.',attender:'For family and friends who travel with a patient: everything around the hospital, taken care of.'};
function setPersona(p){
  if(p===persona) return; persona=p;
  $('#switch').dataset.p=p;
  $$('#switch button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===p));
  $$('.j-title span').forEach(s=>s.classList.toggle('off',s.dataset.t!==p));
  $$('.j-panel').forEach(s=>s.classList.toggle('off',s.dataset.panel!==p));
  $('#jNote').textContent=NOTES[p];
  document.documentElement.dataset.persona=p;
}
$$('#switch button').forEach(b=>b.addEventListener('click',()=>setPersona(b.dataset.p)));

/* ---------- Map ---------- */
const CITIES=[
  {id:'del',name:'New Delhi',lon:77.2,lat:28.6,t:'3h 30m',sp:'Cardiac · Transplant · Oncology',dx:14,dy:-10},
  {id:'mum',name:'Mumbai',lon:72.9,lat:19.1,t:'3h 05m',sp:'Oncology · Orthopaedics · Neuro',dx:-92,dy:6},
  {id:'hyd',name:'Hyderabad',lon:78.5,lat:17.4,t:'3h 50m',sp:'Cardiac · Gastro & liver · Orthopaedics',dx:14,dy:-6},
  {id:'blr',name:'Bengaluru',lon:77.6,lat:12.97,t:'4h 05m',sp:'Orthopaedics · Fertility · Neuro',dx:-104,dy:4},
  {id:'maa',name:'Chennai',lon:80.3,lat:13.1,t:'4h 10m',sp:'Cardiac · Transplant · Eye care',dx:14,dy:6},
  {id:'cok',name:'Kochi',lon:76.3,lat:9.9,t:'4h 00m',sp:'Ayurveda · Rehabilitation',dx:-72,dy:16}
];
const ORIGINS=[{name:'Dubai',lon:55.3,lat:25.2},{name:'Muscat',lon:58.4,lat:23.6},{name:'Riyadh',lon:46.7,lat:24.7},{name:'Nairobi',lon:36.8,lat:-1.3},{name:'Dar es Salaam',lon:39.3,lat:-6.8},{name:'Dhaka',lon:90.4,lat:23.8}];
const W=1000,H=620,px=l=>(l-30)/66*W,py=l=>(38-l)/48*H,svg=$('#mapSvg'),NS='http://www.w3.org/2000/svg';
const mk=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e;};
for(let x=35;x<=95;x+=10)mk('line',{x1:px(x),y1:0,x2:px(x),y2:H,class:'grid-l'});
for(let y=-10;y<=35;y+=10)mk('line',{x1:0,y1:py(y),x2:W,y2:py(y),class:'grid-l'});
mk('text',{x:px(64),y:py(14),class:'sea','text-anchor':'middle'}).textContent='Arabian Sea';
mk('text',{x:px(88.5),y:py(14.5),class:'sea','text-anchor':'middle'}).textContent='Bay of Bengal';
mk('text',{x:px(77.5),y:py(23.2),class:'country','text-anchor':'middle'}).textContent='INDIA';
const arcs=mk('g',{});
ORIGINS.forEach(o=>{mk('circle',{cx:px(o.lon),cy:py(o.lat),r:3.5,class:'o-dot'});const end=o.lon>80;mk('text',{x:px(o.lon)+(end?-8:8),y:py(o.lat)+16,class:'o-lbl','text-anchor':end?'end':'start'}).textContent=o.name.toUpperCase();});
const cityG={};
CITIES.forEach(c=>{const g=mk('g',{class:'city'});mk('circle',{cx:px(c.lon),cy:py(c.lat),r:6,class:'c-ring'},g);mk('circle',{cx:px(c.lon),cy:py(c.lat),r:5,class:'c-dot'},g);mk('text',{x:px(c.lon)+c.dx,y:py(c.lat)+c.dy,class:'c-lbl'},g).textContent=c.name;cityG[c.id]=g;g.addEventListener('click',()=>drawArcs(c.id,!reduce));});
const list=$('#cityList');
CITIES.forEach(c=>{const li=document.createElement('li');li.innerHTML=`<button type="button" aria-pressed="false" data-id="${c.id}"><span class="nm">${c.name}</span><span class="tm">${c.t}</span><span class="sp">${c.sp}</span></button>`;list.appendChild(li);});
function drawArcs(id,animate){
  const c=CITIES.find(x=>x.id===id);arcs.innerHTML='';
  ORIGINS.forEach((o,i)=>{const x1=px(o.lon),y1=py(o.lat),x2=px(c.lon),y2=py(c.lat),mx=(x1+x2)/2,my=(y1+y2)/2-Math.max(60,Math.abs(x2-x1)*.28);
    const p=mk('path',{d:`M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`,class:'arc'},arcs);const L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=animate?L:0;
    if(animate){p.getBoundingClientRect();p.style.transition=`stroke-dashoffset 1.4s cubic-bezier(.22,.8,.2,1) ${i*.08}s`;p.style.strokeDashoffset=0;}});
  Object.values(cityG).forEach(g=>g.classList.remove('active'));cityG[id].classList.add('active');
  $$('button',list).forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id));
  $('#mapActive').textContent=c.name+' · '+c.t;
}
drawArcs('hyd',false);
list.addEventListener('click',e=>{const b=e.target.closest('button');if(b)drawArcs(b.dataset.id,!reduce);});

/* ---------- Slide to quote ---------- */
(function(){
  const s=$('#slider'),k=$('#knob');let drag=false,moved=false,x0=0,max=0,cur=0;
  const set=v=>{cur=v;k.style.setProperty('--kx',v+'px');s.style.setProperty('--x',(v+62)+'px');};
  k.addEventListener('pointerdown',e=>{drag=true;moved=false;x0=e.clientX-cur;max=s.clientWidth-66;k.setPointerCapture(e.pointerId);});
  k.addEventListener('pointermove',e=>{if(!drag)return;const v=Math.max(0,Math.min(max,e.clientX-x0));if(v>4)moved=true;set(v);});
  const end=()=>{if(!drag)return;drag=false;
    if(cur>max*.82){set(max);setTimeout(()=>{openModal();set(0);},250);}
    else if(hasG){const o={v:cur};G.to(o,{v:0,duration:.6,ease:'elastic.out(1,.6)',onUpdate:()=>set(o.v)});} else set(0);};
  k.addEventListener('pointerup',end);k.addEventListener('pointercancel',end);
  k.addEventListener('click',()=>{if(!moved)openModal();});
})();

/* ---------- Journey flight path ---------- */
// The plane weaves past the step cards: in front of some (skimming only the big numbers, never the copy),
// behind others. Pattern: behind, front, behind, behind, front, behind, front.
function journeyFlight(track){
  const svg=$('#fpSvg'), tr=$('#fpTrack'), trail=$('#fpTrail'), jet=$('#fpJet'), svgF=$('#fpSvgF'), trF=$('#fpTrackF'), trailF=$('#fpTrailF'), clip=$('#fpClip');
  const MODES=['b','f','b','b','f','b','f'];
  let W=0,H=0,pts=[],cum=[],L=0,x0=0,x1=0,switches=[];
  function catmull(P,seg=24){
    const out=[];
    for(let i=0;i<P.length-1;i++){
      const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];
      for(let k=0;k<seg;k++){
        const t=k/seg,t2=t*t,t3=t2*t;
        out.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                  0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);
      }
    }
    out.push(P[P.length-1]); return out;
  }
  function build(){
    W=track.scrollWidth; H=track.offsetHeight;
    svg.setAttribute('width',W); svg.setAttribute('height',H); svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const cards=$$('.step',track).map((el,i)=>({l:el.offsetLeft,t:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight,m:MODES[i%MODES.length]}));
    if(!cards.length) return;
    const top=cards[0].t, bot=cards[0].t+cards[0].h;
    const num=y=>top+y;                       // number band sits in the top ~90px of each card
    x0=cards[0].l-20; x1=cards[cards.length-1].l+cards[cards.length-1].w+20;
    // one gentle waypoint per card and per gap; joined by S-curves with flat tangents = clean, wave-like line
    const W8=[[x0, cards[0].m==='f'?top-22:top+(bot-top)*0.62]];
    switches=[];
    cards.forEach((c,i)=>{
      W8.push([c.l+c.w*0.5, c.m==='f' ? num(30+(i%2)*10) : top+(bot-top)*(0.5+0.12*(i%2))]);
      const n=cards[i+1];
      if(n){
        const gx=(c.l+c.w+n.l)/2;
        switches.push({x:gx, from:c.m, to:n.m});
        W8.push([gx, (c.m==='f'||n.m==='f') ? top-24 : (i%2 ? bot+28 : top+(bot-top)*0.18)]);
      }
    });
    W8.push([x1, cards[cards.length-1].m==='f'?top-22:top+(bot-top)*0.6]);
    pts=[];
    for(let i=0;i<W8.length-1;i++){
      const [xa,ya]=W8[i],[xb,yb]=W8[i+1],dx=xb-xa;
      for(let k=0;k<48;k++){ const t=k/48,u=1-t;
        const x=u*u*u*xa+3*u*u*t*(xa+dx/2)+3*u*t*t*(xb-dx/2)+t*t*t*xb;
        const y=u*u*u*ya+3*u*u*t*ya+3*u*t*t*yb+t*t*t*yb;
        pts.push([x,y]); }
    }
    pts.push(W8[W8.length-1]);
    cum=[0];L=0; let d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
    for(let i=1;i<pts.length;i++){ L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); cum.push(L); d+='L'+pts[i][0].toFixed(1)+' '+pts[i][1].toFixed(1); }
    tr.setAttribute('d',d); trail.setAttribute('d',d); trF.setAttribute('d',d); trailF.setAttribute('d',d);
    svgF.setAttribute('width',W); svgF.setAttribute('height',H); svgF.setAttribute('viewBox',`0 0 ${W} ${H}`);
    [trail,trailF].forEach(t=>{t.style.strokeDasharray=L; t.style.strokeDashoffset=L;});
    // front layer shows only where the flight passes over the cards
    let rects='', start=null;
    for(let x=0;x<=W;x+=4){ const on=front(x)>0.5; if(on&&start===null) start=x; if(!on&&start!==null){ rects+=`<rect x="${start}" y="0" width="${x-start}" height="${H}"/>`; start=null; } }
    if(start!==null) rects+=`<rect x="${start}" y="0" width="${W-start}" height="${H}"/>`;
    clip.innerHTML=rects;
  }
  function front(x){
    // 1 = in front of the cards, 0 = behind; eases across each switch point in the gaps
    let k=null;
    for(const s of switches){
      if(x < s.x-36){ k = s.from==='f'?1:0; break; }
      if(x <= s.x+36){ const u=(x-(s.x-36))/72, a=s.from==='f'?1:0, b=s.to==='f'?1:0; k=a+(b-a)*(u*u*(3-2*u)); break; }
    }
    if(k===null) k = MODES[(switches.length)%MODES.length]==='f'?1:0;
    return k;
  }
  function at(p){
    if(!pts.length) return;
    const dist=L*Math.max(0,Math.min(1,p));
    let lo=0,hi=cum.length-1; while(hi-lo>1){const m=(lo+hi)>>1; if(cum[m]<dist) lo=m; else hi=m;}
    const u=(dist-cum[lo])/((cum[hi]-cum[lo])||1);
    const x=pts[lo][0]+(pts[hi][0]-pts[lo][0])*u, y=pts[lo][1]+(pts[hi][1]-pts[lo][1])*u;
    const a=pts[Math.max(0,lo-2)], b=pts[Math.min(pts.length-1,hi+2)];
    const ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI+90;
    trail.style.strokeDashoffset=trailF.style.strokeDashoffset=L-dist;
    const k=front(x), sc=0.72+0.42*k;
    jet.style.transform=`translate(${x-17}px,${y-17}px) rotate(${ang}deg) scale(${sc})`;
    jet.style.zIndex=k>0.5?2:0; jet.style.opacity=(0.8+0.2*k).toFixed(2);
    jet.classList.toggle('behind',k<=0.5);
  }
  return {build,at};
}

const ctx = hasG ? G.context(()=>{
/* ---------- Scroll motion ---------- */
if(hasG){
  const mm=G.matchMedia();

  // Hero: pinned story; scroll drives the globe
  mm.add('(min-width: 901px)',()=>{
    ST.create({trigger:'#hero',start:'top top',end:'+=340%',pin:true,scrub:true,anticipatePin:1,
      onUpdate:self=>{ globe && globe.setProgress(self.progress); setStage(self.progress); }});
  });
  mm.add('(max-width: 900px)',()=>{
    ST.create({trigger:'#hero',start:'top top',end:'+=260%',pin:true,scrub:true,anticipatePin:1,
      onUpdate:self=>{ globe && globe.setProgress(self.progress); setStage(self.progress); }});
  });

  // Prologue words light up
  G.to('#quote .pw',{opacity:1,stagger:.05,ease:'none',scrollTrigger:{trigger:'#quote',start:'top 80%',end:'bottom 45%',scrub:true}});
  // Flight divider draws
  const dt=$('#divTrail'),DL=dt.getTotalLength();dt.style.strokeDasharray=DL;dt.style.strokeDashoffset=DL;
  G.to(dt,{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:'#divider',start:'top 95%',end:'bottom 40%',scrub:true}});


  // Plates parallax
  $$('.plate .art').forEach(a=>G.fromTo(a,{yPercent:-6,scale:1.12},{yPercent:6,scale:1.12,ease:'none',scrollTrigger:{trigger:a.parentElement,start:'top bottom',end:'bottom top',scrub:true}}));

  // Stacking care cards
  mm.add('(min-width: 861px)',()=>{
    const cards=$$('#stack .card');
    cards.forEach((c,i)=>{if(i===cards.length-1)return;G.to(c,{scale:.94,ease:'none',scrollTrigger:{trigger:cards[i+1],start:'top 85%',end:'top 20%',scrub:true}});});
  });

  // Patient → attender: pinned switch on desktop
  mm.add('(min-width: 901px)',()=>{
    ST.create({trigger:'#journeys',start:'top top',end:'+=90%',pin:true,anticipatePin:1,
      onUpdate:self=>{ if(self.isActive) setPersona(self.progress>.5?'attender':'patient'); }});
  });

  // Seals spin with scroll
  $$('.seal .spin').forEach((s,i)=>G.to(s,{rotation:i?-140:140,svgOrigin:'100 100',ease:'none',scrollTrigger:{trigger:'#hospitals',start:'top bottom',end:'bottom top',scrub:true}}));

  // Journey horizontal, with a plane weaving in front of and behind the steps
  mm.add('(min-width: 861px)',()=>{
    const track=$('#track');const dist=()=>Math.max(0,track.scrollWidth-innerWidth+40);
    const flight=journeyFlight(track);
    let tl=null;
    tl=G.timeline({scrollTrigger:{trigger:'#journey',start:'top top',end:()=>'+='+dist(),scrub:1,pin:true,invalidateOnRefresh:true,
      onRefresh:()=>{flight.build();flight.at(tl?tl.progress():0);}}})
      .to(track,{x:()=>-dist(),ease:'none'},0);
    tl.eventCallback('onUpdate',()=>flight.at(tl.progress()));
    flight.build(); flight.at(0);
  });

  // Map arcs
  ST.create({trigger:'#mapSvg',start:'top 75%',once:true,onEnter:()=>drawArcs('hyd',true)});


}

}) : null;
if(!hasG && reduce) globe.setProgress(.5);

/* Hero entrance, played once the logo intro hands over */
function pageIn(){
  const s0='.stage[data-stage="0"] ';
  G.timeline({defaults:{ease:'expo.out'}})
    .from('#globe',{opacity:0,scale:.965,duration:2.6,ease:'power2.out'},0)
    .from(s0+'.eyebrow',{y:14,opacity:0,duration:1.4},.35)
    .from(s0+'h1 .wi',{yPercent:110,duration:1.8,stagger:.14},.45)
    .from(s0+'.lead',{y:16,opacity:0,duration:1.6},1.0)
    .from(s0+'.hero-cta > *',{y:12,opacity:0,duration:1.4,stagger:.1},1.2)
    .from('.hero-steps, .scroll-cue',{opacity:0,duration:1.6,ease:'power2.out'},1.6);
}

return {
  pageIn: ()=>{ if(hasG) ctx.add(pageIn); },
  destroy(){ ctx && ctx.revert(); cleanups.forEach(f=>f()); }
};
}
