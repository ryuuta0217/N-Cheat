import { Level, log } from "./logger";
import {Config, CONFIG_VERSION, getConfig, initialize, setDefault} from "./config";

window.onload = () => {
    load();

    document.querySelectorAll("input").forEach((element: HTMLInputElement) => {
        element.addEventListener("input", () => {
            save();
            load();
        });
    });

    (document.getElementById("reset") as HTMLButtonElement).onclick = () => {
        setDefault().then(() => {
            load();
            log("Popup", Level.INFO, "Configuration reset.")
        });
    };
}

function load() {
    getConfig().then((config: Config) => {
        (document.getElementById("auto-open-chapter-when-open-page") as HTMLInputElement).checked = config.autoOpenChapterWhenOpenPage;
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
        version: CONFIG_VERSION,
        autoOpenChapterWhenOpenPage: (document.getElementById("auto-open-chapter-when-open-page") as HTMLInputElement).checked,
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
