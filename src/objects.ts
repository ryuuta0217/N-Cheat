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

export type ChapterData = {
    title: string;
    isSupplement: boolean;
    isMovie: boolean;
    isOpened: boolean;
    isGood: boolean;
    isEvaluationTest: boolean;
    isEssayTest: boolean;
    isGateClosed: boolean;
    movieTimeSeconds: number;
    element: HTMLLIElement;
    clickTarget: HTMLAnchorElement;
};
