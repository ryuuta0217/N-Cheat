import {SectionData, SectionType, TenjinApiChapterResponse} from "./objects";
import {Level, log} from "./logger";
import {Config, getConfig} from "./config";
import {EventManager} from "./event_manager";
import {sendNotifyPlaybackEnded, sendNotifyPlaybackStarted, sendNotifyTakeTest} from "./notifications";
import {click, getTime, zeroPadding} from "./utils";
import {ChapterGateOpenEvent, ChapterGoodEvent, TenjinDataFetchedEvent} from "./events";

const eventManager: EventManager = new EventManager();

async function registerEventsToVideo(iFrame: HTMLIFrameElement): Promise<void> {
    log("iFrame", Level.INFO, "Checking iFrame contentWindow...");

    if (iFrame.contentWindow != null) {
        log("iFrame", Level.INFO, "Successfully get iFrame document.");

        log("iFrame", Level.INFO, "Finding VideoPlayer (#video-player)");
        const targetVideo: HTMLMediaElement = iFrame.contentWindow.document.getElementById("video-player") as HTMLMediaElement;
        if (targetVideo != null) {
            log("VideoPlayer", Level.INFO, "Successfully found video! " + targetVideo);

            if (!targetVideo.paused) {
                log("VideoPlayer", Level.INFO, "Video is already playing, sending notification...");
                sendNotifyPlaybackStarted(getOpenedSection()).then(() => log("VideoPlayer", Level.INFO, "Successfully sent notification!"));
            } else {
                log("VideoPlayer", Level.INFO, 'Registering "play" event to target video!');

                const playListener: EventListenerOrEventListenerObject = (event) => {
                    log("VideoPlayer", Level.INFO, "Playback started, sending notification...");
                    sendNotifyPlaybackStarted(getOpenedSection()).then(() => log("VideoPlayer", Level.INFO, "Successfully sent notification!"));
                    // @ts-ignore
                    targetVideo.removeEventListener("play", playListener);
                };

                targetVideo.addEventListener("play", playListener);
                log("VideoPlayer", Level.INFO, 'Successfully registered "play" event to target video!');
            }

            log("VideoPlayer", Level.INFO, 'Registering "ended" event to target video!');
            targetVideo.addEventListener("ended", async () => {
                log("VideoPlayer", Level.INFO, "Playback ended, sending notification...");
                await sendNotifyPlaybackEnded(getOpenedSection());
                log("VideoPlayer", Level.INFO, "Successfully sent notification!");
            });
            log("VideoPlayer", Level.INFO, 'Successfully registered "ended" event to target video!');

            /* TODO: wontfix: これらは現在機能していない。Reactで構築されたN予備校のサイト側のイベントリスナーによる修正が優先されているようで、動画をスキップすることを強制できない。
            log("VideoPlayer", Level.INFO, 'Registering "pause" event to target video!');
            targetVideo.addEventListener("pause", async (event) => {
                if ((await getConfig()).useAutoPauseUnblock && (targetVideo.currentTime != targetVideo.duration)) { // 動画の再生終了時にも発火するので、対策
                    log("VideoPlayer", Level.INFO, "\n" + "Damn, that trashy high school just paused the video!\n" + "I'll never forgive you! I'm gonna resume playback!\n" + "LMAO.");
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    await targetVideo.play();
                }
            });
            log("VideoPlayer", Level.INFO, 'Successfully registered "pause" event to target video!');

            if ((await getConfig()).useSeekUnblock) {
                log("VideoPlayer", Level.INFO, 'Registering "seeking" event to target video!');
                targetVideo.addEventListener("seeking", (event) => {
                    log("VideoPlayer", Level.INFO, "Video seeking detected, cancelling this.");
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                });
                log("VideoPlayer", Level.INFO, 'Successfully registered "seeking" event to target video!');

                log("VideoPlayer", Level.INFO, 'Registering "seeked" event to target video!');
                targetVideo.addEventListener("seeked", (event) => {
                    log("VideoPlayer", Level.INFO, "Video seeking detected, cancelling this.");
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                });
                log("VideoPlayer", Level.INFO, 'Successfully registered "seeked" event to target video!');

                log("VideoPlayer", Level.INFO, 'Registering "ratechange" event to target video!');
                targetVideo.addEventListener("ratechange", (event) => {
                    log("VideoPlayer", Level.INFO, "Video rate change detected, cancelling this.");
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                });
                log("VideoPlayer", Level.INFO, 'Successfully registered "ratechange" event to target video!');
            }*/
        } else {
            log("VideoPlayer", Level.ERROR, "Failed to find video!");
        }
    } else {
        log("iFrame", Level.ERROR, "Failed to get iFrame document!");
    }
}

