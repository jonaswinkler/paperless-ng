import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SplitMergeMetadata } from 'src/app/data/split-merge-request';
import { SplitMergeService } from 'src/app/services/split-merge.service';
import { DocumentService } from 'src/app/services/rest/document.service';
import { DocumentListViewService } from 'src/app/services/document-list-view.service';
import { PaperlessDocument, PaperlessDocumentPart } from 'src/app/data/paperless-document';
import { DndDropEvent } from 'ngx-drag-drop';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentChooserComponent } from 'src/app/components/common/document-chooser/document-chooser.component'
import { PageChooserComponent } from 'src/app/components/common/page-chooser/page-chooser.component'
import { PDFDocumentProxy } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-split-merge',
  templateUrl: './split-merge.component.html',
  styleUrls: ['./split-merge.component.scss']
})
export class SplitMergeComponent implements OnInit, OnDestroy {

  public loading: boolean = false

  public previewUrls: string[] = []
  public previewNumPages: number[] = []
  public previewCurrentPages: number[] = []

  public delete_source_documents: boolean = false

  public metadata_setting: SplitMergeMetadata = SplitMergeMetadata.COPY_FIRST

  private previewDebounce$ = new Subject()

  private previewSub: Subscription

  public error: string

  constructor(
    public splitMergeService: SplitMergeService,
    private documentService: DocumentService,
    private list: DocumentListViewService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.previewSub = this.previewDebounce$.pipe(
      debounceTime(400)
    ).subscribe(() => {
      if (this.splitMergeService.hasDocuments()) {
        this.save(true)
      } else {
        this.previewUrls = []
        this.error = undefined
      }
    })
    this.previewDebounce$.next()
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

  get splitMergeMetadata() {
    return SplitMergeMetadata
  }

  chooseDocuments() {
    let modal = this.modalService.open(DocumentChooserComponent, { backdrop: 'static', size: 'xl' })
    modal.componentInstance.confirmClicked.subscribe(() => {
      modal.componentInstance.buttonsEnabled = false
      this.splitMergeService.addDocuments(this.list.selectedDocuments)
      this.list.selectNone()
      modal.close()
      this.previewDebounce$.next()
    })
  }

  onDragged(document: PaperlessDocument, documents: PaperlessDocument[]) {
    const index = this.documents.indexOf(document)
    this.documents.splice(index, 1)
  }

  onDrop(event: DndDropEvent, documents: PaperlessDocument[]) {
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

  save(preview: boolean = false) {
    this.loading = true
    this.previewUrls = []
    this.splitMergeService.executeSplitMerge(preview, this.delete_source_documents, this.metadata_setting).subscribe(
      result => {
        this.loading = false
        this.error = undefined
        if (preview) {
          this.previewUrls = result.map(r => this.splitMergeService.getPreviewUrl(r))
        } else {
          this.splitMergeService.clear()
          this.router.navigate([""])
        }
      },
      error => {
        this.error = error
        this.loading = false
      }
    )
  }

  removeDocument(d: PaperlessDocument, index: number) {
    this.splitMergeService.removeDocument(d, index)
    this.previewNumPages[index] = this.previewCurrentPages[index] = undefined
    this.previewDebounce$.next()
  }

  choosePages(d: PaperlessDocument, index: number) {
    let modal = this.modalService.open(PageChooserComponent, { backdrop: 'static', size: 'lg' })
    modal.componentInstance.document = d
    modal.componentInstance.confirmPages.subscribe((pages) => {
      this.splitMergeService.setDocumentPages(d, index, pages)
      modal.componentInstance.buttonsEnabled = false
      modal.close()
      this.previewDebounce$.next()
    })
  }

  chooseSplit(d: PaperlessDocument, index: number) {
    let modal = this.modalService.open(PageChooserComponent, { backdrop: 'static', size: 'lg' })
    modal.componentInstance.document = d
    const enabledPages = (d as PaperlessDocumentPart).pages
    modal.componentInstance.splitting = true
    modal.componentInstance.confirmPages.subscribe((pages) => {
      this.splitMergeService.splitDocument(d, index, pages, enabledPages)
      modal.componentInstance.buttonsEnabled = false
      modal.close()
      this.previewDebounce$.next()
    })
  }

  pagesFieldChange(pageStr: string, d: PaperlessDocument, index: number) {
    let pages = pageStr.split(',').map(p => {
      if (p.indexOf('-') !== -1) {
        const minmax = p.split('-')
        let range = []
        for (let i = parseInt(minmax[0]); i <= parseInt(minmax[1]); i++) {
          range.push(i)
        }
        return range
      } else if (p.length > 0) {
        return parseInt(p)
      } else {
        return null
      }
    })
    pages = [].concat.apply([], pages) // e.g. flat()
    pages = pages.filter(page => page !== null)
    this.splitMergeService.setDocumentPages(d, index, pages as number[])
    this.previewDebounce$.next()
  }

  formatPages(pages: number[]): string {
    let pageStrings = []
    let rangeStart, rangeEnd

    pages?.forEach(page => {
      if (rangeStart == undefined) {
        rangeStart = page
      } else if (page - rangeStart == 1) {
        rangeEnd = page
      } else if (rangeEnd !== undefined && page - rangeEnd == 1) {
        rangeEnd = page
      } else {
        pageStrings.push(rangeEnd !== undefined ? rangeStart + '-' + rangeEnd : rangeStart)
        rangeStart = page
        rangeEnd = undefined
      }
    })

    if (rangeEnd !== undefined) {
      pageStrings.push(rangeStart + '-' + rangeEnd)
    } else if (rangeStart !== undefined) {
      pageStrings.push(rangeStart)
    }
    return pageStrings.join(',')
  }

  pdfPreviewLoaded(pdf: PDFDocumentProxy, index: number) {
    this.previewNumPages[index] = pdf.numPages
  }

  pdfPageRendered(event: any, index) { // CustomEvent is es6
    if (event.pageNumber > 0 && this.previewCurrentPages[index] == undefined) this.previewCurrentPages[index] = 1
  }
}
