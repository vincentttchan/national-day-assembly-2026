const root=document.querySelector('#admin-root');
const sheet=window.NATIONAL_DAY_SITE?.sheetUrl;
if(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+/.test(sheet||'')){location.replace(sheet);}
else root.innerHTML='<section class="login"><p class="intro-label">國慶特別早會 2026</p><h1>問答後台準備中</h1><p>試算表接通後，本頁會連到教師專用的統計試算表。</p><a class="secondary" href="index.html">返回簡報</a></section>';