let sections: Array<SectionData> | null = null;

function getSections(): Array<SectionData> {
    console.log(sections);
    if (sections != null && sections.length > 0) return sections;
    // TODO: replace to use API (api.nnn.ed.nico) endpoints, with use fetch() API
    // TODO: v[Object.keys(v).filter((key) => key.startsWith("__reactProps$"))[0]].children.props; って感じのことをすればReactのpropsを取得できるけど、どうやら特定の初期フェーズの段階では存在しないようなので、やはりAPIエンドポイントへのアクセスが必要そう。

    log("getSections", Level.INFO, "Retrieving sections...");
    const rawList: NodeListOf<HTMLLIElement> = document.querySelectorAll("main>div>div>div>ul.sc-aXZVg.sc-gEvEer.sc-l5r9s4-0.dKubqp.fteAEG.bKupGM>li") as NodeListOf<HTMLLIElement>;
    const list: Array<SectionData> = [];
    rawList.forEach((v: HTMLLIElement, n: number) => {
        //log("getSections", Level.INFO, "Processing section at index " + n);
        v.setAttribute("n-cheat-id", String(n));

        const descriptionRoot: HTMLDivElement = v.querySelector("div[class^=sc-][class^=sc-][class*=sc-][class^=sc-] > div[class^=sc-][class^=sc-][class^=sc-]") as HTMLDivElement;

        const title: string = (descriptionRoot.querySelector("span[class^=sc-]:nth-child(2)") as HTMLSpanElement).innerText;

        let type: SectionType | null = null;
        const iconElement: HTMLElement | null = v.querySelector("i");
        if (iconElement != null) {
            const iconType: string | null = iconElement.getAttribute("type");
            if (iconType != null) {
                if (iconType == "movie-rounded") type = SectionType.MOVIE; // 動画教材
                if (iconType == "movie-rounded-plus") type = SectionType.SUPPLEMENT; // Nプラス教材
                if (iconType == "exercise-rounded") { // 動画教材以外の場合
                    const chapterTitleElement: HTMLSpanElement | null = v.querySelector("span[class^=sc-]:nth-child(2)");
                    if (chapterTitleElement != null) {
                        // 全角の括弧だったりするので判定材料にしない、括弧の中身のみをみる, たまにタイトルが別のパターンなこともあるので、全てのパターンを網羅するか、実際の内部のAPIデータが欲しいところ。
                        if (title.includes("記述/選択テスト") || title.includes("選択記述式")) type = SectionType.EVALUATION_TEST;
                        else if (title.includes("論述テスト")) type = SectionType.ESSAY_TEST;
                        else if (title.includes("選択/記述式レポート") || title.includes("記述/選択レポート")) type = SectionType.EVALUATION_REPORT;
                        else if (title.includes("論述式レポート")) type = SectionType.ESSAY_REPORT;
                        else log("getSections", Level.ERROR, "Unknown exercise type detected: " + title);
                    }
                }
            }
        }
        v.setAttribute("n-cheat-type", String(type));

        const sectionState = updateCustomAttributes(v, false);
        if (sectionState == null) return;

        let movieTimeSeconds: number = -1;
        if (type == SectionType.MOVIE || type == SectionType.SUPPLEMENT) {
            const length: string[] = (descriptionRoot.querySelector("div[class^=sc-][class$=iuHQbN]") as HTMLDivElement).innerText.split(":");
            if (length.length == 2) movieTimeSeconds = (Number(length[0]) * 60) + Number(length[1]);
            else if (length.length == 3) movieTimeSeconds = ((Number(length[0]) * 60) * 60) + (Number(length[1]) * 60) + Number(length[2]);
        }

        list[n] = {
            title: title,
            type: type,
            isGood: sectionState.isGood, // 視聴/完了済
            isMovie: type == SectionType.MOVIE || type == SectionType.SUPPLEMENT, // 動画
            isSupplement: type == SectionType.SUPPLEMENT, // Nプラス教材
            isEvaluationTest: type == SectionType.EVALUATION_TEST, // 選択/記述テスト
            isEssayTest: type == SectionType.ESSAY_TEST, // 論述テスト
            isEvaluationReport: type == SectionType.EVALUATION_REPORT, // 選択/記述式レポート
            isEssayReport: type == SectionType.ESSAY_REPORT, // 論述式レポート
            isOpened: sectionState.isOpened, // 今開いてる
            isGateClosed: sectionState.isGateClosed, // まだ開けない
            movieTimeSeconds: movieTimeSeconds,
            element: v,
            clickTarget: v.querySelector("div"),
            apiData: null
        } as SectionData;

        //log("getSections", Level.INFO, "Processed section at index " + n + " with " + title);
    });

    fetch(location.href.replace("www.nnn.ed.nico/", "api.nnn.ed.nico/v2/material/"), { method: "GET", credentials: "include" })
        .then(response => response.json())
        .then((json: TenjinApiChapterResponse) => {
            list.forEach((v, i) => {
                if (json.chapter.sections[i] != null && json.chapter.sections[i].title == v.title) {
                    v.apiData = json.chapter.sections[i];
                } else {
                    log("getSections", Level.ERROR, "Failed to get API data for section " + v.title);
                }
            })
            eventManager.dispatchEvent(new TenjinDataFetchedEvent(rawList[0].parentElement as HTMLUListElement, json));
        })
        .catch(err => log("getSections", Level.ERROR, "Failed to fetch Tenjin API data: " + err));

    rawList.forEach(v => {
        const observeTarget: HTMLDivElement | null = v.querySelector("div");

        if (observeTarget != null) {
            new MutationObserver((mutations: MutationRecord[], observer: MutationObserver) => {
                mutations.forEach(mutation => {
                    if (mutation.target instanceof HTMLDivElement) {
                        updateCustomAttributes(mutation.target.parentElement as HTMLLIElement);
                    }
                });
            }).observe(observeTarget, {
                attributes: true
            });
        }
    });

    eventManager.addEventListener(ChapterGateOpenEvent.TYPE, async (event: ChapterGateOpenEvent) => {
        log("GateOpenEvent", Level.INFO, "Gate opened! Checking config...");
        const data: SectionData = event.getData();
        const config: Config = await getConfig();

        if (config.useAutoNext) {
            log("GateOpenEvent", Level.INFO, "useAutoNext is active, opening next chapter...")
            await openChapter(data);
        }
    });

    log("getSections", Level.INFO, "Successfully retrieved sections.");
    sections = list;
    return list;
}

