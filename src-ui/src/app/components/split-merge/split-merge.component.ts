import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SplitMergeMetadata } from 'src/app/data/split-merge-request';
import { SplitMergeService } from 'src/app/services/split-merge.service';
import { DocumentService } from 'src/app/services/rest/document.service';
import { DocumentListViewService } from 'src/app/services/document-list-view.service';
import { PaperlessDocument } from 'src/app/data/paperless-document';
import { DndDropEvent } from 'ngx-drag-drop';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentChooserComponent } from 'src/app/components/common/document-chooser/document-chooser.component'
import { PageChooserComponent } from 'src/app/components/common/page-chooser/page-chooser.component'

@Component({
  selector: 'app-split-merge',
  templateUrl: './split-merge.component.html',
  styleUrls: ['./split-merge.component.scss']
})
export class SplitMergeComponent implements OnInit, OnDestroy {

  public loading: Boolean = false
  public previewUrl: String
  public mode: String = 'merge'

  private previewDebounce$ = new Subject()

  private previewSub: Subscription

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
        this.previewUrl = undefined
      }
    })
    if (this.splitMergeService.hasDocuments()) this.previewDebounce$.next()
  }

  ngOnDestroy() {
    this.previewDebounce$.complete()
  }

  get documents(): PaperlessDocument[] {
    return this.splitMergeService.getDocuments()
  }

  get addDocumentButtonTitle(): string {
    return this.mode == 'merge' ? 'Add Documents' : 'Select Document'
  }

  get pagesInputLabel(): string {
    return this.mode == 'merge' ? 'Pages' : 'Split at'
  }

  getThumbUrl(documentId: number) {
    return this.documentService.getThumbUrl(documentId)
  }

  chooseDocuments() {
    let modal = this.modalService.open(DocumentChooserComponent, { backdrop: 'static', size: 'xl' })
    if (this.mode == 'split') modal.componentInstance.single = true
    modal.componentInstance.confirmClicked.subscribe(() => {
      modal.componentInstance.buttonsEnabled = false
      if (this.mode == 'split') this.splitMergeService.clear()
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

  onModeChange() {
    if (this.mode == 'split') this.splitMergeService.reduceDocumentsTo(1)
  }

  cancel() {
    this.splitMergeService.clear()
    this.router.navigate([""])
  }

  save(preview: boolean = false) {
    this.loading = true
    this.previewUrl = undefined
    this.splitMergeService.executeSplitMerge(preview, false, SplitMergeMetadata.COPY_FIRST).subscribe(
      result => {
        console.log('API split_merge result:', result)
        this.loading = false
        if (preview) {
          this.previewUrl = this.splitMergeService.getPreviewUrl(result[0])
        } else {
          this.splitMergeService.clear()
          this.router.navigate([""])
        }
      }
    )
  }

  duplicateDocument(d: PaperlessDocument, index: number) {
    this.splitMergeService.addDocument(d, index)
    this.previewDebounce$.next()
  }

  removeDocument(d: PaperlessDocument, index: number) {
    this.splitMergeService.removeDocument(d, index)
    this.previewDebounce$.next()
  }

  choosePages(d: PaperlessDocument, index: number) {
    let modal = this.modalService.open(PageChooserComponent, { backdrop: 'static', size: 'lg' })
    modal.componentInstance.document = d
    modal.componentInstance.confirmPages.subscribe((pages) => {
      console.log('pages chosen:', pages);
      this.splitMergeService.setDocumentPages(d, index, pages)
      modal.componentInstance.buttonsEnabled = false
      modal.close()
      this.previewDebounce$.next()
    })
  }

  pagesFieldChange(pageStr: string, d: PaperlessDocument, index: number) {
    console.log(pageStr, d, index);
    const pages: number[] = pageStr.split(',').map(p => {
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
    }).flat().filter(page => page !== null)
    this.splitMergeService.setDocumentPages(d, index, pages)
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

  pdfPreviewLoaded(event) {
    console.log('pdf preview loaded:', event);
  }
}
