(()=>{"use strict";const e="不明なテスト",t="INFO",i="WARN",n="ERROR";function o(e,o,s){let l=o==t?"[97m":o==i?"[33m":o==n?"[31m":"[90m";console.log(l+"["+new Intl.DateTimeFormat("ja-JP",{timeStyle:"medium"}).format(new Date)+"] ["+e+"] ["+o+"] "+s+"[0m")}function s(s){if(o("iFrame",t,"Checking iFrame contentWindow..."),null!=s.contentWindow){o("iFrame",t,"Successfully get iFrame document."),o("iFrame",t,"Finding VideoPlayer (#video-player)");const r=s.contentWindow.document.getElementById("video-player");null!=r?(o("VideoPlayer",t,"Successfuly found video! "+r),o("VideoPlayer",t,'Regsitering "ended" event to target video!'),r.addEventListener("ended",(n=>{o("VideoPlayer",t,"Playback ended, sending notification..."),o("Notify",t,"Notify process started..."),o("Notify",t,"Finding iFrame..."),document.getElementById("modal-inner-iframe"),setTimeout((()=>{const n=a(!1);if(o("Automation",t,"Finding next video or test..."),null!=n)o("Automation",t,"Next video found! clicking."),d(n.clickTarget);else{o("Autoamtion",t,"Next video not found! Finding test...");const n=function(){const e=l().filter((e=>(e.isEssayTest||e.isEvalutionTest)&&!e.isGateClosed&&!e.isGood&&!e.isOpened));return e.length>0?e[0]:null}();null!=n&&(o("Automation",t,"Next test found!, sending notify."),function(e){if("".length>0){o("Discord",t,"Sending notification to discord.");const n=new XMLHttpRequest;n.open("POST",""),n.setRequestHeader("Content-Type","application/json"),n.addEventListener("readystatechange",(e=>{4==n.readyState&&(204==n.status?o("Discord",t,"Successfully sent notification to discord."):400==n.status&&(o("Discord",i,"Failed to sent notification to discord."),o("Discord",i,n.responseText)))})),n.send(JSON.stringify({username:"N予備校",avatar_url:"https://www.nnn.ed.nico/favicon.ico",content:e}))}}(" テスト `%title%` を受けてください".replace("%title%",null!=n?n.title:e)),function(e,t){const i=new Notification(e,{body:t,icon:"https://www.nnn.ed.nico/favicon.ico"});setTimeout(i.close.bind(i),5e3)}("テストを受けてください",null!=n?n.title:e),o("Automation",t,"Successfully sent next test notify."))}}),1500),o("VideoPlayer",t,"Successfully sent notification!")})),o("VideoPlayer",t,'Successfully registered "ended" event to target video!'),o("VideoPlayer",t,'Registering "pause" event to target video!'),r.addEventListener("pause",(e=>{r.currentTime!=r.duration&&(o("VideoPlayer",t,"\nDamn, that trashy high school just paused the video!\nI'll never forgive you! I'm gonna resume playback!\nLMAO."),e.preventDefault(),e.stopImmediatePropagation(),r.play())})),o("VideoPlayer",t,'Successfully registered "pause" event to target video!'),o("VideoPlayer",t,'Registering "seeking" event to target video!'),r.addEventListener("seeking",(e=>{e.preventDefault(),e.stopImmediatePropagation()})),o("VideoPlayer",t,'Successfuly registered "seeking" event to target video!'),o("VideoPlayer",t,'Registering "seeked" event to target video!'),r.addEventListener("seeked",(e=>{e.preventDefault(),e.stopImmediatePropagation()})),o("VideoPlayer",t,'Successfully registered "seeked" event to target video!')):o("VideoPlayer",n,"Failed to find video!")}else o("iFrame",n,"Failed to get iFrame document!")}function l(){const e=document.querySelectorAll("div.l-contents#sections-contents>div.section>div.u-card>ul.u-list>li"),t=[];return e.forEach(((e,i)=>{const n=e.className,o=e.getElementsByTagName("a");let s=-1;if(n.includes("movie")){const t=e.querySelector("a>div.section-optional-info>p.content-amount.movie-length").innerText.split(":");2==t.length?s=60*Number(t[0])+Number(t[1]):3==t.length&&(s=60*Number(t[0])*60+60*Number(t[1])+Number(t[2]))}let l={title:e.querySelector("a>div.section-main-info>div>p>span.title").innerText,isGood:n.includes("good"),isMovie:n.includes("movie"),isSupplement:n.includes("supplement"),isEvalutionTest:n.includes("evaluation-test"),isEssayTest:n.includes("essay-test"),isOpened:o.length>0&&o[0].className.includes("is-selected"),isGateClosed:o.length>0&&o[0].className.includes("is-gate-closed"),movieTimeSeconds:s,element:e,clickTarget:o.length>0?o[0]:null};t[i]=l})),t}function a(e){const t=l().filter((t=>t.isMovie&&!t.isOpened&&!t.isGood&&!t.isGateClosed&&(e&&t.isSupplement||!t.isSupplement)));return t.length>0?t[0]:null}function d(e){const t=document.createEvent("MouseEvent");t.initEvent("click",!0,!0),e.dispatchEvent(t)}if("denied"!=window.Notification.permission&&"default"!=window.Notification.permission||window.Notification.requestPermission().then((()=>{"granted"==window.Notification.permission?o("Permission",t,"Desktop Notification Permission is now accepted."):o("Permission",i,"Desktop Notification Permission is not accepted, desktop notifications will be not sent to you.")})),document.getElementById("modal-inner-iframe")instanceof HTMLIFrameElement)o("main",n,"iFrame already appended, please reload page and execute this script before start playback.");else{new MutationObserver((()=>{o("MutationObserver",t,"DOM change detected, registering 'load' event to iFrame (#modal-inner-iframe)!");const e=document.getElementById("modal-inner-iframe");null!=e&&null!=e?(e.addEventListener("load",(i=>{if(o("iFrame",t,"iFrame loaded."),o("iFrame",t,"Checking iFrame contentWindow..."),null!=e.contentWindow){o("iFrame",t,"iFrame contentWindow found!");const i=function(){const e=l().filter((e=>e.isOpened));return e.length>0?e[0]:null}();if(null==i)return;if(i.isEssayTest||i.isEvalutionTest||!i.isMovie)o("iFrame",t,"Opened iFrame is Essay or Evalution test, skipping.");else if(o("iFrame",t,"Finding VideoPlayer..."),e.contentWindow.document.getElementById("video-player")instanceof HTMLMediaElement)o("iFrame",t,"VideoPlayer already loaded, use this."),s(e);else{o("iFrame",t,"VideoPlayer not loaded, use setInterval to try find...");const i=setInterval((()=>{if(null!=e.contentWindow){const n=e.contentWindow.document.getElementById("video-player");null!=n&&null!=n&&(o("iFrame/Timer",t,"VideoPlayer loaded!"),clearInterval(i),s(e))}}),10)}}})),o("MutationObserver",t,"Successfully registered 'load' event to iFrame (#modal-inner-iframe)")):o("MutationObserver",n,"Failed to find iFrame (#modal-inner-iframe)! Event is not registered.")})).observe(document.querySelector('div[data-react-class="App.Modal"'),{childList:!0});{const e=a(!1);null!=e&&(o("main",t,"Auto playback starting."),d(e.clickTarget))}}const r=l();document.querySelectorAll("li.movie:not(.supplement) .movie-length");let c=0,u=0;r.forEach((e=>{e.isMovie&&!e.isSupplement&&(e.isGood?u+=e.movieTimeSeconds:c+=e.movieTimeSeconds)})),document.querySelectorAll("li.movie.supplement .movie-length");let m=0,f=0;r.forEach((e=>{e.isMovie&&e.isSupplement&&(e.isGood?f+=e.movieTimeSeconds:m+=e.movieTimeSeconds)}));let v=c+m;Math.floor(v/3600);const g=Math.floor(c/3600),p=(Math.floor(m/3600),Math.floor(v%3600/60),Math.floor(c%3600/60));Math.floor(m%3600/60);let y="必修教材: "+(g>0?g+"時間":"")+p+"分"+c%60+"秒";const h=Math.floor(u/3600),F=Math.floor(u%3600/60),E=u%60,M=Math.round(u/c*100),S=Math.floor((c-u)/3600),N=Math.floor((c-u)%3600/60),w=(c-u)%60;let P="視聴済み必修教材: "+(h>0?h+"時間":"")+(F>0?F+"分":"")+(E>0?E+"秒":"")+" ("+M+"%)",T="未視聴必修教材: "+(S>0?S+"時間":"")+(N>0?N+"分":"")+(w>0?w+"秒":"");const b=Math.floor(f/3600),k=Math.floor(f%3600/60),V=f%60,I=Math.round(f/m*100),O=Math.floor((m-f)/3600),A=Math.floor((m-f)%3600/60),D=(m-f)%60;let L="視聴済みNプラス教材: "+(b>0?b+"時間":"")+(k>0?k+"分":"")+(V>0?V+"秒":"")+" ("+I+"%)",q="未試聴Nプラス教材: "+(O>0?O+"時間":"")+(A>0?A+"分":"")+(D>0?D+"秒":""),B=document.getElementsByClassName("description");void 0===B&&location.reload();let R=document.querySelectorAll("li.movie:not(.supplement)").length,W=(document.getElementsByClassName("movie").length,document.getElementsByClassName("evaluation-test").length);B[0].innerHTML="<div class='u-card'><div class='u-list-header typo-list-title'>この単元の進捗状況</div><div class='u-card-inner'>"+y+"<br>"+P+"<br>"+T+"<br>"+L+"<br>"+q+"<br>必修教材動画数: "+R+"本<br>確認テストの数: "+W+"個</div></div>"+B[0].innerHTML})();