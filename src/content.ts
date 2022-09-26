// 内部処理用
// 通信環境が悪い場合は数値を増やすことを推奨します。[単位はミリ秒。]
//
// 右側のページが読み込まれてからの動画の各種イベントの登録までの遅延を設定します。
const VIDEO_EVENT_REGISTER_DELAY: number = 3000;
//
// 動画の再生が終了した後に次の動画やテストがあるかをチェックするまでの遅延を設定します。
const VIDEO_ENDED_SEARCH_NEXT_DELAY: number = 1500;
//
// Discord への通知用Webhook URLを指定します
const DISCORD_WEBHOOK_URL: string = "";
//
// Discord への通知の際、メッセージの最初に挿入する文を指定します。
// メンションの場合は <@!ユーザーID> の形式で入力するとメンションになります。
const DISCORD_MENTION: string = "";
//
// ページを開いたとき、自動で再生を開始するかどうか [true/false]
// true にすると、ページを開いたらすぐに動画の再生が始まります。(行うべきがテストではない場合)
// false にすると、ページを開いた後に手動で動画の再生を始める必要があります。
// デフォルト: true
const START_PLAYBACK_WHEN_OPEN_PAGE: boolean = true;
//
// 自動で次の教材を再生するかどうか [true/false]
// テスト回答後は、手動で再生を開始する必要があります。
// デフォルト: true
const USE_AUTO_NEXT: boolean = true;
//
// タブを変えたら勝手に一時停止するゴミみたいな対策に対する対策を使用するかどうか [true/false]
// 有効にしといて損はないです。
// デフォルト: true
const USE_AUTO_PAUSE_UNBLOCK: boolean = true;
//
// 動画を飛ばしたときに戻る奴を抑制します。[true/false]
// 動画を飛ばせるようになりますが、ちょっとずつ飛ばさないと視聴完了の判定をもらえません。
// デフォルト: true
const USE_SEEK_UNBLOCK: boolean = true;
//
// 動画の再生開始、終了を通知するかどうかを決定します。[true/false]
// 自動再生有効時はfalseを推奨します。
// デフォルト: false
const NOTIFY_VIDEO_STATE_CHANGE: boolean = false;
//
// Discord に送信するメッセージのフォーマット。
// %title% は動画の名前やテストの名前に置き換えられます。
const DISCORD_PLAYBACK_STARTED_MESSAGE: string = DISCORD_MENTION + " 教材動画 `%title%` の再生を開始しました";
const DISCORD_PLAYBACK_ENDED_MESSAGE: string = DISCORD_MENTION + " 教材動画 `%title%` の再生が終了しました";
const DISCORD_TEST_MESSAGE: string = DISCORD_MENTION + " テスト `%title%` を受けてください";
//
// デスクトップ通知で使用する通知のタイトル。
const DESKTOP_PLAYBACK_STARTED: string = "教材動画の再生を開始しました";
const DESKTOP_PLAYBACK_ENDED: string = "教材動画の再生が終了しました";
const DESKTOP_TEST: string = "テストを受けてください";
//
// 動画やテストのタイトルを見つけられなかったとき用。
const UNKNOWN_VIDEO: string = "不明な動画";
const UNKNOWN_TEST: string = "不明なテスト";
//
/* Logger */
const Level = {
	INFO: "INFO",
	WARN: "WARN",
	ERROR: "ERROR",
	DEBUG: "DEBUG",
} as const;

type Level = typeof Level[keyof typeof Level];

const ASCIIColor = {
	BLACK: "\u001b[30m",
	GRAY: "\u001b[90m",
	DARK_RED: "\u001b[31m",
	RED: "\u001b[91m",
	DARK_GREEN: "\u001b[32m",
	GREEN: "\u001b[92m",
	DARK_YELLOW: "\u001b[33m",
	YELLOW: "\u001b[93m",
	DARK_BLUE: "\u001b[34m",
	BLUE: "\u001b[94m",
	DARK_PURPLE: "\u001b[35m",
	PURPLE: "\u001b[95m",
	DARK_AQUA: "\u001b[36m",
	AQUA: "\u001b[96m",
	DARK_WHITE: "\u001b[37m",
	WHITE: "\u001b[97m",
	RESET: "\u001b[0m",
};