function updateCustomAttributes(item: HTMLLIElement | null, updateSectionData: boolean = true): { isGood: boolean, isOpened: boolean, isGateClosed: boolean } | null {
    if (item == null) return null;
    const iconElement: HTMLElement | null = item.querySelector("i");

    const oldState = item.hasAttribute("n-cheat-id") && sections && sections[Number(item.getAttribute("n-cheat-id"))] ? {
        isGood: sections[Number(item.getAttribute("n-cheat-id"))].isGood,
        isOpened: sections[Number(item.getAttribute("n-cheat-id"))].isOpened,
        isGateClosed: sections[Number(item.getAttribute("n-cheat-id"))].isGateClosed
    } : null;

    const state = {
        // rgb(0, 197, 65) = 視聴済み (緑色)
        isGood: iconElement != null && iconElement.style.color == "rgb(0, 197, 65)",
        // cpELFc = 開いてない, crtNbk = 開いてる, hoWVG = 開けない
        isOpened: item.querySelector("div[class$=crtNbk]") != null && item.querySelector("div[class$=cpELFc]") == null,
        isGateClosed: item.querySelector("div[class$=hoWVG]") != null
    };

    // Update attributes
    item.setAttribute("n-cheat-good", String(state.isGood));
    item.setAttribute("n-cheat-opened", String(state.isOpened));
    item.setAttribute("n-cheat-gate-closed", String(state.isGateClosed));

    // Update section data
    if (updateSectionData) {
        if (sections != null) {
            const section = sections[Number(item.getAttribute("n-cheat-id"))];
            section.isGood = state.isGood;
            section.isOpened = state.isOpened;
            section.isGateClosed = state.isGateClosed;
        } else {
            getSections();
            return updateCustomAttributes(item, updateSectionData);
        }
    }

    if (sections != null && oldState != null) {
        if (!oldState.isGood && state.isGood) {
            eventManager.dispatchEvent(new ChapterGoodEvent(item, sections[Number(item.getAttribute("n-cheat-id"))]));
        }

        if (oldState.isGateClosed && !state.isGateClosed) {
			eventManager.dispatchEvent(new ChapterGateOpenEvent(item, sections[Number(item.getAttribute("n-cheat-id"))]));
        }
    }

    return state;
}

