type Data = {
    videoEndedSearchNextDelay: number;
    useDesktopNotification: boolean;
    useDiscordNotification: boolean;
    discordWebhookUrl: string;
    discordMention: string;
    startPlaybackWhenOpenPage: boolean;
    useAutoNext: boolean;
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

window.onload = () => {
    initialize().then(() => {
        load();

        document.querySelectorAll("input").forEach((element: HTMLInputElement) => {
            element.addEventListener("input", () => {
                save();
                load();
            });
        });
    });
}

async function initialize() {
    if ((await chrome.storage.sync.getBytesInUse()) == 0) {
        setDefault(false);
    }
}

function setDefault(reload: boolean) {
    chrome.storage.sync.clear().then(() => {
        const defaultData: Data = {
            videoEndedSearchNextDelay: 1500,
            useDesktopNotification: true,
            useDiscordNotification: false,
            discordWebhookUrl: "",
            discordMention: "",
            startPlaybackWhenOpenPage: false,
            useAutoNext: true,
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
    
        chrome.storage.sync.set(defaultData);
        if (reload) load();
    });
}

function load() {
    chrome.storage.sync.get(null, (data) => {
        (document.getElementById("start-playback-when-open-page") as HTMLInputElement).checked = data.startPlaybackWhenOpenPage;
        (document.getElementById("use-auto-next") as HTMLInputElement).checked = data.useAutoNext;
        (document.getElementById("use-auto-pause-unblock") as HTMLInputElement).checked = data.useAutoPauseUnblock;
        (document.getElementById("use-seek-unblock") as HTMLInputElement).checked = data.useSeekUnblock;

        (document.getElementById("notify-video-state-change") as HTMLInputElement).checked = data.notifyVideoStateChange;
        (document.getElementById("notify-desktop") as HTMLInputElement).checked = data.useDesktopNotification;
        (document.getElementById("notify-discord") as HTMLInputElement).checked = data.useDiscordNotification;
        (document.getElementById("discord-webhook-url") as HTMLInputElement).value = data.discordWebhookUrl;
        (document.getElementById("discord-mention") as HTMLInputElement).value = data.discordMention;

        (document.getElementById("video-ended-search-next-delay") as HTMLInputElement).value = data.videoEndedSearchNextDelay;

        (document.getElementById("discord-playback-started-message") as HTMLInputElement).value = data.discordPlaybackStartedMessage;
        (document.getElementById("discord-playback-ended-message") as HTMLInputElement).value = data.discordPlaybackEndedMessage;
        (document.getElementById("discord-take-test-message") as HTMLInputElement).value = data.discordTakeTestMessage;

        (document.getElementById("desktop-playback-started") as HTMLInputElement).value = data.desktopPlaybackStarted;
        (document.getElementById("desktop-playback-ended") as HTMLInputElement).value = data.desktopPlaybackEnded;
        (document.getElementById("desktop-take-test") as HTMLInputElement).value = data.desktopTakeTest;

        (document.getElementById("unknown-video") as HTMLInputElement).value = data.unknownVideo;
        (document.getElementById("unknown-test") as HTMLInputElement).value = data.unknownTest;
    });
}

function save() {
    let videoEndedSearchNextDelay: number;
    try {
        videoEndedSearchNextDelay = Number((document.getElementById("video-ended-search-next-delay") as HTMLInputElement).value);
    } catch {
        videoEndedSearchNextDelay = 1500;
    }

    const data: Data = {
        startPlaybackWhenOpenPage: (document.getElementById("start-playback-when-open-page") as HTMLInputElement).checked,
        useAutoNext: (document.getElementById("use-auto-next") as HTMLInputElement).checked,
        useAutoPauseUnblock: (document.getElementById("use-auto-pause-unblock") as HTMLInputElement).checked,
        useSeekUnblock: (document.getElementById("use-seek-unblock") as HTMLInputElement).checked,
        notifyVideoStateChange: (document.getElementById("notify-video-state-change") as HTMLInputElement).checked,
        useDesktopNotification: (document.getElementById("notify-desktop") as HTMLInputElement).checked,
        useDiscordNotification: (document.getElementById("notify-discord") as HTMLInputElement).checked,
        discordWebhookUrl: (document.getElementById("discord-webhook-url") as HTMLInputElement).value,
        discordMention: (document.getElementById("discord-mention") as HTMLInputElement).value,
        videoEndedSearchNextDelay: videoEndedSearchNextDelay,
        discordPlaybackStartedMessage: (document.getElementById("discord-playback-started-message") as HTMLInputElement).value,
        discordPlaybackEndedMessage: (document.getElementById("discord-playback-ended-message") as HTMLInputElement).value,
        discordTakeTestMessage: (document.getElementById("discord-take-test-message") as HTMLInputElement).value,
        desktopPlaybackStarted: (document.getElementById("desktop-playback-started") as HTMLInputElement).value,
        desktopPlaybackEnded: (document.getElementById("desktop-playback-ended") as HTMLInputElement).value,
        desktopTakeTest: (document.getElementById("desktop-take-test") as HTMLInputElement).value,
        unknownVideo: (document.getElementById("unknown-video") as HTMLInputElement).value,
        unknownTest: (document.getElementById("unknown-test") as HTMLInputElement).value
    };

    chrome.storage.sync.set(data);
}