type ASCIIColor = typeof ASCIIColor[keyof typeof ASCIIColor];

type ChapterData = {
	title: string;
	isSupplement: boolean;
	isMovie: boolean;
	isOpened: boolean;
	isGood: boolean;
	isEvalutionTest: boolean;
	isEssayTest: boolean;
	isGateClosed: boolean;
    movieTimeSeconds: number;
	element: HTMLLIElement;
	clickTarget: HTMLAnchorElement;
};

function log(name: string, level: Level, content: string): void {
	let color: ASCIIColor = level == Level.INFO ? ASCIIColor.WHITE : level == Level.WARN ? ASCIIColor.DARK_YELLOW : level == Level.ERROR ? ASCIIColor.DARK_RED : ASCIIColor.GRAY;
	console.log(color + "[" + new Intl.DateTimeFormat("ja-JP", { timeStyle: "medium" }).format(new Date()) + "] [" + name + "] [" + level + "] " + content + ASCIIColor.RESET);
}
/* Logger End */

function registerEventsToVideo(iFrame: HTMLIFrameElement) {
	log("iFrame", Level.INFO, "Checking iFrame contentWindow...");

	if (iFrame.contentWindow != null) {
		log("iFrame", Level.INFO, "Successfully get iFrame document.");

		log("iFrame", Level.INFO, "Finding VideoPlayer (#video-player)");
		const targetVideo: HTMLMediaElement = iFrame.contentWindow.document.getElementById("video-player") as HTMLMediaElement;
		if (targetVideo != null) {
			log("VideoPlayer", Level.INFO, "Successfuly found video! " + targetVideo);

			log("VideoPlayer", Level.INFO, 'Regsitering "ended" event to target video!');
			targetVideo.addEventListener("ended", (event) => {
				log("VideoPlayer", Level.INFO, "Playback ended, sending notification...");
				sendNotify();
				log("VideoPlayer", Level.INFO, "Successfully sent notification!");
			});
			log("VideoPlayer", Level.INFO, 'Successfully registered "ended" event to target video!');

			if (USE_AUTO_PAUSE_UNBLOCK) {
				log("VideoPlayer", Level.INFO, 'Registering "pause" event to target video!');
				targetVideo.addEventListener("pause", (event) => {
					if (targetVideo.currentTime != targetVideo.duration) {
						log("VideoPlayer", Level.INFO, "\n" + "Damn, that trashy high school just paused the video!\n" + "I'll never forgive you! I'm gonna resume playback!\n" + "LMAO.");
						event.preventDefault();
						event.stopImmediatePropagation();
						targetVideo.play();
					}
				});
				log("VideoPlayer", Level.INFO, 'Successfully registered "pause" event to target video!');
			}

			if (USE_SEEK_UNBLOCK) {
				log("VideoPlayer", Level.INFO, 'Registering "seeking" event to target video!');
				targetVideo.addEventListener("seeking", (event) => {
					event.preventDefault();
					event.stopImmediatePropagation();
				});
				log("VideoPlayer", Level.INFO, 'Successfuly registered "seeking" event to target video!');

				log("VideoPlayer", Level.INFO, 'Registering "seeked" event to target video!');
				targetVideo.addEventListener("seeked", (event) => {
					event.preventDefault();
					event.stopImmediatePropagation();
				});
				log("VideoPlayer", Level.INFO, 'Successfully registered "seeked" event to target video!');
			}
		} else {
			log("VideoPlayer", Level.ERROR, "Failed to find video!");
		}
	} else {
		log("iFrame", Level.ERROR, "Failed to get iFrame document!");
	}
}

