export type SectionData = {
    title: string;
    type: SectionType;
    isSupplement: boolean;
    isMovie: boolean;
    isOpened: boolean;
    isGood: boolean;
    isEvaluationTest: boolean;
    isEssayTest: boolean;
    isEvaluationReport: boolean;
    isEssayReport: boolean;
    isGateClosed: boolean;
    movieTimeSeconds: number;
    element: HTMLLIElement;
    clickTarget: HTMLElement;
    apiData: TenjinApiSectionData | null;
};

export type TenjinApiChapterResponse = {
    course_type: string;
    chapter: {
        id: number;
        title: string;
        outline: string;
        thumbnail_url: string | null;
        open_section_index: number;
        progress: {
            total_count: number;
            passed_count: number;
            status: string;
        };
        sections: TenjinApiSectionData[];
    }
};

export type TenjinApiSectionData = {
    resource_type: string;
    id: number;
    title: string;
    passed: boolean;
    textbook_info: string;
    length: number;
    content_url: string;
    material_type: string;
    thumbnail_url: string;
    vr_rank?: string;
    vr_length?: number;
    permissions: {
        vr_use?: {
            active: boolean;
        };
    };
    playback_position: number;
}

export const SectionType = {
    MOVIE: 'movie',
    SUPPLEMENT: 'supplement',
    EVALUATION_TEST: 'evaluation_test',
    ESSAY_TEST: 'essay_test',
    EVALUATION_REPORT: 'evaluation_report',
    ESSAY_REPORT: 'essay_report',
} as const;

export type SectionType = typeof SectionType[keyof typeof SectionType];
