const root=document.querySelector('#admin-root');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let teacherKey='',rows=[],selectedGrade=0,selectedClass='';
const statements=['特別早會能夠令我加深對近代中國的認識。','特別早會能夠令我對祖國的歷史有更深入的了解。','特別早會能夠令我更了解祖國的發展。','總而言之，特別早會能夠令我加深對祖國的認識。'];
const labels=['非常同意','同意','不同意','非常不同意'];
function login(message=''){
 root.innerHTML=`<section class="login"><p class="intro-label">教師專用</p><h1>問答及問卷統計</h1><form class="login-form"><label for="teacher-key">老師存取碼</label><input id="teacher-key" type="password" autocomplete="off" required><button class="primary">查看統計</button><p class="error" role="alert">${esc(message)}</p></form></section>`;
 root.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();teacherKey=root.querySelector('input').value.trim();await refresh();});
}
async function refresh(){
 const b=root.querySelector('.primary');if(b)b.disabled=true;
 try{
  const response=await fetch(window.NATIONAL_DAY_SITE.apiUrl+'/stats',{method:'POST',headers:{'Content-Type':'application/json','x-teacher-key':teacherKey},body:'{}',signal:AbortSignal.timeout(20000)});
  const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'未能讀取統計，請再試。');rows=data.data.rows;render();
 }catch(e){if(!rows.length)login(e.message);else{const n=root.querySelector('#admin-notice');if(n)n.textContent='更新失敗，現時顯示上次讀取的資料。請重新整理統計。';}}
 finally{if(b)b.disabled=false;}
}
function filtered(){return rows.filter(r=>(!selectedGrade||r.grade===selectedGrade)&&(!selectedClass||r.class===selectedClass));}
function average(data){return data.length?(data.reduce((n,r)=>n+r.score,0)/data.length).toFixed(2):'—';}
function render(){
 const data=filtered(),groups=[];
 for(let g=1;g<=6;g++)for(const c of ['A','B','C','D'])if((!selectedGrade||g===selectedGrade)&&(!selectedClass||c===selectedClass)){
  const group=data.filter(r=>r.grade===g&&r.class===c);groups.push(`<tr><td>S${g}${c}</td><td>${group.length}</td><td>${average(group)}</td></tr>`);
 }
 root.innerHTML=`<div class="admin-heading"><h1>問答及問卷統計</h1><button id="logout">登出</button></div><div class="event-control"><div><strong class="admin-status">已提交 ${data.length} 份</strong><p>七題平均分：${average(data)} / 7<br>只有完成七題及四項問卷並成功提交的紀錄會計入統計。</p></div><button class="primary" id="reload-stats">重新整理統計</button></div><p id="admin-notice" class="admin-table-note" role="status">讀取時間：${esc(new Date().toLocaleString('zh-HK'))}</p><div class="grade-filter" aria-label="級別篩選">${[0,1,2,3,4,5,6].map(g=>`<button data-grade="${g}" aria-pressed="${selectedGrade===g}">${g?'S'+g:'全部級別'}</button>`).join('')}</div><div class="grade-filter" aria-label="班別篩選">${['','A','B','C','D'].map(c=>`<button data-class="${c}" aria-pressed="${selectedClass===c}">${c||'全部班別'}</button>`).join('')}</div><div class="table-wrap"><table><thead><tr><th>班別</th><th>已提交</th><th>平均分（滿分7分）</th></tr></thead><tbody>${groups.join('')}</tbody></table></div><section class="admin-survey"><h2>四項問卷</h2><p>統計範圍：${selectedGrade?'S'+selectedGrade:'全部級別'} · ${selectedClass||'全部班別'}。每份問卷每項計一次。</p><div class="table-wrap"><table><thead><tr><th>陳述</th>${labels.map(l=>`<th>${l}</th>`).join('')}<th>總數</th></tr></thead><tbody>${statements.map((s,i)=>`<tr><td>${esc(s)}</td>${labels.map((_,j)=>`<td>${data.filter(r=>r.survey[i]===j).length}</td>`).join('')}<td>${data.length}</td></tr>`).join('')}</tbody></table></div></section><button id="export" class="secondary export-link">匯出目前篩選的 CSV</button><p class="admin-table-note"><a href="${esc(window.NATIONAL_DAY_SITE.sheetUrl)}" target="_blank" rel="noopener">查看原有 Google Sheets 紀錄</a>。原有紀錄保留在試算表，未混入本頁的新後台統計。</p><section class="admin-survey"><h2>提交紀錄</h2><div class="table-wrap"><table><thead><tr><th>班別</th><th>學號</th><th>分數</th><th>提交時間</th></tr></thead><tbody>${data.map(r=>`<tr><td>S${r.grade}${esc(r.class)}</td><td>${r.number}</td><td>${r.score}</td><td>${esc(new Date(r.submitted_at).toLocaleString('zh-HK'))}</td></tr>`).join('')||'<tr><td colspan="4">尚未有提交紀錄。</td></tr>'}</tbody></table></div></section>`;
 root.querySelector('#logout').addEventListener('click',()=>{teacherKey='';rows=[];login();});
 root.querySelector('#reload-stats').addEventListener('click',refresh);
 root.querySelectorAll('[data-grade]').forEach(b=>b.addEventListener('click',()=>{selectedGrade=Number(b.dataset.grade);render();}));
 root.querySelectorAll('[data-class]').forEach(b=>b.addEventListener('click',()=>{selectedClass=b.dataset.class;render();}));
 root.querySelector('#export').addEventListener('click',()=>{
  const cell=v=>'"'+String(v).replace(/"/g,'""')+'"';
  const csv=[['提交編號','提交時間','級別','班別','學號','分數',...Array.from({length:7},(_,i)=>'第'+(i+1)+'題'),...statements],...data.map(r=>[r.id,r.submitted_at,'S'+r.grade,r.class,r.number,r.score,...r.answers.map(a=>a.map(n=>String.fromCharCode(65+n)).join('/')),...r.survey.map(n=>labels[n])])].map(r=>r.map(cell).join(',')).join('\r\n');
  const u=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=`國慶問答_${selectedGrade?'S'+selectedGrade:'全校'}${selectedClass}_${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
}
login();