function sendNotify(): void {
	log("Notify", Level.INFO, "Notify process started...");

	log("Notify", Level.INFO, "Finding iFrame...");
	const iFrame: HTMLIFrameElement = document.getElementById("modal-inner-iframe") as HTMLIFrameElement;

	if (NOTIFY_VIDEO_STATE_CHANGE) {
		if (iFrame != null && iFrame.contentWindow != null) {
			log("Notify", Level.INFO, "Successfully found iFrame!");

			const titleElement: HTMLElement = iFrame.contentWindow.document.querySelector("div#root>div>div>header>h1>span") as HTMLElement;
			let title: string;
			if (titleElement != null) {
				title = titleElement.innerText;
				log("Notify", Level.INFO, "Successfully found video title!");
			} else {
                title = UNKNOWN_VIDEO;
				log("Notify", Level.WARN, "Failed to find video title!");
			}

            log("Notify", Level.INFO, "Notifying video playback ended");
            notifyDiscord(DISCORD_PLAYBACK_ENDED_MESSAGE.replace("%title%", title));
            notifyDesktop(DESKTOP_PLAYBACK_ENDED, title);
            log("Notify", Level.INFO, "Successfuly sent video playback ended notify.");
		} else {
			log("Notify", Level.ERROR, "Cannot find iFrame");
			// returnはしない findNextVideo/findNextTestはiFrame外(window)の話なので
		}
	}

	if (USE_AUTO_NEXT) {
		// 1500ミリ秒程度の遅延を設けて次の動画またはテストを検索する
		// nnn.ed.nico: 視聴完了後、sectionsへの反映に大体1000ミリ秒かかる
		setTimeout(() => {
			const nextVideo: ChapterData | null = findNextVideo(false);
			log("Automation", Level.INFO, "Finding next video or test...");
			if (nextVideo != null) {
				log("Automation", Level.INFO, "Next video found! clicking.");
				click(nextVideo.clickTarget);
				if (NOTIFY_VIDEO_STATE_CHANGE) {
                    log("Notify", Level.INFO, "Notifying next video auto started playback.")
					notifyDiscord(DISCORD_PLAYBACK_STARTED_MESSAGE.replace("%title%", nextVideo.title));
                    notifyDesktop(DESKTOP_PLAYBACK_STARTED, nextVideo.title);
                    log("Notify", Level.INFO, "Successfully sent auto playback started notify.");
				}
			} else {
				log("Autoamtion", Level.INFO, "Next video not found! Finding test...");
				const nextTest: ChapterData | null = findNextTest();
				if (nextTest != null) {
					log("Automation", Level.INFO, "Next test found!, sending notify.");
                    notifyDiscord(DISCORD_TEST_MESSAGE.replace("%title%", (nextTest != null ? nextTest.title : UNKNOWN_TEST)));
                    notifyDesktop(DESKTOP_TEST, (nextTest != null ? nextTest.title : UNKNOWN_TEST));
                    log("Automation", Level.INFO, "Successfully sent next test notify.");
				}
			}
		}, VIDEO_ENDED_SEARCH_NEXT_DELAY);
	}
}

function notifyDiscord(content: string): void {
    if (DISCORD_WEBHOOK_URL.length > 0) {
        log("Discord", Level.INFO, "Sending notification to discord.")
        const discord: XMLHttpRequest = new XMLHttpRequest();
		discord.open("POST", DISCORD_WEBHOOK_URL);
		discord.setRequestHeader("Content-Type", "application/json");
        discord.addEventListener('readystatechange', (event) => {
            if (discord.readyState == 4) {
                if (discord.status == 204) {
                    log("Discord", Level.INFO, "Successfully sent notification to discord.");
                } else if (discord.status == 400) {
                    log("Discord", Level.WARN, "Failed to sent notification to discord.");
                    log("Discord", Level.WARN, discord.responseText);
                }
            }
        });
		discord.send(JSON.stringify({"username": "N予備校", "avatar_url": "https://www.nnn.ed.nico/favicon.ico", "content": content}));
    }
}

function notifyDesktop(title: string, body: string): void {
    const desktopNotification: Notification = new Notification(title, {
        body: body,
        icon: "https://www.nnn.ed.nico/favicon.ico",
    });

    setTimeout(desktopNotification.close.bind(desktopNotification), 5000);
}

