
const gasTokenKey='national-day-gas-session-v10';
let gasToken='';
try{gasToken=localStorage.getItem(gasTokenKey)||'';}catch{}
if(!gasToken){gasToken=crypto.randomUUID()+crypto.randomUUID();try{localStorage.setItem(gasTokenKey,gasToken);}catch{}}
async function gasApi(path,value){
 const result=await new Promise((resolve,reject)=>{
  google.script.run.withSuccessHandler(resolve).withFailureHandler(()=>reject(new Error('連線暫時中斷，請稍後重試；答案會保留於此裝置。'))).quizApi({path,value:value===undefined?null:value,token:gasToken});
 });
 if(!result.ok)throw new Error(result.error||'暫時未能儲存，請稍後重試。');
 return result.data;
}
const root = document.querySelector('#quiz-root');
let identity=null, questions=[], surveyQuestions=[], surveyOptions=[], answers=[], survey=[null,null,null,null];
let index=0, screen='', grade=0, classroom='', busy=false, completed=false, loadedIdentity=false, refreshing=false;
let localDirty=false, saveTimer=null, savePromise=Promise.resolve();
const localKey='national-day-2026-gas-draft-v10';
const escapeText=value=>String(value).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
async function api(path,value){
 if(window.NATIONAL_DAY_GAS){return gasApi(path,value);}
 const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),10000);let response;
 try{response=await fetch(`api/${path}`,{signal:controller.signal,...(value===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)})});}
 catch{throw new Error('連線暫時中斷，答案會保留於此裝置，請稍後再試。');}finally{clearTimeout(timeout);}
 let data;try{data=await response.json();}catch{throw new Error('未能連接作答服務，請檢查網絡。');}
 if(!response.ok)throw new Error(data.error||'未能完成操作，請再試。');return data;
}
function error(message){const el=document.querySelector('#quiz-error');if(el)el.textContent=message;}
function savedStatus(message){const el=document.querySelector('#save-status');if(el)el.textContent=message;}
function heading(){return '<img class="student-intro-art" src="assets/book-landscape-mobile-v9.jpg" alt="" aria-hidden="true"><p class="intro-label">國慶特別早會 · 班際小遊戲</p>';}
function renderJoin(){
 screen='join';root.innerHTML=`<section class="intro">${heading()}<h1>一起想一想</h1><p class="lead">依次完成七題，再填寫四項問卷。<br>填寫資料後即可開始作答。</p><form class="identity-form" id="join-form"><label id="grade-label">級別</label><div class="grade-buttons" role="group" aria-labelledby="grade-label">${[1,2,3,4,5,6].map(g=>`<button type="button" data-grade="${g}" aria-pressed="${grade===g}">S${g}</button>`).join('')}</div><div class="form-row"><div><label id="class-label">班別</label><div class="class-buttons" role="group" aria-labelledby="class-label">${['A','B','C','D'].map(c=>`<button type="button" data-class="${c}" aria-pressed="${classroom===c}">${c}</button>`).join('')}</div></div><div><label for="number">學號</label><input id="number" name="number" type="number" min="1" max="99" step="1" placeholder="例如：07" inputmode="numeric" required></div></div><p id="quiz-error" class="error" role="alert"></p><button class="primary" type="submit">進入作答頁面</button></form></section>`;
 root.querySelectorAll('[data-grade]').forEach(b=>b.addEventListener('click',()=>{grade=Number(b.dataset.grade);root.querySelectorAll('[data-grade]').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.grade)===grade)));error('');}));
 root.querySelectorAll('[data-class]').forEach(b=>b.addEventListener('click',()=>{classroom=b.dataset.class;root.querySelectorAll('[data-class]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.class===classroom)));error('');}));
 document.querySelector('#join-form').addEventListener('submit',async e=>{e.preventDefault();if(!grade||!classroom){error('請選擇級別及班別。');return;}const b=e.target.querySelector('.primary');b.disabled=true;error('');try{await api('join',{grade,class:classroom,number:Number(document.querySelector('#number').value)});await refresh();}catch(e){error(e.message);}finally{b.disabled=false;}});
}
function firstMissing(){const n=answers.findIndex(a=>!a.length);return n<0?questions.length:n;}
function questionHeader(){return `<div class="question-top"><span class="question-progress">已作答 ${answers.filter(a=>a.length).length} / ${questions.length} 題</span><span class="step-hint">依次作答</span></div><nav class="question-tabs" aria-label="作答進度">${questions.map((q,i)=>`<button class="question-tab ${answers[i].length?'answered':''}" data-index="${i}" aria-current="${i===index}" aria-label="第${i+1}題${i>firstMissing()?'，未解鎖':answers[i].length?'，已作答':''}" ${i>firstMissing()?'disabled':''}>${i+1}</button>`).join('')}<button class="question-tab survey-tab" data-index="${questions.length}" aria-current="${screen==='survey'}" aria-label="四項問卷${firstMissing()<questions.length?'，未解鎖':''}" ${firstMissing()<questions.length?'disabled':''}>問卷</button></nav>`;}
function wireTabs(){root.querySelectorAll('[data-index]').forEach(b=>b.addEventListener('click',async()=>{const target=Number(b.dataset.index);if(target>firstMissing()||busy)return;if(target>index){if(!await flushSave())return;}index=target;renderStep();}));}
function updateNavigation(){
 const progress=root.querySelector('.question-progress');if(progress)progress.textContent=`已作答 ${answers.filter(a=>a.length).length} / ${questions.length} 題`;
 root.querySelectorAll('[data-index]').forEach(b=>{const i=Number(b.dataset.index);b.disabled=i>firstMissing()||busy;if(i<questions.length){b.classList.toggle('answered',answers[i].length>0);b.setAttribute('aria-label',`第${i+1}題${i>firstMissing()?'，未解鎖':answers[i].length?'，已作答':''}`);}});
 const next=root.querySelector('#forward');if(next)next.disabled=!answers[index].length||busy;
 const submit=root.querySelector('#submit-quiz');if(submit)submit.disabled=survey.some(x=>x===null)||busy;
}
function renderStep(){index=Math.min(index,firstMissing());if(index===questions.length)renderSurvey();else renderQuestion();window.scrollTo(0,0);}
function renderQuestion(){
 screen='question';const q=questions[index];root.innerHTML=`<section class="question ${q.multiple?'multiple':''}">${questionHeader()}<p class="question-kind">第${index+1}題 · ${q.multiple?'多選題，可選多項':'單選題'}</p><h1 class="question-title">${escapeText(q.title)}</h1><div class="options" role="group" aria-label="作答選項">${q.options.map((x,i)=>`<button class="option" data-option="${i}" aria-pressed="${answers[index].includes(i)}"><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${escapeText(x)}</span><span class="option-indicator" aria-hidden="true"><img src="assets/icon-check.svg" alt=""></span></button>`).join('')}</div><div class="quiz-navigation"><button class="secondary" id="back" ${index===0?'disabled':''}>上一題</button><button class="primary" id="forward" ${answers[index].length?'':'disabled'}>${index===questions.length-1?'進入問卷':'下一題'}</button></div><p class="save-status" id="save-status" aria-live="polite"></p><p id="quiz-error" class="error" role="alert"></p></section>`;
 root.querySelectorAll('[data-option]').forEach(b=>b.addEventListener('click',()=>{if(busy)return;const option=Number(b.dataset.option);answers[index]=q.multiple?(answers[index].includes(option)?answers[index].filter(x=>x!==option):[...answers[index],option].sort()):[option];if(firstMissing()<questions.length)survey=survey.map(()=>null);localDirty=true;stash();root.querySelectorAll('[data-option]').forEach(x=>x.setAttribute('aria-pressed',String(answers[index].includes(Number(x.dataset.option)))));updateNavigation();scheduleSave();error('');}));
 root.querySelector('#back').addEventListener('click',()=>{index--;renderStep();});
 root.querySelector('#forward').addEventListener('click',async()=>{if(!answers[index].length||busy)return;busy=true;updateNavigation();const ok=await flushSave();busy=false;if(ok){index++;renderStep();}else updateNavigation();});wireTabs();
}
function renderSurvey(){
 screen='survey';root.innerHTML=`<section class="survey">${questionHeader()}<div class="survey-heading"><div><p class="question-kind">最後一步 · 必答問卷</p><h1>四項問卷</h1></div><p>請選擇每項陳述的同意程度。<br>完成全部四項後，即可提交。</p></div><div class="survey-grid">${surveyQuestions.map((q,i)=>`<fieldset class="survey-card"><legend>${escapeText(q)}</legend><div class="survey-options">${surveyOptions.map((label,o)=>`<button type="button" data-survey="${i}" data-value="${o}" aria-pressed="${survey[i]===o}">${escapeText(label)}</button>`).join('')}</div></fieldset>`).join('')}</div><div class="quiz-navigation"><button class="secondary" id="return-quiz">返回第${questions.length}題</button><button class="primary" id="submit-quiz" ${survey.some(x=>x===null)?'disabled':''}>完成問卷並提交</button></div><p class="survey-progress" id="survey-progress">已完成 ${survey.filter(x=>x!==null).length} / 4 項問卷</p><p class="save-status" id="save-status" aria-live="polite"></p><p id="quiz-error" class="error" role="alert"></p></section>`;
 root.querySelectorAll('[data-survey]').forEach(b=>b.addEventListener('click',()=>{if(busy)return;const i=Number(b.dataset.survey);survey[i]=Number(b.dataset.value);localDirty=true;stash();root.querySelectorAll(`[data-survey="${i}"]`).forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.value)===survey[i])));root.querySelector('#survey-progress').textContent=`已完成 ${survey.filter(x=>x!==null).length} / 4 項問卷`;updateNavigation();scheduleSave();error('');}));
 root.querySelector('#return-quiz').addEventListener('click',()=>{index=questions.length-1;renderStep();});root.querySelector('#submit-quiz').addEventListener('click',submit);wireTabs();
}
function identityKey(){return `${identity.grade}${identity.class}${identity.number}`;}
function stash(){try{localStorage.setItem(localKey,JSON.stringify({identity:identityKey(),answers,survey}));}catch{}}
function snapshot(){return JSON.stringify({answers,survey});}
function queueSave(){
 clearTimeout(saveTimer);if(completed||!localDirty)return savePromise;
 const data=snapshot();savePromise=savePromise.catch(()=>false).then(async()=>{if(completed)return true;try{const result=await api('save',JSON.parse(data));if(snapshot()===data){localDirty=false;savedStatus('答案已儲存');}if(result.submitted){completed=true;renderComplete();}return true;}catch(e){savedStatus('答案暫存於此裝置；連線恢復後會重試。');error(e.message);return false;}});return savePromise;
}
function scheduleSave(){clearTimeout(saveTimer);savedStatus('正在儲存答案……');saveTimer=setTimeout(queueSave,2500);}
async function flushSave(){clearTimeout(saveTimer);await savePromise;return localDirty?await queueSave():true;}
async function submit(){
 if(busy||completed)return;if(firstMissing()<questions.length||survey.some(x=>x===null)){error('請完成七題及全部四項問卷後提交。');return;}
 busy=true;updateNavigation();const b=root.querySelector('#submit-quiz');b.textContent='正在提交……';
 try{if(!await flushSave())throw new Error('尚未完成儲存，請檢查網絡後重新提交。');await api('submit',{answers,survey});completed=true;try{localStorage.removeItem(localKey);}catch{}renderComplete();}
 catch(e){error(e.message);b.textContent='重新提交';}finally{busy=false;updateNavigation();}
}
function renderComplete(){screen='complete';root.innerHTML=`<section class="complete">${heading()}<h1>已收到你的答案</h1><p>謝謝參與國慶特別早會。<br>你可以關閉此頁面。</p><p class="receipt">${escapeText(`S${identity.grade}${identity.class}　學號 ${String(identity.number).padStart(2,'0')}`)}</p></section>`;}
function validDraft(d){return Array.isArray(d?.answers)&&d.answers.length===questions.length&&d.answers.every((a,i)=>Array.isArray(a)&&(!questions[i].multiple?a.length<=1:true)&&new Set(a).size===a.length&&a.every(n=>Number.isInteger(n)&&n>=0&&n<questions[i].options.length))&&Array.isArray(d.survey)&&d.survey.length===4&&d.survey.every(x=>x===null||Number.isInteger(x)&&x>=0&&x<4);}
async function refresh(){
 if(refreshing)return;refreshing=true;
 try{const data=await api('state');identity=data.student;if(!identity){if(screen!=='join')renderJoin();return;}
 document.querySelector('#student-identity').textContent=`S${identity.grade}${identity.class} · ${String(identity.number).padStart(2,'0')}`;
 if(identity.submitted){completed=true;try{localStorage.removeItem(localKey);}catch{}if(screen!=='complete')renderComplete();return;}
 if(!questions.length){const content=await api('questions');questions=content.questions;surveyQuestions=content.survey;surveyOptions=content.survey_options;}
 if(!loadedIdentity){loadedIdentity=true;answers=identity.answers;survey=identity.survey;try{const draft=JSON.parse(localStorage.getItem(localKey)||'null');if(draft?.identity===identityKey()&&validDraft(draft)){answers=draft.answers;survey=draft.survey;localDirty=true;}}catch{}index=firstMissing();renderStep();}
 if(localDirty&&!busy)scheduleSave();
 }catch(e){if(!screen){root.innerHTML=`<section class="intro">${heading()}<h1>暫時未能連接</h1><p class="notice">請檢查網絡，頁面會自動重試。</p><p id="quiz-error" class="error" role="alert"></p></section>`;}error(e.message);}finally{refreshing=false;}
}
function poll(){refresh().finally(()=>{if(!completed)setTimeout(poll,4500+Math.random()*1000);});}
if(window.NATIONAL_DAY_SITE?.mode==='github'){
 const url=window.NATIONAL_DAY_SITE.quizUrl;
 if(/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url||'')){location.replace(url);}
 else root.innerHTML='<section class="intro">'+heading()+'<h1>作答服務準備中</h1><p class="notice">問答收集服務尚未啟用，請稍後再進入。</p><a class="secondary" href="index.html#8">返回早會簡報</a></section>';
}else if(window.NATIONAL_DAY_GAS){refresh();}else{poll();}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
