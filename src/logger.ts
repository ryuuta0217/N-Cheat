export const Level = {
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
    DEBUG: "DEBUG",
} as const;

type Level = typeof Level[keyof typeof Level];

export const ASCIIColor = {
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

export function log(name: string, level: Level, content: string): void {
    let color: ASCIIColor = level == Level.INFO ? ASCIIColor.WHITE : level == Level.WARN ? ASCIIColor.DARK_YELLOW : level == Level.ERROR ? ASCIIColor.DARK_RED : ASCIIColor.GRAY;
    console.log(color + "[" + new Intl.DateTimeFormat("ja-JP", { timeStyle: "medium" }).format(new Date()) + "] [" + name + "] [" + level + "] " + content + ASCIIColor.RESET);
}
