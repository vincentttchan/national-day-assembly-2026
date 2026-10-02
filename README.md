# 國慶特別早會 2026

2026年10月6日 · 樂善堂梁銶琚書院 · 司儀：陳浩賢老師。

網站：https://vincentttchan.github.io/national-day-assembly-2026/

10頁16:9簡報，包括升旗禮、歡迎家長代表、校長訓勉、專題短講、活動宣傳及班際小遊戲。方向鍵換頁；F全螢幕；P流程；H控制列。第9頁提供獨立3分鐘司儀計時器，學生不限時。

學生選擇S1–S6、A/B/C/D及學號，依次完成七題及同頁四項必答問卷。只有選好上一題才解鎖下一題，不揭曉答案或分數。學生作答透過Apps Script HTML Service和google.script.run收集到教師私人Google Sheets；資料、答案鍵及帳戶憑證不放在GitHub。

`site-config.js`設定Apps Script `/exec`作答網址及私人試算表網址。未設定時，入口會明確顯示服務尚未啟用，不會假裝提交成功。`apps-script/Code.gs`為後台範本，須在Script Properties設定ANSWER_KEY，並由學校帳戶部署；實際授權與網址以本次部署結果為準。

草稿存在學生的同一瀏覽器及Google Sheets；重新進入可繼續。提交具重複檢查。試算表包含登記／提交數、每班平均得分及四項問卷選項人數，各級分頁處理。後台試算表維持私人權限，學生只可執行受限制的作答方法。Apps Script有配額及並行限制，正式活動需作學校網絡及多裝置試演。

字型與圖示授權見assets/OFL-NotoSansTC.txt、OFL-NotoSerifTC.txt及LICENSE-Tabler.txt。插畫採用最新白色企領、彩色前中飾帶、男生深藍長褲及女生寶藍過膝裙版本；網站沒有附上學生參考照片。
