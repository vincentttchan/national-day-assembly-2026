const SITE_ = 'https://vincentttchan.github.io/national-day-assembly-2026/';
const OWNER_ = 'chyv@lstlkkc.edu.hk';
const CONTENT_ = {"questions": [{"title": "國旗大星代表什麼？", "options": ["中國人民", "中國共產黨", "國家主席", "中央人民政府"], "multiple": false}, {"title": "新中國成立最重要的歷史意義是？", "options": ["中國立刻成為世界最發達國家", "結束近代長期受屈辱、分裂動盪的局面，人民從此當家作主", "馬上消除國內所有貧窮問題", "立刻實現全國所有人生活水準完全一樣"], "multiple": false}, {"title": "回望國家幾十年來的發展，面對各種成就與仍然存在的挑戰，作為中學生比較合適的態度是？", "options": ["只看缺點，完全否定國家發展成果", "只看成就，覺得所有問題已經全部解決", "客觀看見國家取得的進步，亦明白仍有不少課題有待繼續努力", "國家發展與自己完全沒有關係，不用關心"], "multiple": false}, {"title": "對於中學生而言，慶祝國慶最切實的做法是？", "options": ["只要放假、慶祝玩樂就足夠", "好好裝備自己，努力學習，建立身分認同，將個人成長與社會國家發展連結", "必須參加大型遊行活動才算是愛國", "只背誦歷史年份就足夠，日常生活不用實踐"], "multiple": false}, {"title": "中學生如何做好自己？", "options": ["遺忘過去", "深耕學業", "明辨是非", "銘記歷史", "堅守己見"], "multiple": true}, {"title": "中華人民共和國在哪一天成立？", "options": ["1911年10月10日", "1949年10月1日", "1997年7月1日", "1999年12月20日"], "multiple": false}, {"title": "要更深入了解祖國的歷史與發展，以下哪種學習方法最合適？", "options": ["只看社交平台的標題，不必查證", "只記住結論，不必了解背景", "閱讀可靠資料，了解歷史背景，並比較不同資料的證據", "只接受符合自己原有想法的資料"], "multiple": false}], "survey": ["特別早會能夠令我加深對近代中國的認識。", "特別早會能夠令我對祖國的歷史有更深入的了解。", "特別早會能夠令我更了解祖國的發展。", "總而言之，特別早會能夠令我加深對祖國的認識。"], "survey_options": ["非常同意", "同意", "不同意", "非常不同意"]};
const HEADERS_ = ['裝置驗證摘要','級別','班別','學號','登記時間','提交時間','作答草稿','問卷草稿','總分 / 7','第1題','第2題','第3題','第4題','第5題','第6題','第7題','問卷1','問卷2','問卷3','問卷4'];

function doGet() {
  const html = '<!doctype html><html lang="zh-Hant"><head><base href="'+SITE_+'" target="_top"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>國慶特別早會 · 班際小遊戲</title><link rel="stylesheet" href="assets/fonts-v10.css"><link rel="stylesheet" href="styles.css"><script>window.NATIONAL_DAY_GAS=true;</script><script src="quiz.js" defer></script></head><body class="student-page"><header class="student-header"><a href="'+ScriptApp.getService().getUrl()+'"><img src="assets/crest.png" alt="校徽"><span>國慶特別早會<small>2026年10月6日</small></span></a><span id="student-identity"></span></header><main id="quiz-root" class="quiz-root"><p>正在載入……</p></main><noscript>請啟用JavaScript以參加問答。</noscript></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('國慶特別早會 · 班際小遊戲');
}