function getOpenedSection(): SectionData | null {
    if (sections != null) {
        // Better and faster method, but not working when not loaded sections (getSection() isn't called)
        const openedElement: HTMLElement | null = document.querySelector("li[n-cheat-opened=true]");
        if (openedElement != null) {
            const openedElementIdStr: string | null = openedElement.getAttribute("n-cheat-id");
            if (openedElementIdStr != null) {
                const openedElementId: number = Number(openedElementIdStr);
                return sections[openedElementId];
            }
        }
    }

    const result = getSections().filter((data) => {
        return data.isOpened;
    });

    if (result.length > 0) {
        return result[0];
    } else {
        return null;
    }
}

function getNextSection(supplement: boolean, notGoodOnly: boolean): SectionData | null {
    log("getNextSection", Level.INFO, "Finding next required section...");
    let sections: Array<SectionData> = getSections().filter((data => (data.isMovie || data.isEvaluationTest || data.isEssayTest || data.isEvaluationReport || data.isEssayReport) && (supplement ? data.isSupplement : !data.isSupplement)));
    log("getNextSection", Level.INFO, "Found " + sections.length + " sections.");

	if (sections.length > 0) {
        const openedPos: number = sections.findIndex((value: SectionData, number: number, list: SectionData[]) => {
            return value.isOpened;
        });

        if (openedPos != -1) {
            log("getNextSection", Level.INFO, "Currently section is opened, removing opened and before sections...");
            sections = sections.slice(openedPos + 1);
        }

        log("getNextSection", Level.INFO, "Gathering next section...");
		let nextPos: number = sections.findIndex((value: SectionData, number: number, list: SectionData[]) => {
            return !value.isOpened && !value.isGateClosed && ((notGoodOnly && !value.isGood) || (!notGoodOnly && value.isGood));
        });

		if (nextPos != -1) {
			log("getNextSection", Level.INFO, "Next section index is " + nextPos);
			if (nextPos < sections.length) {
				let nextSection: SectionData | null = sections[nextPos];

				if (nextSection != null) {
					log("getNextSection", Level.INFO, "Found section: " + nextSection.title);
					return nextSection;
				}
			}
		}
	}

	log("getNextSection", Level.WARN, "Next section not found, all cleared?");
    return null;
}

async function playVideo(data: SectionData | null): Promise<boolean> {
    if (data != null) {
        log("Automation/playVideo", Level.INFO, "Clicking next section...")
        click(data.clickTarget);
        log("Automation", Level.INFO, "Sending playback started notification");
        // await sendNotifyPlaybackStarted(data);
        return true;
    }
    return false;
}

async function openTest(data: SectionData | null): Promise<boolean> {
    if (data != null && !data.isMovie) {
        log("Automation/openTest", Level.INFO, "Clicking next section...")
        click(data.clickTarget);
        log("Automation/openTest", Level.INFO, "Sending take test notification");
        await sendNotifyTakeTest(data);
        return true;
    }
    return false;
}

async function openChapter(data: SectionData | null): Promise<boolean> {
    if (data != null) {
        if (data.isMovie) return await playVideo(data);
        else return await openTest(data);
    }
    return false;
}

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

