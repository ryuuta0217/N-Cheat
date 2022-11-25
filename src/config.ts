import {Level, log} from "./logger";

export type Config = {
    version: number;
    useDesktopNotification: boolean;
    useDiscordNotification: boolean;
    discordWebhookUrl: string;
    discordMention: string;
    autoOpenChapterWhenOpenPage: boolean;
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

export const CONFIG_VERSION: number = 2;

const defaultData: Config = {
    version: CONFIG_VERSION,
    useDesktopNotification: true,
    useDiscordNotification: false,
    discordWebhookUrl: "",
    discordMention: "",
    autoOpenChapterWhenOpenPage: false,
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

export async function setDefault() {
    await chrome.storage.sync.clear();
    await chrome.storage.sync.set(defaultData);
    log("Config", Level.INFO, "Configuration initialized.");
}

export async function getConfig(): Promise<Config> {
    await initialize();
    return await chrome.storage.sync.get() as Config;
}

export async function initialize() {
    if ((await chrome.storage.sync.getBytesInUse()) == 0) {
        log("Config", Level.INFO, "Configuration not found, writing default configuration.");
        await setDefault();
    } else {
        let rawData = await chrome.storage.sync.get();
        if (!rawData["version"]) { // for Version 1 Configuration
            log("Config", Level.INFO, "Configuration migrate required. You're using config version 1.");
            const migrated: Config = {
                version: 2,
                useDesktopNotification: rawData.useDesktopNotification,
                useDiscordNotification: rawData.useDiscordNotification,
                discordWebhookUrl: rawData.discordWebhookUrl,
                discordMention: rawData.discordMention,
                autoOpenChapterWhenOpenPage: rawData.startPlaybackWhenOpenPage,
                useAutoNext: rawData.useAutoNext,
                useAutoNextContainsSupplements: rawData.useAutoNextContainsSupplements,
                useAutoNextNotGoodOnly: rawData.useAutoNextNotGoodOnly,
                useAutoPauseUnblock: rawData.useAutoPauseUnblock,
                useSeekUnblock: rawData.useSeekUnblock,
                notifyVideoStateChange: rawData.notifyVideoStateChange,
                discordPlaybackStartedMessage: rawData.discordPlaybackStartedMessage,
                discordPlaybackEndedMessage: rawData.discordPlaybackEndedMessage,
                discordTakeTestMessage: rawData.discordTakeTestMessage,
                desktopPlaybackStarted: rawData.desktopPlaybackStarted,
                desktopPlaybackEnded: rawData.desktopPlaybackEnded,
                desktopTakeTest: rawData.desktopTakeTest,
                unknownVideo: rawData.unknownVideo,
                unknownTest: rawData.unknownTest
            };
            await chrome.storage.sync.clear();
            await chrome.storage.sync.set(migrated);
        }

        if (rawData.version != defaultData.version) {
            if (rawData.version == 2) {
                // when config upgraded to version 3, use here.
                let migrated: Config = {
                    version: 3,
                    useDesktopNotification: rawData.useDesktopNotification,
                    useDiscordNotification: rawData.useDiscordNotification,
                    discordWebhookUrl: rawData.discordWebhookUrl,
                    discordMention: rawData.discordMention,
                    autoOpenChapterWhenOpenPage: rawData.autoOpenChapterWhenOpenPage,
                    useAutoNext: rawData.useAutoNext,
                    useAutoNextContainsSupplements: rawData.useAutoNextContainsSupplements,
                    useAutoNextNotGoodOnly: rawData.useAutoNextNotGoodOnly,
                    useAutoPauseUnblock: rawData.useAutoPauseUnblock,
                    useSeekUnblock: rawData.useSeekUnblock,
                    notifyVideoStateChange: rawData.notifyVideoStateChange,
                    discordPlaybackStartedMessage: rawData.discordPlaybackStartedMessage,
                    discordPlaybackEndedMessage: rawData.discordPlaybackEndedMessage,
                    discordTakeTestMessage: rawData.discordTakeTestMessage,
                    desktopPlaybackStarted: rawData.desktopPlaybackStarted,
                    desktopPlaybackEnded: rawData.desktopPlaybackEnded,
                    desktopTakeTest: rawData.desktopTakeTest,
                    unknownVideo: rawData.unknownVideo,
                    unknownTest: rawData.unknownTest
                };
                await chrome.storage.sync.clear();
                await chrome.storage.sync.set(migrated);
                rawData = await chrome.storage.sync.get();
            }

            if (rawData.version == 3) {

            }
        }
    }
}