function setupAssembly() {
  if (Session.getActiveUser().getEmail().toLowerCase() !== OWNER_) throw new Error('只供專案擁有人初始化。');
  const props = PropertiesService.getScriptProperties();
  // ANSWER_KEY必須先在Script Properties設定；答案不放在公開儲存庫。
  const key = JSON.parse(props.getProperty('ANSWER_KEY') || '[]');
  if (key.length !== 7) throw new Error('請先在Script Properties設定ANSWER_KEY。');
  if (props.getProperty('SHEET_ID')) { console.log('統計試算表：https://docs.google.com/spreadsheets/d/'+props.getProperty('SHEET_ID')+'/edit'); return; }
  const ss = SpreadsheetApp.create('國慶特別早會2026－班際問答及問卷統計');
  const responses = ss.getSheets()[0]; responses.setName('回應資料');
  responses.getRange(1,1,1,HEADERS_.length).setValues([HEADERS_]); responses.setFrozenRows(1);
  responses.getRange(1,1,1,HEADERS_.length).setFontWeight('bold').setBackground('#850d27').setFontColor('#ffffff');
  responses.hideColumns(1); responses.hideColumns(7,2);
  for (let g=1;g<=6;g++) {
    const tab=ss.insertSheet('S'+g); tab.getRange('A1:D1').setValues([['班別','已登記','已提交','平均得分 / 7']]);
    for (let c=0;c<4;c++) {
      const letter='ABCD'[c], row=c+2;
      tab.getRange(row,1).setValue('S'+g+letter);
      tab.getRange(row,2).setFormula('=COUNTIFS(\'回應資料\'!B2:B,'+g+',\'回應資料\'!C2:C,"'+letter+'")');
      tab.getRange(row,3).setFormula('=COUNTIFS(\'回應資料\'!B2:B,'+g+',\'回應資料\'!C2:C,"'+letter+'",\'回應資料\'!F2:F,"<>")');
      tab.getRange(row,4).setFormula('=IFERROR(AVERAGEIFS(\'回應資料\'!I2:I,\'回應資料\'!B2:B,'+g+',\'回應資料\'!C2:C,"'+letter+'",\'回應資料\'!F2:F,"<>"),"")');
    }
    tab.getRange('D2:D5').setNumberFormat('0.00');
    tab.getRange('A8:E8').setValues([['問卷項目'].concat(CONTENT_.survey_options)]);
    for (let q=0;q<4;q++) {
      tab.getRange(9+q,1).setValue(CONTENT_.survey[q]);
      for (let o=0;o<4;o++) tab.getRange(9+q,2+o).setFormula('=COUNTIFS(\'回應資料\'!B2:B,'+g+',\'回應資料\'!F2:F,"<>",\'回應資料\'!'+String.fromCharCode(81+q)+'2:'+String.fromCharCode(81+q)+',"'+CONTENT_.survey_options[o]+'")');
    }
    tab.setColumnWidth(1,460); tab.setColumnWidths(2,4,110); tab.getRange('A9:A12').setWrap(true);
    tab.getRange('A1:D1').setBackground('#850d27').setFontColor('#ffffff').setFontWeight('bold');
    tab.getRange('A8:E8').setBackground('#850d27').setFontColor('#ffffff').setFontWeight('bold');
    tab.setFrozenRows(1);
  }
  props.setProperty('SHEET_ID',ss.getId());
  console.log('統計試算表：'+ss.getUrl());
}

