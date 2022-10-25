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
