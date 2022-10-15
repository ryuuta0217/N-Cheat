import { Config, ChapterData } from "./objects";
import { log, Level } from "./logger";

async function registerEventsToVideo(iFrame: HTMLIFrameElement): Promise<void> {
	log("iFrame", Level.INFO, "Checking iFrame contentWindow...");

	if (iFrame.contentWindow != null) {
		log("iFrame", Level.INFO, "Successfully get iFrame document.");

		log("iFrame", Level.INFO, "Finding VideoPlayer (#video-player)");
		const targetVideo: HTMLMediaElement = iFrame.contentWindow.document.getElementById("video-player") as HTMLMediaElement;
		if (targetVideo != null) {
			log("VideoPlayer", Level.INFO, "Successfully found video! " + targetVideo);

			log("VideoPlayer", Level.INFO, 'Registering "ended" event to target video!');
			targetVideo.addEventListener("ended", onVideoPlaybackEnded);
			log("VideoPlayer", Level.INFO, 'Successfully registered "ended" event to target video!');

			log("VideoPlayer", Level.INFO, 'Registering "pause" event to target video!');
			targetVideo.addEventListener("pause", async (event) => {
				if ((await getConfig()).useAutoPauseUnblock && (targetVideo.currentTime != targetVideo.duration)) { // 動画の再生終了時にも発火するので、対策
					log("VideoPlayer", Level.INFO, "\n" + "Damn, that trashy high school just paused the video!\n" + "I'll never forgive you! I'm gonna resume playback!\n" + "LMAO.");
					event.preventDefault();
					event.stopImmediatePropagation();
					await targetVideo.play();
				}
			});
			log("VideoPlayer", Level.INFO, 'Successfully registered "pause" event to target video!');

			if ((await getConfig()).useSeekUnblock) {
				log("VideoPlayer", Level.INFO, 'Registering "seeking" event to target video!');
				targetVideo.addEventListener("seeking", (event) => {
					event.preventDefault();
					event.stopImmediatePropagation();
				});
				log("VideoPlayer", Level.INFO, 'Successfully registered "seeking" event to target video!');

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

async function sendNotifyPlaybackStarted(data: ChapterData | null) {
	if (data != null && data.isMovie) {
		const config: Config = await getConfig();

		if (config.notifyVideoStateChange) {
			log("Notify", Level.INFO, "Notifying video playback started.")
			notifyDiscord(config, config.discordPlaybackStartedMessage.replace("%title%", data.title));
			notifyDesktop(config, config.desktopPlaybackStarted, data.title);
			log("Notify", Level.INFO, "Successfully sent video playback started notify.");
		}
	}
}

async function sendNotifyPlaybackEnded(data: ChapterData | null) {
    if (data != null && data.isMovie) {
		const config: Config = await getConfig();

		if (config.notifyVideoStateChange) {
			log("Notify", Level.INFO, "Notifying video playback ended");
			notifyDiscord(config, config.discordPlaybackEndedMessage.replace("%title%", data.title))
			notifyDesktop(config, config.desktopPlaybackEnded, data.title);
			log("Notify", Level.INFO, "Successfully sent video playback ended notify.");
		}
	}
}

async function sendNotifyTakeTest(data: ChapterData | null) {
	if (data != null && (data.isEssayTest || data.isEvaluationTest)) {
		const config: Config = await getConfig();

		notifyDiscord(config, config.discordTakeTestMessage.replace("%title%", data.title));
		notifyDesktop(config, config.desktopTakeTest, data.title);
	}
}

function notifyDiscord(config: Config, content: string) {
    if (config.useDiscordNotification && config.discordWebhookUrl.length > 0 && config.discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        log("Notify/Discord", Level.INFO, "Sending notification to discord.")
        const discord: XMLHttpRequest = new XMLHttpRequest();
		discord.open("POST", config.discordWebhookUrl);
		discord.setRequestHeader("Content-Type", "application/json");
        discord.addEventListener('readystatechange', (event: Event) => {
            if (discord.readyState == 4) {
                if (discord.status == 204) {
                    log("Notify/Discord", Level.INFO, "Successfully sent notification to discord.");
                } else if (discord.status == 400) {
                    log("Notify/Discord", Level.WARN, "Failed to sent notification to discord.");
                    log("Notify/Discord", Level.WARN, discord.responseText);
                }
            }
        });
		// replace variables
		content = content.replace("%mention%", config.discordMention);
		discord.send(JSON.stringify({"username": "N予備校", "avatar_url": "https://www.ryuuta0217.com/nnn.ed.nico.png", "content": content}));
    }
}

function notifyDesktop(config: Config, title: string, body: string) {
    if (config.useDesktopNotification) {
        const desktopNotification: Notification = new Notification(title, {
            body: body,
            icon: "https://www.nnn.ed.nico/favicon.ico",
        });

        setTimeout(desktopNotification.close.bind(desktopNotification), 5000);
    }
}

function getSections(): Array<ChapterData> {
	const rawList: NodeListOf<HTMLLIElement> = document.querySelectorAll("div.l-contents#sections-contents>div.section>div.u-card>ul.u-list>li") as NodeListOf<HTMLLIElement>;
	const list: Array<ChapterData> = [];
	rawList.forEach((v: HTMLLIElement, n: number) => {
		const className: string = v.className;
		const anchors: HTMLCollectionOf<HTMLAnchorElement> = v.getElementsByTagName("a");

        let movieTimeSeconds: number = -1;
        if (className.includes("movie")) {
            const length: string[] = (v.querySelector("a>div.section-optional-info>p.content-amount.movie-length") as HTMLParagraphElement).innerText.split(":");
            if (length.length == 2) movieTimeSeconds = (Number(length[0]) * 60) + Number(length[1]);
            else if (length.length == 3) movieTimeSeconds = ((Number(length[0]) * 60) * 60) + (Number(length[1]) * 60) + Number(length[2]);
        }

		list[n] = {
			title: (v.querySelector("a>div.section-main-info>div>p>span.title") as HTMLSpanElement).innerText,
			isGood: className.includes("good"), // 視聴/完了済
			isMovie: className.includes("movie"), // 動画
			isSupplement: className.includes("supplement"), // Nプラス教材
			isEvaluationTest: className.includes("evaluation-test"), // 選択/記述テスト
			isEssayTest: className.includes("essay-test"), // 論述テスト
			isOpened: anchors.length > 0 ? anchors[0].className.includes("is-selected") : false, // 今開いてる
			isGateClosed: anchors.length > 0 ? anchors[0].className.includes("is-gate-closed") : false, // まだ開けない
			movieTimeSeconds: movieTimeSeconds,
			element: v,
			clickTarget: anchors.length > 0 ? anchors[0] : null,
		} as ChapterData;
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

function getNextRequiredChapter(supplement: boolean, notGoodOnly: boolean): ChapterData | null {
	log("Chapter", Level.INFO, "Finding next required chapter...");
	const chapters: Array<ChapterData> = getSections().filter((data => (data.isMovie || data.isEvaluationTest || data.isEssayTest) && (supplement ? data.isSupplement : !data.isSupplement)));
	log("Chapter", Level.INFO, "Got " + chapters.length + " chapters.");

	const currentPos: number = chapters.findIndex((value, number, list) => {
		return value.isOpened;
	});
	log("Chapter", Level.INFO, "Currently opened chapter index is " + currentPos);

	let nextPos = currentPos + 1;
	log("Chapter", Level.INFO, "Next chapter index is " + nextPos);
	if (nextPos < chapters.length) {
		let nextChapter: ChapterData | null = chapters[nextPos];
		log("Chapter", Level.INFO, "Next chapter found: " + nextChapter.title);

		if (notGoodOnly && nextChapter.isGood) { // notGoodOnlyがtrue で、nextChapterがGoodの時。
			log("Chapter", Level.INFO, "Flag notGoodOnly is active. Next chapter is Good, search Chapter that is not Good.");
			while (nextChapter != null && nextChapter.isGood) { // nextChapterがnull以外で、nextChapterがnotGoodの時ループ。
				nextPos += 1;
				if (nextPos < chapters.length) {
					nextChapter = chapters[nextPos];
				} else {
					nextChapter = null;
				}
			}
			log("Chapter", Level.INFO, "Search ended, chapter: " + (nextChapter != null ? nextChapter.title : "null"));
		}

		if (nextChapter != null) {
			log("Chapter", Level.INFO, "Found chapter: " + nextChapter.title);
			return nextChapter;
		}
	}

	return null;
}

function getNextVideo(supplement: boolean): ChapterData | null {
	const result = getSections().filter(data => (data.isMovie || data.isEvaluationTest || data.isEssayTest) && (supplement ? data.isSupplement : !data.isSupplement))/*.filter((data) => {
		return data.isMovie && !data.isOpened && !data.isGood && !data.isGateClosed && ((supplement && data.isSupplement) || !data.isSupplement);
	})*/;

	const currentPos: number = result.findIndex((value, number, list) => {
		return value.isOpened;
	});

	const nextPos = currentPos + 1;

	if (nextPos <= (result.length - 1)) {
		const nextData: ChapterData = result[nextPos];
		if (nextData.isMovie) return nextData;
	}
	return null;

	/*if (result.length > 0) {
		return result[0];
	} else {
		return null;
	}*/
}

function getNextTest(): ChapterData | null {
	const result = getSections().filter((data) => {
		return (data.isEssayTest || data.isEvaluationTest) && !data.isGateClosed && !data.isGood && !data.isOpened;
	});

	if (result.length > 0) {
		return result[0];
	} else {
		return null;
	}
}

function getNextRequiredVideoOrTest(): ChapterData | null {
	const video: ChapterData | null = getNextVideo(false);
	const test: ChapterData | null = getNextTest();

	if (video != null) return video;
	else if (test != null) return test;
	return null;
}

// テストを受ける必要があるかどうか
function isTakeTestNext(): Boolean {
	return getNextTest() != null;
}

async function playNextVideo(): Promise<Boolean> {
	const nextVideo: ChapterData | null = getNextVideo(false);

	if (nextVideo != null) {
		log("Automation", Level.INFO, "Clicking next chapter...")
		click(nextVideo.clickTarget);
		log("Automation", Level.INFO, "Sending playback started notification");
		await sendNotifyPlaybackStarted(nextVideo); // TODO MutationObserverを使って要素を監視し、videoのplayEventに合わせてcallbackを実行するようなモノをつくる
		return true;
	}
	return false;
}

async function openNextTest(): Promise<Boolean> {
	const nextTest: ChapterData | null = getNextTest();

	if (nextTest != null) {
		click(nextTest.clickTarget);
		await sendNotifyTakeTest(nextTest);
		return true;
	}
	return false;
}

function click(target: HTMLElement): void {
	const event: MouseEvent = document.createEvent("MouseEvent");
	event.initEvent("click", true, true);
	target.dispatchEvent(event);
}

/* GLOBAL EVENT LISTENERS */
async function onVideoPlaybackEnded(event: Event) {
	log("VideoPlayer", Level.INFO, "Playback ended, sending notification...");
	await sendNotifyPlaybackEnded(getOpenedSection());
	log("VideoPlayer", Level.INFO, "Successfully sent notification!");
	const config: Config = await getConfig();

	if (config.useAutoNext) {
		log("Automation", Level.INFO, "useAutoNext is active, finding next chapter...")
		const nextChapter: ChapterData | null = getNextRequiredChapter(config.useAutoNextContainsSupplements, config.useAutoNextNotGoodOnly);
		if (nextChapter != null) {
			log("Automation", Level.INFO, "Chapter found: " + nextChapter.title);
			if (!nextChapter.isGateClosed) {
				log("Automation", Level.INFO, "Gate is already opened, clicking.");
				if (nextChapter.isMovie) await playNextVideo();
				else if (nextChapter.isEssayTest || nextChapter.isEvaluationTest) await openNextTest();
			} else {
				log("Automation", Level.INFO, "Gate is closed, use MutationObserver to observe changes...");
				let observer: MutationObserver;
				const callback = async () => {
					log("Automation/Observer", Level.INFO, "Attributes changed, clicking.");
					if (nextChapter.isMovie) await playNextVideo();
					else if (nextChapter.isEssayTest || nextChapter.isEvaluationTest) await openNextTest();
					observer.disconnect();
				};
				observer = new MutationObserver(callback);

				observer.observe(nextChapter.element.querySelector("a") as HTMLElement, {
					attributes: true
				});
			}
		}
	}
}
/* END OF GLOBAL EVENT LISTENERS */

// force request desktop notification permission
if (window.Notification.permission == "denied" || window.Notification.permission == "default") {
	window.Notification.requestPermission().then(() => {
		if (window.Notification.permission == "granted") {
			log("Permission", Level.INFO, "Desktop Notification Permission is now accepted.");
		} else {
			log("Permission", Level.WARN, "Desktop Notification Permission is not accepted, desktop notifications will be not sent to you.");
		}
	});
}

if (!(document.getElementById("modal-inner-iframe") instanceof HTMLIFrameElement)) {
	new MutationObserver(() => {
		log("MutationObserver", Level.INFO, "DOM change detected, registering 'load' event to iFrame (#modal-inner-iframe)!");

		const iFrame: HTMLIFrameElement = document.getElementById("modal-inner-iframe") as HTMLIFrameElement;
		if (iFrame != null) {
			iFrame.addEventListener("load", (event) => {
				log("iFrame", Level.INFO, "iFrame loaded.");

				log("iFrame", Level.INFO, "Checking iFrame contentWindow...");
				if (iFrame.contentWindow != null) {
					log("iFrame", Level.INFO, "iFrame contentWindow found!");

					const opened: ChapterData | null = getOpenedSection();
					if (opened == null) return;

					if (!opened.isEssayTest && !opened.isEvaluationTest && opened.isMovie) {
						log("iFrame", Level.INFO, "Finding VideoPlayer...");
						if (iFrame.contentWindow.document.getElementById("video-player") instanceof HTMLMediaElement) {
							log("iFrame", Level.INFO, "VideoPlayer already loaded, use this.");
							registerEventsToVideo(iFrame).then(() => log("iFrame", Level.INFO, "Successfully registered video events."));
						} else {
							log("iFrame", Level.INFO, "VideoPlayer not loaded, use setInterval to try find...");
							const repeater: NodeJS.Timer = setInterval(() => {
								if (iFrame.contentWindow != null) {
									const videoPlayer = iFrame.contentWindow.document.getElementById("video-player");
									if (videoPlayer != null) {
										log("iFrame/Timer", Level.INFO, "VideoPlayer loaded!");
										clearInterval(repeater);
										registerEventsToVideo(iFrame).then(() => log("iFrame", Level.INFO, "Successfully registered video events."));
									}
								}
							}, 10);
						}
					} else {
						log("iFrame", Level.INFO, "Opened iFrame is Essay or Evaluation test, skipping.");
					}
				}
			});
			log("MutationObserver", Level.INFO, "Successfully registered 'load' event to iFrame (#modal-inner-iframe)");
		} else {
			log("MutationObserver", Level.ERROR, "Failed to find iFrame (#modal-inner-iframe)! Event is not registered.");
		}
	}).observe(document.querySelector('div[data-react-class="App.Modal"]') as HTMLElement, {
		childList: true, // 子要素の変更を追跡する
	});

	getConfig().then((config) => {
		if (config.startPlaybackWhenOpenPage) {
			const nextVideo: ChapterData | null = getNextVideo(false);
			if (nextVideo != null) {
				playNextVideo().then((playbackStarted) => {
					if (playbackStarted) {
						log("main", Level.INFO, "Auto playback starting.");
					} else {

					}
				});
			} else {
				log("main", Level.WARN, "Failed to auto playback.")
			}
		}
	});
}

async function getConfig(): Promise<Config> {
    return await chrome.storage.sync.get() as Config;
}

const sections = getSections();

let requiredTime = 0;
let requiredGoodTime = 0;
let requiredRemainTime = 0;
sections.forEach(data => {
    if (data.isMovie && !data.isSupplement) {
        requiredTime += data.movieTimeSeconds;
        if (data.isGood) requiredGoodTime += data.movieTimeSeconds;
        else requiredRemainTime += data.movieTimeSeconds;
    }
});

let nPlusTime = 0;
let nPlusRemainTime = 0;
let nPlusGoodTime = 0;
sections.forEach(data => {
    if (data.isMovie && data.isSupplement) {
        nPlusTime += data.movieTimeSeconds;
        if (data.isGood) nPlusGoodTime += data.movieTimeSeconds;
        else nPlusRemainTime += data.movieTimeSeconds;
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

const requiredRemainHours = Math.floor(requiredRemainTime / 3600);
const requiredRemainMinutes = Math.floor((requiredRemainTime % 3600) / 60);
const requiredRemainSeconds = requiredRemainTime % 60;

let requiredGoodStr = "視聴済み必修教材: " + (requiredGoodHours > 0 ? requiredGoodHours + "時間" : "") + (requiredGoodMinutes > 0 ? requiredGoodMinutes + "分" : "") + requiredGoodSeconds + "秒" + " (" + requiredGoodPercent + "%)";
let requiredRemainingStr = "未視聴必修教材: " + (requiredRemainHours > 0 ? requiredRemainHours + "時間" : "") + (requiredRemainMinutes > 0 ? requiredRemainMinutes + "分" : "") + requiredRemainSeconds + "秒";

const nPlusGoodHours = Math.floor(nPlusGoodTime / 3600);
const nPlusGoodMinutes = Math.floor((nPlusGoodTime % 3600) / 60);
const nPlusGoodSeconds = nPlusGoodTime % 60;
const nPlusGoodPercent = Math.round((nPlusGoodTime / nPlusTime) * 100);

const nPlusRemainHours = Math.floor(nPlusRemainTime / 3600);
const nPlusRemainMinutes = Math.floor((nPlusRemainTime % 3600) / 60);
const nPlusRemainSeconds = nPlusRemainTime % 60;

let nPlusGoodStr = "視聴済みNプラス教材: " + (nPlusGoodHours > 0 ? nPlusGoodHours + "時間" : "") + (nPlusGoodMinutes > 0 ? nPlusGoodMinutes + "分" : "") + nPlusGoodSeconds + "秒" + " (" + nPlusGoodPercent + "%)";
let nPlusRemainingStr = "未試聴Nプラス教材: " + (nPlusRemainHours > 0 ? nPlusRemainHours + "時間" : "") + (nPlusRemainMinutes > 0 ? nPlusRemainMinutes + "分" : "") + nPlusRemainSeconds + "秒";

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
                            "[合計]<br>" +
                              required + "<br>" +
                              nPlus + "<br>" +
                            "<br>" +
                            "[必修]<br>" +
                              requiredGoodStr + "<br>" +
                              requiredRemainingStr + "<br>" +
                            "<br>" +
                            "[Nプラス]<br>" +
                              nPlusGoodStr + "<br>" +
                              nPlusRemainingStr + "<br>" +
                            "<br>" +
                            "[本数]<br>" +
                              "必修教材動画数: " + movieCount + "本<br>" +
                              "確認テストの数: " + testCount + "個" +
                            "</div>" +
                          "</div>" + injectView[0].innerHTML;
