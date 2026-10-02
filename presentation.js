const landscape = (extra='') => `<img class="canvas-art ${extra}" src="assets/book-landscape-v9.jpg" alt="" aria-hidden="true">`;
const community = (extra='') => `<img class="support-art community-art ${extra}" src="assets/school-community-v9.jpg" alt="" aria-hidden="true">`;
const kicker = (number,label='') => `<div class="section-number">環節 ${number}${label?` <span>${label}</span>`:''}</div>`;
const slides = [
  {name:'國慶特別早會',kind:'cover',section:'',body:`${landscape()}<section class="slide cover"><p class="cover-year">2026</p><h1 class="cover-title">國慶<br>特別早會</h1><p class="cover-date-line">2026年10月6日</p></section>`},
  {name:'早會流程',kind:'agenda',section:'早會流程',body:`<section class="slide agenda"><div class="section-number">國慶特別早會</div><h1>早會流程</h1><div class="agenda-list">${['升旗禮','歡迎家長代表','校長訓勉','專題短講','活動宣傳','班際小遊戲'].map((x,i)=>`<div class="agenda-item"><span class="num">${String(i+1).padStart(2,'0')}</span><span>${x}</span></div>`).join('')}</div></section>`},
  {name:'升旗禮',kind:'flag',section:'01　升旗禮',body:`<img class="canvas-art ceremony-art" src="assets/flag-ceremony-v9.jpg" alt="" aria-hidden="true"><section class="slide title-slide flag">${kicker('01')}<h1>升旗禮</h1><p class="lead">請全體肅立，<br>面向國旗。</p></section>`},
  {name:'歡迎家長代表',kind:'welcome',section:'02　歡迎家長代表',body:`${community()}<section class="slide title-slide welcome">${kicker('02')}<h1>歡迎<br>家長代表</h1><p class="lead">感謝各位家長蒞臨。</p></section>`},
  {name:'校長訓勉',kind:'principal',section:'03　校長訓勉',body:`<section class="slide title-slide principal">${kicker('03')}<h1>校長訓勉</h1></section>`},
  {name:'回望開國，思己之責',kind:'talk',section:'04　專題短講',body:`<img class="canvas-art reflection-art" src="assets/history-reflection-v9.jpg" alt="" aria-hidden="true"><section class="slide title-slide talk">${kicker('04','專題短講')}<h1>回望開國，<br>思己之責</h1><p class="speaker">郭晴姿副校長</p></section>`},
  {name:'國慶紛紛Fun · 當日及進行中',kind:'activities',section:'05　活動宣傳',body:`<img class="support-art fair-art" src="assets/activity-fair-v9.jpg" alt="" aria-hidden="true"><section class="slide activities">${kicker('05','活動宣傳')}<h1>國慶紛紛Fun 2026</h1><div class="activity-list"><div class="activity-row feature"><div class="activity-date">10月6日<strong>今天午間</strong></div><div><h2>午間禮堂國慶攤位</h2><p>德公組、中文科、英文科、中史科、<br>普通話科、公經社科、公社科</p></div></div><div class="ongoing-activities"><div class="activity-row"><div class="activity-date">至10月7日</div><div><h2>全港學界國家安全<br>常識挑戰賽</h2><p>中一：科技科　／　中二至中三：公經社科<br>中四至中六：公社科</p></div></div><div class="activity-row"><div class="activity-date">至10月16日</div><div><h2>全港初中中國歷史文化<br>問答比賽</h2><p>中史科</p></div></div></div></div><button class="poster-button">查看完整活動海報</button></section>`},
  {name:'國慶紛紛Fun · 10月8日',kind:'upcoming',section:'05　活動宣傳',body:`${landscape('upcoming-art')}<section class="slide activities upcoming">${kicker('05','活動宣傳')}<h1>10月8日，繼續參與</h1><div class="activity-list"><div class="activity-row feature"><div class="activity-date">時間<strong>早讀課</strong></div><div><h2>國情書本推介</h2><p>學術發展組</p></div></div><div class="activity-row"><div class="activity-date">對象<strong>中四及中五</strong></div><div><h2>全國政協委員講座</h2><p>德公組、公社科</p></div></div></div><button class="poster-button">查看完整活動海報</button></section>`},
  {name:'班際小遊戲',kind:'quiz',section:'06　班際小遊戲',body:`${landscape('quiz-entry-art')}<section class="slide quiz-slide"><div>${kicker('06','班際小遊戲')}<h1>一起想一想</h1><p class="lead">掃描QR code，依次作答。</p><p class="sublead">完成七題問答，再填寫四項問卷。<br>全部完成後，記得提交。</p><div class="presentation-timer"><p class="countdown-label">司儀計時</p><div id="projected-time" class="countdown-value" role="timer" aria-label="司儀倒數計時">03:00</div><div class="timer-controls"><button id="timer-toggle" class="timer-start" aria-label="開始計時">開始</button><button id="timer-reset">重設</button><button id="timer-minus" aria-label="減少10秒">−10秒</button><button id="timer-plus" aria-label="增加10秒">+10秒</button></div><p class="timer-note">供現場掌握時間；學生作答不會到時關閉。</p></div></div><div class="quiz-code"><img src="assets/quiz-qr.svg" alt="班際小遊戲作答QR code"><a href="quiz.html" target="_blank" rel="noopener">開啟作答頁面</a></div></section>`},
  {name:'早會結束',kind:'ending',section:'早會結束',body:`${landscape()}<section class="slide title-slide ending"><div class="section-number">早會結束</div><h1>謝謝參與</h1><p class="lead">回望開國，<br>思己之責</p></section>`}
];
const content=document.querySelector('#slide-content'), controls=document.querySelector('.deck-controls');
let current=Math.min(slides.length-1,Math.max(0,Number(location.hash.slice(1))||0));
const timerKey='national-day-presentation-timer-v10';
let countdown={remaining:180,running:false,endsAt:null};
try{const saved=JSON.parse(sessionStorage.getItem(timerKey)||'null');if(saved&&Number.isFinite(saved.remaining)&&saved.remaining>=0&&saved.remaining<=3600&&typeof saved.running==='boolean'&&(!saved.running||Number.isFinite(saved.endsAt)))countdown=saved;}catch{}
function storeTimer(){try{sessionStorage.setItem(timerKey,JSON.stringify(countdown));}catch{}}
function timerSeconds(){return countdown.running?Math.max(0,Math.min(3600,Math.ceil((countdown.endsAt-Date.now())/1000))):countdown.remaining;}
function wireTimer(){
 document.querySelector('#timer-toggle')?.addEventListener('click',()=>{const seconds=timerSeconds();if(countdown.running){countdown={remaining:seconds,running:false,endsAt:null};}else if(seconds>0){countdown={remaining:seconds,running:true,endsAt:Date.now()+seconds*1000};}storeTimer();updateTimer();});
 document.querySelector('#timer-reset')?.addEventListener('click',()=>{countdown={remaining:180,running:false,endsAt:null};storeTimer();updateTimer();});
 for(const [id,amount] of [['timer-minus',-10],['timer-plus',10]])document.querySelector('#'+id)?.addEventListener('click',()=>{const seconds=Math.max(0,Math.min(3600,timerSeconds()+amount));countdown={remaining:seconds,running:countdown.running&&seconds>0,endsAt:countdown.running&&seconds>0?Date.now()+seconds*1000:null};storeTimer();updateTimer();});
}
function resize(){const scale=Math.min(innerWidth/1600,innerHeight/900);document.querySelector('#stage').style.transform=`scale(${scale})`;controls.style.bottom=`${Math.max(8,(innerHeight-900*scale)/2+13)}px`;}
function drawPage(page){
  document.querySelector('#stage').dataset.kind=slides[page].kind;
  content.innerHTML=slides[page].body;
  document.querySelector('.slide-header').hidden=page!==0;
  document.querySelector('#section-label').textContent=slides[page].section;
  document.querySelector('#mc-credit').innerHTML=page===0?'司儀：<strong>陳浩賢老師</strong>':'';
  document.querySelector('.slide-footer').hidden=page!==0;
  document.querySelector('#page-menu').textContent=`${String(page+1).padStart(2,'0')} / ${slides.length}`;
  document.querySelector('#previous').disabled=page===0;
  document.querySelector('#next').disabled=page===slides.length-1;
  document.querySelector('#page-links').innerHTML=slides.map((x,i)=>`<button class="page-link ${i===page?'current':''}" data-page="${i}">${String(i+1).padStart(2,'0')}　${x.name}</button>`).join('');
  history.replaceState(null,'',`#${page}`);
  document.title=`${slides[page].name} · 國慶特別早會`;
  content.querySelector('.poster-button')?.addEventListener('click',()=>document.querySelector('#poster-dialog').showModal());
  wireTimer();updateTimer();
}