function getSections(): Array<ChapterData> {
	const rawList: NodeListOf<HTMLLIElement> = document.querySelectorAll("div.l-contents#sections-contents>div.section>div.u-card>ul.u-list>li") as NodeListOf<HTMLLIElement>;
	const list: Array<ChapterData> = [];
	rawList.forEach((v, n) => {
		const className: string = v.className;
		const anchors: HTMLCollectionOf<HTMLAnchorElement> = v.getElementsByTagName("a");

        let movieTimeSeconds: number = -1;
        if (className.includes("movie")) {
            const length: string[] = (v.querySelector("a>div.section-optional-info>p.content-amount.movie-length") as HTMLParagraphElement).innerText.split(":");
            if (length.length == 2) movieTimeSeconds = (Number(length[0]) * 60) + Number(length[1]);
            else if (length.length == 3) movieTimeSeconds = ((Number(length[0]) * 60) * 60) + (Number(length[1]) * 60) + Number(length[2]);
        }

		let data: ChapterData = {
			title: (v.querySelector("a>div.section-main-info>div>p>span.title") as HTMLSpanElement).innerText,
			isGood: className.includes("good"), // 視聴/完了済
			isMovie: className.includes("movie"), // 動画
			isSupplement: className.includes("supplement"), // Nプラス教材
			isEvalutionTest: className.includes("evaluation-test"), // 選択/記述テスト
			isEssayTest: className.includes("essay-test"), // 論述テスト
			isOpened: anchors.length > 0 ? anchors[0].className.includes("is-selected") : false, // 今開いてる
			isGateClosed: anchors.length > 0 ? anchors[0].className.includes("is-gate-closed") : false, // まだ開けない
            movieTimeSeconds: movieTimeSeconds,
			element: v,
			clickTarget: anchors.length > 0 ? anchors[0] : null,
		} as ChapterData;
		list[n] = data;
	});
	return list;
}

function getOpenedSection(): ChapterData | null {
    const result = getSections().filter((data) => {
        return data.isOpened;
    });

    if (result.length > 0) {
        return result[0];
    } else {
        return null;
    }
}

function findNextVideo(findSupplement: boolean): ChapterData | null {
	const result = getSections().filter((data) => {
		return data.isMovie && !data.isOpened && !data.isGood && !data.isGateClosed && ((findSupplement && data.isSupplement) || !data.isSupplement);
	});

	if (result.length > 0) {
		return result[0];
	} else {
		return null;
	}
}

function findNextTest(): ChapterData | null {
	const result = getSections().filter((data) => {
		return (data.isEssayTest || data.isEvalutionTest) && !data.isGateClosed && !data.isGood && !data.isOpened;
	});

	if (result.length > 0) {
		return result[0];
	} else {
		return null;
	}
}

function click(target: HTMLElement): void {
	const event: MouseEvent = document.createEvent("MouseEvent");
	event.initEvent("click", true, true);
	target.dispatchEvent(event);
}

if (window.Notification.permission == "denied" || window.Notification.permission == "default") {
	window.Notification.requestPermission().then(() => {
		if (window.Notification.permission == "granted") {
			log("Permission", Level.INFO, "Desktop Notification Permission is now accepted.");
		} else {
			log("Permission", Level.WARN, "Desktop Notification Permission is not accepted, desktop notifications will be not sent to you.");
		}
	});
}

