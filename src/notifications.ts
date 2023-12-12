import {Config, getConfig} from "./config";
import {Level, log} from "./logger";
import {SectionData} from "./objects";

export async function sendNotifyPlaybackStarted(data: SectionData | null) {
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

export async function sendNotifyPlaybackEnded(data: SectionData | null) {
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

export async function sendNotifyTakeTest(data: SectionData | null) {
    if (data != null && (data.isEvaluationTest || data.isEssayTest || data.isEvaluationReport || data.isEssayReport)) {
        const config: Config = await getConfig();

        log("Notify", Level.INFO, "Notifying take test.")
        notifyDiscord(config, config.discordTakeTestMessage.replace("%title%", data.title));
        notifyDesktop(config, config.desktopTakeTest, data.title);
        log("Notify", Level.INFO, "Successfully sent take test notify.");
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
        discord.send(JSON.stringify({
            "username": "N予備校",
            "avatar_url": "https://www.ryuuta0217.com/nnn.ed.nico.png",
            "content": content
        }));
    }
}

function notifyDesktop(config: Config, title: string, body: string) {
    if (config.useDesktopNotification) {
        const desktopNotification: Notification = new Notification(title, {
            body: body,
            icon: "https://www.nnn.ed.nico/favicon.ico",
        });

        // On clicked, activate this tab use chrome's extension api
        desktopNotification.addEventListener("click", () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs && tabs.length > 0) {
                    const activeTab = tabs[0];
                    const tabId = activeTab.id;

                    if (tabId !== undefined) {
                        chrome.tabs.update(tabId, {active: true});
                    }
                }
            });
        });

        setTimeout(desktopNotification.close.bind(desktopNotification), 3000);
    }
}