export enum SplitMergeMetadata {

  redo,

  copy_first

}

export interface SplitMergeDocumentPart {

  document: number,

  pages?: number[]

}

export interface SplitMergeRequest {

  split_merge_plan: SplitMergeDocumentPart[][]

  delete_source: boolean

  metadata: SplitMergeMetadata

  preview: boolean

}