if (document.getElementById("modal-inner-iframe") instanceof HTMLIFrameElement) {
	log("main", Level.ERROR, "iFrame already appended, please reload page and execute this script before start playback.");
} else {
	new MutationObserver(() => {
		log("MutationObserver", Level.INFO, "DOM change detected, registering 'load' event to iFrame (#modal-inner-iframe)!");

		const iFrame: HTMLIFrameElement = document.getElementById("modal-inner-iframe") as HTMLIFrameElement;
		if (iFrame != null && iFrame != undefined) {
			iFrame.addEventListener("load", (event) => {
				log("iFrame", Level.INFO, "iFrame loaded.");

				log("iFrame", Level.INFO, "Checking iFrame contentWindow...");
				if (iFrame.contentWindow != null) {
					log("iFrame", Level.INFO, "iFrame contentWindow found!");

                    const opened: ChapterData | null = getOpenedSection();
                    if (opened == null) return;

					if (!opened.isEssayTest && !opened.isEvalutionTest && opened.isMovie) {
                        log("iFrame", Level.INFO, "Finding VideoPlayer...");
                        if (iFrame.contentWindow.document.getElementById("video-player") instanceof HTMLMediaElement) {
                            log("iFrame", Level.INFO, "VideoPlayer already loaded, use this.");
                            registerEventsToVideo(iFrame);
                        } else {
                            log("iFrame", Level.INFO, "VideoPlayer not loaded, use setInterval to try find...");
                            const repeater: NodeJS.Timer = setInterval(() => {
                                if (iFrame.contentWindow != null) {
                                    const videoPlayer = iFrame.contentWindow.document.getElementById("video-player");
                                    if (videoPlayer != null && videoPlayer != undefined) {
                                        log("iFrame/Timer", Level.INFO, "VideoPlayer loaded!");
                                        clearInterval(repeater);
                                        registerEventsToVideo(iFrame);
                                    }
                                }
                            }, 10);
                        }
                    } else {
                        log("iFrame", Level.INFO, "Opened iFrame is Essay or Evalution test, skipping.");
                    }
				}
			});
			log("MutationObserver", Level.INFO, "Successfully registered 'load' event to iFrame (#modal-inner-iframe)");
		} else {
			log("MutationObserver", Level.ERROR, "Failed to find iFrame (#modal-inner-iframe)! Event is not registered.");
		}
	}).observe(document.querySelector('div[data-react-class="App.Modal"') as HTMLElement, {
		childList: true, // 子要素の変更を追跡する
	});

	if (START_PLAYBACK_WHEN_OPEN_PAGE) {
		const nextVideo: ChapterData | null = findNextVideo(false);
		if (nextVideo != null) {
			log("main", Level.INFO, "Auto playback starting.");
			click(nextVideo.clickTarget);
		}
	}
}

function convertStrTimeToSecond(str: string) {
    let splitted = str.split(":");
  
    var seconds = 0;
  
    if (splitted.length == 2) {
      seconds = (Number(splitted[0]) * 60)+Number(splitted[1]);
    } else if (splitted.length == 3) {
      seconds = ((Number(splitted[0]) * 60) * 60)+(Number(splitted[1]) * 60)+Number(splitted[2]);
    }
    return seconds;
}

const sections = getSections();
  
let requiredTimes = document.querySelectorAll("li.movie:not(.supplement) .movie-length");
let requiredTime = 0;
let requiredGoodTime = 0;
sections.forEach(data => {
    if (data.isMovie && !data.isSupplement) {
        if (data.isGood) requiredGoodTime += data.movieTimeSeconds;
        else requiredTime += data.movieTimeSeconds;
    }
});
  
let nPlusTimes = document.querySelectorAll("li.movie.supplement .movie-length");
let nPlusTime = 0;
let nPlusGoodTime = 0;
sections.forEach(data => {
    if (data.isMovie && data.isSupplement) {
        if (data.isGood) nPlusGoodTime += data.movieTimeSeconds;
        else nPlusTime += data.movieTimeSeconds;
    }
});
  
let allTime = requiredTime + nPlusTime;
  
const allHours = Math.floor(allTime/3600);
const requiredHours = Math.floor(requiredTime/3600);
const nPlusHours = Math.floor(nPlusTime/3600);

const allMinutes = Math.floor((allTime % 3600) / 60);
const requiredMinutes = Math.floor((requiredTime % 3600) / 60);
const nPlusMinutes = Math.floor((nPlusTime % 3600) / 60);

const allSeconds = allTime % 60;
const requiredSeconds = requiredTime % 60;
const nPlusSeconds = nPlusTime % 60;
  