const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let renderedPage=null, paintRun=0, pageTransition=null;
function revealText(){
  content.querySelectorAll('.section-number,.cover-year').forEach(node=>node.classList.add('reveal-context'));
  content.querySelectorAll('.slide h1').forEach(node=>node.classList.add('reveal-title'));
  content.querySelectorAll('.lead,.speaker,.sublead,.cover-date-line,.quiz-status').forEach((node,i)=>{node.classList.add('reveal-copy');node.style.setProperty('--reveal-delay',`${150+i*35}ms`);});
  content.querySelectorAll('.agenda-item,.activity-row').forEach((node,i)=>{node.classList.add('reveal-item');node.style.setProperty('--reveal-delay',`${130+i*55}ms`);});
}
function paint(){
  const run=++paintRun, page=current;
  pageTransition?.cancel();
  content.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
  const enter=()=>{
    if(run!==paintRun)return;
    drawPage(page);renderedPage=page;
    if(reducedMotion.matches){content.dataset.motionState='settled';return;}
    content.dataset.motionState='entering';revealText();
    pageTransition=content.animate([{opacity:0},{opacity:1}],{duration:260,easing:'ease-out'});
    Promise.allSettled(content.getAnimations({subtree:true}).map(animation=>animation.finished)).then(()=>{
      if(run===paintRun)content.dataset.motionState='settled';
    });
  };
  if(renderedPage!==null&&page!==renderedPage&&!reducedMotion.matches){
    content.dataset.motionState='leaving';
    pageTransition=content.animate([{opacity:1},{opacity:0}],{duration:120,easing:'ease-in'});
    pageTransition.finished.then(enter,()=>{});
  }else enter();
}
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)paint();});