function injectProgressView() {
	const movies: SectionData[] = getSections().filter(data => data.isMovie);
	const goodMovies: SectionData[] = movies.filter(data => data.isGood);

	const requiredMovies: SectionData[] = movies.filter(data => !data.isSupplement);
	const requiredGoodMovies: SectionData[] = goodMovies.filter(data => !data.isSupplement);

	const supplementMovies: SectionData[] = movies.filter(data => data.isSupplement);
	const supplementGoodMovies: SectionData[] = goodMovies.filter(data => data.isSupplement);

	const tests: SectionData[] = getSections().filter(data => data.isEssayTest || data.isEvaluationTest || data.isEssayReport || data.isEvaluationReport);
	const goodTests: SectionData[] = tests.filter(data => data.isGood);

	let requiredTimeSeconds = 0;
	let requiredGoodTimeSeconds = 0;
	let requiredRemainTimeSeconds = 0;
	requiredMovies.forEach(data => {
		requiredTimeSeconds += data.movieTimeSeconds;
		if (data.isGood) requiredGoodTimeSeconds += data.movieTimeSeconds;
		else requiredRemainTimeSeconds += data.movieTimeSeconds;
	});

	let supplementTimeSeconds = 0;
	let supplementRemainTimeSeconds = 0;
	let supplementGoodTimeSeconds = 0;
	supplementMovies.forEach(data => {
		supplementTimeSeconds += data.movieTimeSeconds;
		if (data.isGood) supplementGoodTimeSeconds += data.movieTimeSeconds;
		else supplementRemainTimeSeconds += data.movieTimeSeconds;
	});

	const requiredTimes: number[] = getTime(requiredTimeSeconds);
	const requiredGoodTimes: number[] = getTime(requiredGoodTimeSeconds);
	const requiredRemainTimes: number[] = getTime(requiredRemainTimeSeconds);

	const supplementTimes: number[] = getTime(supplementTimeSeconds);
	const supplementGoodTimes: number[] = getTime(supplementGoodTimeSeconds);
	const supplementRemainTimes: number[] = getTime(supplementRemainTimeSeconds);

	let injectView = document.querySelector('main > div[class^=sc-][class^=sc-][class^=sc-] > div[class^=sc-].sc-lcfvsp-4');

	if (injectView == undefined) {
		location.reload();
	} else {
		injectView.innerHTML = `
   <div width="100%" class="sc-aXZVg sc-gEvEer eovZuA fteAEG">
      <div class="sc-aXZVg gPvMWS">この単元の進捗状況</div>
   </div>
   <div class="sc-aXZVg sc-gEvEer cMtRut fteAEG sc-oqvosu-0 gNsPPb">
      <p class="sc-aXZVg hpOOvr">[必修教材]</p>
      <p class="sc-aXZVg hpOOvr">視聴済み動画本数: ${requiredGoodMovies.length}/${requiredMovies.length}本</p>
      <p class="sc-aXZVg hpOOvr">受講済みテスト数: ${goodTests.length}/${tests.length}個</p>
      <p class="sc-aXZVg hpOOvr">合計動画時間: ${requiredTimes[0] > 0 ? zeroPadding(requiredTimes[0], 2) + "時間" : ""}${zeroPadding(requiredTimes[1], 2)}分${zeroPadding(requiredTimes[2], 2)}秒</p>
      <p class="sc-aXZVg hpOOvr">視聴済み動画時間: ${requiredGoodTimes[0] > 0 ? zeroPadding(requiredGoodTimes[0], 2) + "時間" : ""}${zeroPadding(requiredGoodTimes[1], 2)}分${zeroPadding(requiredGoodTimes[2], 2)}秒</p>
      <p class="sc-aXZVg hpOOvr">未試聴動画時間: ${requiredRemainTimes[0] > 0 ? zeroPadding(requiredRemainTimes[0], 2) + "時間" : ""}${zeroPadding(requiredRemainTimes[1], 2)}分${zeroPadding(requiredRemainTimes[2], 2)}秒</p>
      <br />
      <p class="sc-aXZVg hpOOvr">[Nプラス教材]</p>
      <p class="sc-aXZVg hpOOvr">視聴済み動画本数: ${supplementGoodMovies.length}/${supplementMovies.length}本</p>
      <p class="sc-aXZVg hpOOvr">合計動画時間: ${supplementTimes[0] > 0 ? zeroPadding(supplementTimes[0], 2) + "時間" : ""}${zeroPadding(supplementTimes[1], 2)}分${zeroPadding(supplementTimes[2], 2)}秒</p>
      <p class="sc-aXZVg hpOOvr">視聴済み動画時間: ${supplementGoodTimes[0] > 0 ? zeroPadding(supplementGoodTimes[0], 2) + "時間" : ""}${zeroPadding(supplementGoodTimes[1], 2)}分${zeroPadding(supplementGoodTimes[2], 2)}秒</p>
      <p class="sc-aXZVg hpOOvr">未試聴動画時間: ${supplementRemainTimes[0] > 0 ? zeroPadding(supplementRemainTimes[0], 2) + "時間" : ""}${zeroPadding(supplementRemainTimes[1], 2)}分${zeroPadding(supplementRemainTimes[2], 2)}秒</p>
   </div>` + injectView.innerHTML;
	}
}