let all = "すべての教材: " + (allHours > 0 ? allHours + "時間" : "") + allMinutes + "分" + allSeconds + "秒";
let required = "必修教材: " + (requiredHours > 0 ? requiredHours + "時間" : "") + requiredMinutes + "分" + requiredSeconds + "秒";
let nPlus = "Nプラス教材: " + (nPlusHours > 0 ? nPlusHours + "時間" : "") + nPlusMinutes + "分" + nPlusSeconds + "秒";

const requiredGoodHours = Math.floor(requiredGoodTime / 3600);
const requiredGoodMinutes = Math.floor((requiredGoodTime % 3600) / 60);
const requiredGoodSeconds = requiredGoodTime % 60;
const requiredGoodPercent = Math.round((requiredGoodTime / requiredTime) * 100);

const requiredRemainHours = Math.floor((requiredTime - requiredGoodTime) / 3600);
const requiredRemainMinutes = Math.floor(((requiredTime - requiredGoodTime) % 3600) / 60);
const requiredRemainSeconds = (requiredTime - requiredGoodTime) % 60;

let requiredGoodStr = "視聴済み必修教材: " + (requiredGoodHours > 0 ? requiredGoodHours + "時間" : "") + (requiredGoodMinutes > 0 ? requiredGoodMinutes + "分" : "") + (requiredGoodSeconds > 0 ? requiredGoodSeconds + "秒" : "") + " (" + requiredGoodPercent + "%)";
let requiredRemainingStr = "未視聴必修教材: " + (requiredRemainHours > 0 ? requiredRemainHours + "時間" : "") + (requiredRemainMinutes > 0 ? requiredRemainMinutes + "分" : "") + (requiredRemainSeconds > 0 ? requiredRemainSeconds + "秒" : "");

const nPlusGoodHours = Math.floor(nPlusGoodTime / 3600);
const nPlusGoodMinutes = Math.floor((nPlusGoodTime % 3600) / 60);
const nPlusGoodSeconds = nPlusGoodTime % 60;
const nPlusGoodPercent = Math.round((nPlusGoodTime / nPlusTime) * 100);

const nPlusRemainHours = Math.floor((nPlusTime - nPlusGoodTime) / 3600);
const nPlusRemainMinutes = Math.floor(((nPlusTime - nPlusGoodTime) % 3600) / 60);
const nPlusRemainSeconds = (nPlusTime - nPlusGoodTime) % 60;

let nPlusGoodStr = "視聴済みNプラス教材: " + (nPlusGoodHours > 0 ? nPlusGoodHours + "時間" : "") + (nPlusGoodMinutes > 0 ? nPlusGoodMinutes + "分" : "") + (nPlusGoodSeconds > 0 ? nPlusGoodSeconds + "秒" : "") + " (" + nPlusGoodPercent + "%)";
let nPlusRemainingStr = "未試聴Nプラス教材: " + (nPlusRemainHours > 0 ? nPlusRemainHours + "時間" : "") + (nPlusRemainMinutes > 0 ? nPlusRemainMinutes + "分" : "") + (nPlusRemainSeconds > 0 ? nPlusRemainSeconds + "秒" : "");

let injectView = document.getElementsByClassName('description');

if(injectView === undefined) {
  location.reload();
}

let movieCount = document.querySelectorAll("li.movie:not(.supplement)").length;
let allMovieCount = document.getElementsByClassName('movie').length;
let testCount = document.getElementsByClassName('evaluation-test').length;

injectView[0].innerHTML = "<div class='u-card'>" +
                            "<div class='u-list-header typo-list-title'>" +
                              "この単元の進捗状況" +
                            "</div>" +
                            "<div class='u-card-inner'>" +
                              required + "<br>" +
                              requiredGoodStr + "<br>" +
                              requiredRemainingStr + "<br>" +
                              nPlusGoodStr + "<br>" +
                              nPlusRemainingStr + "<br>" +
                              "必修教材動画数: " + movieCount + "本<br>" +
                              "確認テストの数: " + testCount + "個" +
                            "</div>" +
                          "</div>" + injectView[0].innerHTML;