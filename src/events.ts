import {SectionData, TenjinApiChapterResponse} from "./objects";

export abstract class NCheatEvent<S extends HTMLElement, T> {
    private readonly source: S;
    private readonly data: T;

    protected constructor(source: S, data: T) {
        this.source = source;
        this.data = data;
    }

    public abstract getType(): string;

    public getSource(): S {
        return this.source;
    }

    public getData(): T {
        return this.data;
    }
}

export class ChapterGoodEvent extends NCheatEvent<HTMLLIElement, SectionData> {
    public static readonly TYPE = 'chapter_good';

    public constructor(source: HTMLLIElement, data: SectionData) {
        super(source, data);
    }

    public getType(): string {
        return ChapterGoodEvent.TYPE;
    }
}

export class ChapterGateOpenEvent extends NCheatEvent<HTMLLIElement, SectionData> {
    public static readonly TYPE = 'chapter_gate_open';

    public constructor(source: HTMLLIElement, data: SectionData) {
        super(source, data);
    }

    public getType(): string {
        return ChapterGateOpenEvent.TYPE;
    }
}

export class TenjinDataFetchedEvent extends NCheatEvent<HTMLUListElement, TenjinApiChapterResponse> {
    public static readonly TYPE = 'tenjin_data_fetched';

    public constructor(source: HTMLUListElement, data: TenjinApiChapterResponse) {
        super(source, data);
    }

    public getType(): string {
        return TenjinDataFetchedEvent.TYPE;
    }
}