new MutationObserver((modalPortalMutations, modalPortalObserver) => {
	const modalPortal: HTMLDivElement | null = document.querySelector('div[class="ReactModalPortal"]');

	if (modalPortal == null) {
		location.reload();
		return;
	}

	injectProgressView();

	getConfig().then((config) => {
		if (config.autoOpenChapterWhenOpenPage) {
			const nextChapter: SectionData | null = getNextSection(config.useAutoNextContainsSupplements, config.useAutoNextNotGoodOnly);
			if (nextChapter != null) {
				log("main", Level.INFO, "Auto clicking next chapter.");
				click(nextChapter.clickTarget);
				updateCustomAttributes(nextChapter.element);
			}
		}
	});

	new MutationObserver(() => {
		log("MutationObserver", Level.INFO, "DOM change detected, registering 'load' event to iFrame (#modal-inner-iframe)!");

		const iFrame: HTMLIFrameElement = document.querySelector('div[class="ReactModalPortal"] iframe') as HTMLIFrameElement;
		if (iFrame != null) {
			iFrame.addEventListener("load", (event) => {
				log("iFrame", Level.INFO, "iFrame loaded.");

				log("iFrame", Level.INFO, "Checking iFrame contentWindow...");
				if (iFrame.contentWindow != null) {
					log("iFrame", Level.INFO, "iFrame contentWindow found!");

					const opened: SectionData | null = getOpenedSection();
					if (opened == null) return;

					if (!opened.isEssayTest && !opened.isEvaluationTest && opened.isMovie) {
						log("iFrame", Level.INFO, "Finding VideoPlayer...");
						if (iFrame.contentWindow.document.getElementById("video-player") instanceof HTMLMediaElement) {
							log("iFrame", Level.INFO, "VideoPlayer already loaded, use this.");
							registerEventsToVideo(iFrame).then(() => log("iFrame", Level.INFO, "Successfully registered video events."));
						} else {
							log("iFrame", Level.INFO, "VideoPlayer not loaded, use MutationObserver to try find...");

							new MutationObserver((mutations: MutationRecord[], observer: MutationObserver) => {
								if (iFrame.contentWindow != null) {
									const root: Element | null = iFrame.contentWindow.document.body.querySelector("div#root");
									const videoPlayer: HTMLVideoElement | null = root != null ? root.querySelector("#video-player") : null;
									if (videoPlayer != null) {
										registerEventsToVideo(iFrame).then(() => log("iFrame", Level.INFO, "Successfully registered video events."));
										observer.disconnect();
									}
								}
							}).observe(iFrame.contentWindow.document.body, {
								attributes: true, childList: true, subtree: true
							});
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
	}).observe(modalPortal as HTMLElement, {
		childList: true, // 子要素の変更を追跡する
	});

	modalPortalObserver.disconnect();
}).observe(document.querySelector('body') as HTMLBodyElement, {
	childList: true, // 子要素の変更を追跡する
});