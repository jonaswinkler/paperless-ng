export enum SplitMergeMetadata {

  REDO = "redo",

  COPY_FIRST = "copy_first"

}

export interface SplitMergePlanDocumentPart {

  document: number,

  pages?: number[]

}

export type SplitMergePlan = SplitMergePlanDocumentPart[][]

export interface SplitMergeRequest {

  split_merge_plan: SplitMergePlan

  delete_source: boolean

  metadata: SplitMergeMetadata

  preview: boolean

}
