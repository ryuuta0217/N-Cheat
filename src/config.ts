import {Level, log} from "./logger";

export type Config = {
    useDesktopNotification: boolean;
    useDiscordNotification: boolean;
    discordWebhookUrl: string;
    discordMention: string;
    startPlaybackWhenOpenPage: boolean;
    useAutoNext: boolean;
    useAutoNextContainsSupplements: boolean;
    useAutoNextNotGoodOnly: boolean;
    useAutoPauseUnblock: boolean;
    useSeekUnblock: boolean;
    notifyVideoStateChange: boolean;
    discordPlaybackStartedMessage: string;
    discordPlaybackEndedMessage: string;
    discordTakeTestMessage: string;
    desktopPlaybackStarted: string;
    desktopPlaybackEnded: string;
    desktopTakeTest: string;
    unknownVideo: string;
    unknownTest: string;
};

export async function setDefault() {
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
    log("Config", Level.INFO, "Configuration initialized.");
}

export async function initialize() {
    if ((await chrome.storage.sync.getBytesInUse()) == 0) {
        log("Popup", Level.INFO, "Configuration not found, writing default configuration.");
        await setDefault();
    }
}
