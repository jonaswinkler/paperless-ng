import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { PaperlessDocument, PaperlessDocumentPart, PaperlessDocumentSeparator } from '../data/paperless-document';
import { SplitMergeMetadata, SplitMergeRequest } from '../data/split-merge-request';

@Injectable({
  providedIn: 'root'
})
export class SplitMergeService {

  // this also needs to incorporate pages, if we want to support that.
  private documents: PaperlessDocument[] = []

  constructor(private http: HttpClient) { }

  addDocument(document: PaperlessDocument, atIndex?: number) {
    if (atIndex !== undefined) this.documents.splice(atIndex, 0, document)
    else this.documents.push(document)
  }

  addDocuments(documents: PaperlessDocument[]) {
    this.documents = this.documents.concat(documents)
  }

  removeDocument(document: PaperlessDocument, atIndex?: number) {
    if (!atIndex) atIndex = this.documents.indexOf(document)
    this.documents.splice(atIndex, 1)
    if (this.documents.length > 0 && (this.documents[this.documents.length - 1] as PaperlessDocumentSeparator).is_separator) {
      this.documents.pop()
    } else if (this.documents.length > 0 && (this.documents[0] as PaperlessDocumentSeparator).is_separator) {
      this.documents.shift()
    }
  }

  getDocuments() {
    return this.documents
  }

  hasDocuments(): boolean {
    return this.documents.length > 0
  }

  clear() {
    this.documents = []
  }

  setDocumentPages(d: PaperlessDocument, index: number, pages: number[]) {
    (this.documents[index] as PaperlessDocumentPart).pages = pages.length > 0 ? pages : null
  }

  splitDocument(d: PaperlessDocument, index: number, secondPages: number[], enabledPages?: number[]) {
    const firstPages = []
    for (let page = 1; page < secondPages[0]; page++) {
      if (!enabledPages || (enabledPages?.length && enabledPages.indexOf(page) !== -1)) firstPages.push(page)
    }
    (this.documents[index] as PaperlessDocumentPart).pages = firstPages
    this.documents.splice(index + 1, 0, { is_separator: true } as PaperlessDocumentSeparator)
    let d2 = { ...d } as PaperlessDocumentPart
    d2.pages = secondPages
    this.documents.splice(index + 2, 0, d2)
  }

  executeSplitMerge(preview: boolean, delete_source: boolean, metadata: SplitMergeMetadata): Observable<string[]> {
    let currentDocument = []
    let split_merge_plan = [currentDocument]
    this.documents.forEach(d => {
      if ((d as PaperlessDocumentSeparator).is_separator) {
        currentDocument = []
        split_merge_plan.push(currentDocument)
      } else {
        currentDocument.push({document: d.id, pages: (d as PaperlessDocumentPart).pages?.join(',')})
      }
    })

    let request: SplitMergeRequest = {
      delete_source: delete_source,
      preview: preview,
      metadata: metadata,
      split_merge_plan: split_merge_plan
    }
    return this.http.post<string[]>(`${environment.apiBaseUrl}split_merge/`, request).pipe(
      catchError(this.handleError)
    )
  }

  handleError(error: HttpErrorResponse) {
    console.log('API split_merge result error:', error)
    return throwError(error.message)
  }

  getPreviewUrl(previewKey: string) {
    return `${environment.apiBaseUrl}split_merge/${previewKey}/`
  }

}
