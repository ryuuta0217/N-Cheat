import { log, Level } from "./logger";
import { Config } from "./config";

window.onload = () => {
    initialize().then(() => {
        log("Popup", Level.INFO, "Initialize completed, loading configuration.");
        load();

        document.querySelectorAll("input").forEach((element: HTMLInputElement) => {
            element.addEventListener("input", () => {
                save();
                load();
            });
        });

        (document.getElementById("reset") as HTMLButtonElement).onclick = () => {
            setDefault(true).then(() => {
                log("Popup", Level.INFO, "Configuration reset.")
            });
        };
    });
}

async function initialize() {
    if ((await chrome.storage.sync.getBytesInUse()) == 0) {
        log("Popup", Level.INFO, "Configuration not found, writing default configuration.");
        await setDefault(false);
    }
}

async function setDefault(reload: boolean) {
    await chrome.storage.sync.clear();
    const defaultData: Config = {
        useDesktopNotification: true,
        useDiscordNotification: false,
        discordWebhookUrl: "",
        discordMention: "",
        startPlaybackWhenOpenPage: false,
        useAutoNext: true,
        useAutoNextContainsSupplements: false,
        useAutoNextNotGoodOnly: true,
        useAutoPauseUnblock: true,
        useSeekUnblock: true,
        notifyVideoStateChange: false,
        discordPlaybackStartedMessage: "%mention% 教材動画 `%title%` の再生を開始しました",
        discordPlaybackEndedMessage: "%mention% 教材動画 `%title%` の再生が終了しました",
        discordTakeTestMessage: "%mention% テスト `%title%` を受けてください",
        desktopPlaybackStarted: "教材動画の再生を開始しました",
        desktopPlaybackEnded: "教材動画の再生が終了しました",
        desktopTakeTest: "テストを受けてください",
        unknownVideo: "不明な動画",
        unknownTest: "不明なテスト"
    };

    await chrome.storage.sync.set(defaultData);
    log("Popup", Level.INFO, "Configuration initialized.");
    if (reload) load();
}

function load() {
    chrome.storage.sync.get(null, (raw) => {
        const config = raw as Config;
        (document.getElementById("start-playback-when-open-page") as HTMLInputElement).checked = config.startPlaybackWhenOpenPage;
        (document.getElementById("use-auto-next") as HTMLInputElement).checked = config.useAutoNext;
        (document.getElementById("use-auto-next-contains-supplements") as HTMLInputElement).checked = config.useAutoNextContainsSupplements;
        (document.getElementById("use-auto-next-not-good-only") as HTMLInputElement).checked = config.useAutoNextNotGoodOnly;
        (document.getElementById("use-auto-pause-unblock") as HTMLInputElement).checked = config.useAutoPauseUnblock;
        (document.getElementById("use-seek-unblock") as HTMLInputElement).checked = config.useSeekUnblock;

        (document.getElementById("notify-video-state-change") as HTMLInputElement).checked = config.notifyVideoStateChange;
        (document.getElementById("notify-desktop") as HTMLInputElement).checked = config.useDesktopNotification;
        (document.getElementById("notify-discord") as HTMLInputElement).checked = config.useDiscordNotification;
        (document.getElementById("discord-webhook-url") as HTMLInputElement).value = config.discordWebhookUrl;
        (document.getElementById("discord-mention") as HTMLInputElement).value = config.discordMention;

        (document.getElementById("discord-playback-started-message") as HTMLInputElement).value = config.discordPlaybackStartedMessage;
        (document.getElementById("discord-playback-ended-message") as HTMLInputElement).value = config.discordPlaybackEndedMessage;
        (document.getElementById("discord-take-test-message") as HTMLInputElement).value = config.discordTakeTestMessage;

        (document.getElementById("desktop-playback-started") as HTMLInputElement).value = config.desktopPlaybackStarted;
        (document.getElementById("desktop-playback-ended") as HTMLInputElement).value = config.desktopPlaybackEnded;
        (document.getElementById("desktop-take-test") as HTMLInputElement).value = config.desktopTakeTest;

        (document.getElementById("unknown-video") as HTMLInputElement).value = config.unknownVideo;
        (document.getElementById("unknown-test") as HTMLInputElement).value = config.unknownTest;
        log("Popup", Level.INFO, "Configuration loaded.");
    });
}

function save() {
    const config: Config = {
        startPlaybackWhenOpenPage: (document.getElementById("start-playback-when-open-page") as HTMLInputElement).checked,
        useAutoNext: (document.getElementById("use-auto-next") as HTMLInputElement).checked,
        useAutoNextContainsSupplements: (document.getElementById("use-auto-next-contains-supplements") as HTMLInputElement).checked,
        useAutoNextNotGoodOnly: (document.getElementById("use-auto-next-not-good-only") as HTMLInputElement).checked,
        useAutoPauseUnblock: (document.getElementById("use-auto-pause-unblock") as HTMLInputElement).checked,
        useSeekUnblock: (document.getElementById("use-seek-unblock") as HTMLInputElement).checked,
        notifyVideoStateChange: (document.getElementById("notify-video-state-change") as HTMLInputElement).checked,
        useDesktopNotification: (document.getElementById("notify-desktop") as HTMLInputElement).checked,
        useDiscordNotification: (document.getElementById("notify-discord") as HTMLInputElement).checked,
        discordWebhookUrl: (document.getElementById("discord-webhook-url") as HTMLInputElement).value,
        discordMention: (document.getElementById("discord-mention") as HTMLInputElement).value,
        discordPlaybackStartedMessage: (document.getElementById("discord-playback-started-message") as HTMLInputElement).value,
        discordPlaybackEndedMessage: (document.getElementById("discord-playback-ended-message") as HTMLInputElement).value,
        discordTakeTestMessage: (document.getElementById("discord-take-test-message") as HTMLInputElement).value,
        desktopPlaybackStarted: (document.getElementById("desktop-playback-started") as HTMLInputElement).value,
        desktopPlaybackEnded: (document.getElementById("desktop-playback-ended") as HTMLInputElement).value,
        desktopTakeTest: (document.getElementById("desktop-take-test") as HTMLInputElement).value,
        unknownVideo: (document.getElementById("unknown-video") as HTMLInputElement).value,
        unknownTest: (document.getElementById("unknown-test") as HTMLInputElement).value
    };

    chrome.storage.sync.set(config).then(() => {
        log("Popup", Level.INFO, "Configuration saved.")
    });
}