function quizApi(request) {
  try {
    if (!request || typeof request !== 'object' || JSON.stringify(request).length>12000) throw new Error('無效請求。');
    const path=request.path, token=request.token;
    if (!['state','questions','join','save','submit'].includes(path)) throw new Error('無效操作。');
    if (typeof token!=='string' || !/^[a-f0-9-]{72}$/i.test(token)) throw new Error('裝置識別失效，請重新進入。');
    const hash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token).map(x=>('0'+(x&255).toString(16)).slice(-2)).join('');
    const sheet=responseSheet_();
    if(path==='state') return {ok:true,data:{student:student_(findRecord_(sheet,hash))}};
    if(path==='questions') {
      if(!findRecord_(sheet,hash)) throw new Error('請先選擇級別、班別及學號。');
      return {ok:true,data:CONTENT_};
    }
    const lock=LockService.getScriptLock();
    if(!lock.tryLock(20000)) throw new Error('正在處理較多作答，請稍後重試。');
    try {
      const found=findRecord_(sheet,hash), value=request.value||{};
      if(path==='join') {
        if(!Number.isInteger(value.grade)||value.grade<1||value.grade>6||!['A','B','C','D'].includes(value.class)||!Number.isInteger(value.number)||value.number<1||value.number>99) throw new Error('請選擇有效的級別、班別及學號。');
        if(found) {
          if(found.values[1]!==value.grade||found.values[2]!==value.class||found.values[3]!==value.number) throw new Error('此裝置已有登記，請使用原有資料。');
          return {ok:true,data:{student:student_(found)}};
        }
        const all=sheet.getLastRow()>1?sheet.getRange(2,2,sheet.getLastRow()-1,3).getValues():[];
        if(all.some(r=>r[0]===value.grade&&r[1]===value.class&&r[2]===value.number)) throw new Error('這個班別及學號已登記，請使用原本的瀏覽器繼續。');
        const row=sheet.getLastRow()+1;
        const values=[hash,value.grade,value.class,value.number,new Date().toISOString(),'',JSON.stringify(CONTENT_.questions.map(()=>[])),'[null,null,null,null]',''].concat(Array(11).fill(''));
        sheet.getRange(row,1,1,HEADERS_.length).setValues([values]);
        CacheService.getScriptCache().put('row:'+hash,String(row),21600);
        return {ok:true,data:{student:student_({row,values})}};
      }
      if(!found) throw new Error('請先登記。');
      if(found.values[5]) return {ok:true,data:{submitted:true}};
      const answers=validateAnswers_(value.answers), survey=validateSurvey_(value.survey);
      const previous=JSON.parse(found.values[6]);
      const missing=previous.findIndex(a=>!a.length), unlocked=missing<0?7:missing;
      if(answers.some((a,i)=>i>unlocked&&a.length&&JSON.stringify(a)!==JSON.stringify(previous[i]))) throw new Error('請按次序完成題目。');
      if(survey.some(x=>x!==null)&&answers.some(a=>!a.length)) throw new Error('完成七題後才可填寫問卷。');
      const values=found.values; values[6]=JSON.stringify(answers); values[7]=JSON.stringify(survey);
      if(path==='submit') {
        if(answers.some(a=>!a.length)||survey.some(x=>x===null)) throw new Error('請完成全部七題及四項問卷。');
        const key=JSON.parse(PropertiesService.getScriptProperties().getProperty('ANSWER_KEY')||'[]');
        if(key.length!==7) throw new Error('服務尚未設定完成，請通知老師。');
        values[5]=new Date().toISOString();values[8]=answers.reduce((n,a,i)=>n+(JSON.stringify(a)===JSON.stringify(key[i])?1:0),0);
        for(let i=0;i<7;i++)values[9+i]=answers[i].map(x=>String.fromCharCode(65+x)).join(',');
        for(let i=0;i<4;i++)values[16+i]=CONTENT_.survey_options[survey[i]];
      }
      sheet.getRange(found.row,1,1,HEADERS_.length).setValues([values]);
      return {ok:true,data:{submitted:!!values[5]}};
    } finally { lock.releaseLock(); }
  } catch(e) { return {ok:false,error:String(e.message||'暫時未能完成操作，請重試。')}; }
}

function responseSheet_() {
  const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if(!id) throw new Error('作答服務尚未啟用，請通知老師。');
  return SpreadsheetApp.openById(id).getSheetByName('回應資料');
}
function findRecord_(sheet,hash) {
  const cache=CacheService.getScriptCache(), cached=Number(cache.get('row:'+hash));
  if(cached>=2&&cached<=sheet.getLastRow()) {const values=sheet.getRange(cached,1,1,HEADERS_.length).getValues();if(values[0][0]===hash)return {row:cached,values:values[0]};}
  if(sheet.getLastRow()<2)return null;
  const cell=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(hash).matchEntireCell(true).findNext();
  if(!cell)return null;const row=cell.getRow();cache.put('row:'+hash,String(row),21600);
  return {row,values:sheet.getRange(row,1,1,HEADERS_.length).getValues()[0]};
}
function student_(found) {
  if(!found)return null;const r=found.values;
  return {grade:r[1],class:r[2],number:r[3],submitted:!!r[5],answers:JSON.parse(r[6]),survey:JSON.parse(r[7])};
}
function validateAnswers_(answers) {
  if(!Array.isArray(answers)||answers.length!==7)throw new Error('無效作答。');
  return answers.map((a,i)=>{
    if(!Array.isArray(a)||(!CONTENT_.questions[i].multiple&&a.length>1)||new Set(a).size!==a.length||a.some(x=>!Number.isInteger(x)||x<0||x>=CONTENT_.questions[i].options.length)) throw new Error('無效作答。');
    return a.slice().sort((a,b)=>a-b);
  });
}
function validateSurvey_(survey) {
  if(!Array.isArray(survey)||survey.length!==4||survey.some(x=>x!==null&&(!Number.isInteger(x)||x<0||x>3)))throw new Error('無效問卷。');
  return survey.slice();
}
