import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SplitMergeMetadata } from 'src/app/data/split-merge-request';
import { SplitMergeService } from 'src/app/services/split-merge.service';
import { DocumentService } from 'src/app/services/rest/document.service';
import { PaperlessDocument } from 'src/app/data/paperless-document';
import { DndDropEvent } from 'ngx-drag-drop';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-split-merge',
  templateUrl: './split-merge.component.html',
  styleUrls: ['./split-merge.component.scss']
})
export class SplitMergeComponent implements OnInit, OnDestroy {

  loading: Boolean = false
  previewUrl: String

  private previewDebounce$ = new Subject()

  private previewSub: Subscription

  constructor(
    private splitMergeService: SplitMergeService,
    private documentService: DocumentService,
    private router: Router
  ) { }

  ngOnInit() {
    this.previewSub = this.previewDebounce$.pipe(
      debounceTime(400)
    ).subscribe(() => {
      this.save(true)
    })
    if (this.documents.length > 0) this.previewDebounce$.next()
  }

  ngOnDestroy() {
    this.previewDebounce$.complete()
  }

  get documents(): PaperlessDocument[] {
    return this.splitMergeService.getDocuments()
  }

  getThumbUrl(documentId: number) {
    return this.documentService.getThumbUrl(documentId)
  }

  onDragged(document: PaperlessDocument, documents: PaperlessDocument[]) {
    const index = this.documents.indexOf(document)
    this.documents.splice(index, 1)
  }

  onDrop(event:DndDropEvent, documents: PaperlessDocument[]) {
    let index = event.index
    if (typeof index === "undefined") {
      index = this.documents.length
    }
    this.documents.splice(index, 0, event.data)
    this.previewDebounce$.next()
  }

  cancel() {
    this.splitMergeService.clear()
    this.router.navigate([""])
  }

  save(preview: Boolean = false) {
    this.loading = true
    this.previewUrl = undefined
    this.splitMergeService.executeSplitMerge(preview, false, SplitMergeMetadata.COPY_FIRST).subscribe(
      result => {
        console.log(result)
        this.loading = false
        this.previewUrl = this.splitMergeService.getPreviewUrl(result[0])
        // this.splitMergeService.clear()
        // this.router.navigate([""])
      }
    )
  }

  pdfPreviewLoaded(event) {
    console.log(event);

  }
}
