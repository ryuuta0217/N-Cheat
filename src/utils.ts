export function click(target: HTMLElement): void {
    const event: MouseEvent = document.createEvent("MouseEvent");
    event.initEvent("click", true, true);
    target.dispatchEvent(event);
}

export function zeroPadding(num: number, length: number): string {
    const zero: string = "0".repeat(length);
    return (zero + num).slice(-length);
}

export function getTime(seconds: number): number[] {
    let result: number[] = [0, 0, 0];
    result[0] = Math.floor(seconds / 3600);
    result[1] = Math.floor((seconds % 3600) / 60);
    result[2] = seconds % 60;
    return result;
}