import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
    deleteDataRow(id: string): Promise<void>;
    deleteKnowledgeDoc(id: string): Promise<void>;
    getDataRows(): Promise<Array<DataRow>>;
    getKnowledgeDocs(): Promise<Array<KnowledgeDoc>>;
    saveDataRow(row: DataRow): Promise<void>;
    saveKnowledgeDoc(doc: KnowledgeDoc): Promise<void>;
    whoami(): Promise<Principal>;
}
