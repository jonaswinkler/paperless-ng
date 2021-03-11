import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaperlessDocument } from '../data/paperless-document';
import { SplitMergeMetadata, SplitMergeRequest } from '../data/split-merge-request';

@Injectable({
  providedIn: 'root'
})
export class SplitMergeService {

  // this also needs to incorporate pages.
  private documents: PaperlessDocument[] = []

  constructor(private http: HttpClient) { }

  addDocument(document: PaperlessDocument) {
    this.documents.push(document)
  }

  hasDocuments(): boolean {
    return this.documents.length > 0
  }

  getDocuments() {
    return this.documents
  }

  executeSplitMerge(preview: boolean, delete_source: boolean, metadata: SplitMergeMetadata): Observable<string[]> {
    let request: SplitMergeRequest = {
      delete_source: delete_source,
      preview: preview,
      metadata: metadata,
      split_merge_plan: [
        this.documents.map(d => { return {document: d.id} })
      ]
    }
    return this.http.post<string[]>(`${environment.apiBaseUrl}split_merge/`, request)
  }

  getPreviewUrl(previewKey: string) {
    return `${environment.apiBaseUrl}/split_merge/${previewKey}/`
  }

}
