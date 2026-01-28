export interface ResearchOptions {
    days: number;
    format: "text" | "json";
    sources: boolean;
}
export interface ResearchResult {
    topic: string;
    trends: string;
    community: string;
    insights: string;
    sources: {
        title: string;
        url: string;
        source: string;
    }[];
    raw?: any;
}
export declare function research(topic: string, options: ResearchOptions): Promise<ResearchResult>;
export declare function formatResult(result: ResearchResult, options: ResearchOptions): string;