function move(amount){current=Math.max(0,Math.min(slides.length-1,current+amount));paint();}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}}
document.querySelector('#previous').addEventListener('click',()=>move(-1));
document.querySelector('#next').addEventListener('click',()=>move(1));
document.querySelector('#page-menu').addEventListener('click',()=>document.querySelector('#pages-dialog').showModal());
document.querySelector('#page-links').addEventListener('click',e=>{const button=e.target.closest('[data-page]');if(button){current=Number(button.dataset.page);paint();document.querySelector('#pages-dialog').close();}});
document.querySelector('#fullscreen').addEventListener('click',fullscreen);
document.querySelector('#hide-controls').addEventListener('click',()=>document.body.classList.add('controls-hidden'));
document.querySelectorAll('.close-dialog').forEach(x=>x.addEventListener('click',()=>x.closest('dialog').close()));
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(e.key===' '&&e.target.closest('button,a,input,select,textarea'))return;if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();move(1);}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();move(-1);}if(e.key.toLowerCase()==='p')document.querySelector('#pages-dialog').showModal();if(e.key.toLowerCase()==='h')document.body.classList.toggle('controls-hidden');if(e.key.toLowerCase()==='f')fullscreen();if(e.key==='Home'){current=0;paint();}if(e.key==='End'){current=slides.length-1;paint();}});
function updateTimer(){
 const seconds=timerSeconds();if(countdown.running&&seconds===0){countdown={remaining:0,running:false,endsAt:null};storeTimer();}
 const el=document.querySelector('#projected-time');if(!el)return;
 const timeText=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 if(el.textContent!==timeText)el.textContent=timeText;
 el.classList.toggle('timer-ended',seconds===0);
 const toggle=document.querySelector('#timer-toggle'),label=countdown.running?'暫停':'開始',aria=countdown.running?'暫停計時':'開始計時';
 if(toggle.textContent!==label)toggle.textContent=label;
 if(toggle.getAttribute('aria-label')!==aria)toggle.setAttribute('aria-label',aria);
 if(toggle.disabled!==(seconds===0))toggle.disabled=seconds===0;
}
window.addEventListener('hashchange',()=>{current=Math.max(0,Math.min(slides.length-1,Math.floor(Number(location.hash.slice(1)))||0));paint();});
window.addEventListener('resize',resize);resize();paint();setInterval(updateTimer,250);
