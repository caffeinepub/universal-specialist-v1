import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SearchResult {
    url: string;
    title: string;
    snippet: string;
}
export interface AgenticResult {
    contextMode: string;
    results: Array<SearchResult>;
    timestamp: bigint;
    searchQuery: string;
    actionableSummary: string;
}
export interface ScanResult {
    id: string;
    contextMode: string;
    analysisText: string;
    timestamp: bigint;
    thumbnailSummary: string;
}
export interface KnowledgeDoc {
    id: string;
    title: string;
    content: string;
    createdAt: bigint;
}
export interface DataRow {
    id: string;
    component: string;
    createdAt: bigint;
    specification: string;
    toolsRequired: string;
}
export interface backendInterface {
    agenticScan(imageDescription: string, contextMode: string): Promise<AgenticResult>;
    deleteDataRow(id: string): Promise<void>;
    deleteKnowledgeDoc(id: string): Promise<void>;
    deleteScanResult(id: string): Promise<void>;
    getDataRows(): Promise<Array<DataRow>>;
    getKnowledgeDocs(): Promise<Array<KnowledgeDoc>>;
    getScanResults(): Promise<Array<ScanResult>>;
    saveDataRow(row: DataRow): Promise<void>;
    saveKnowledgeDoc(doc: KnowledgeDoc): Promise<void>;
    saveScanResult(result: ScanResult): Promise<void>;
    webSearch(_query: string): Promise<Array<SearchResult>>;
    whoami(): Promise<Principal>;
}
