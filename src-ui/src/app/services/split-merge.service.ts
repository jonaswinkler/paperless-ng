import { Injectable } from '@angular/core';
import { PaperlessDocument } from '../data/paperless-document';

@Injectable({
  providedIn: 'root'
})
export class SplitMergeService {

  private documents: PaperlessDocument[] = []

  constructor() { }

  addDocument(document: PaperlessDocument) {
    this.documents.push(document)
  }

  hasDocuments(): boolean {
    return this.documents.length > 0
  }
}
