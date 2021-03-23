import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PaperlessDocument, PaperlessDocumentPart } from 'src/app/data/paperless-document';
import { DocumentService } from 'src/app/services/rest/document.service';
import { PDFDocumentProxy } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-page-chooser',
  templateUrl: './page-chooser.component.html',
  styleUrls: ['./page-chooser.component.scss']
})
export class PageChooserComponent implements OnInit {

  constructor(
    public activeModal: NgbActiveModal,
    private documentService: DocumentService
  ) { }

  get previewUrl(): string {
    return this.documentService.getPreviewUrl(this.document.id)
  }

  @Input()
  document: PaperlessDocument

  @Input()
  splitting: boolean = false

  private pages: number[]
  private nPages: number

  @Output()
  public confirmPages = new EventEmitter<number[]>()

  get title(): string {
    return this.splitting ? 'Select Split' : 'Select Pages'
  }

  ngOnInit(): void {
    this.pages = (this.document as PaperlessDocumentPart).pages
    if (!this.pages) this.pages = []
  }

  cancelClicked() {
    this.activeModal.close()
  }

  confirmClicked() {
    if (this.splitting) {
      // we need pages as the full range since we wont know length of document later
      const startPage = this.pages.pop()
      for (let page = startPage + 1; page <= this.nPages; page++) {
        this.pages.push(page)
      }
    }
    this.confirmPages.emit(this.pages.sort((a, b) => { return a - b }))
  }

  pdfLoaded(pdf: PDFDocumentProxy) {
    this.nPages = pdf.numPages
  }

  public afterPageRendered(pageRenderedEvent: any) {
    const pageView = pageRenderedEvent.source /* as PDFPageView */
    const div = pageView.div as HTMLDivElement
    div.classList.toggle('selected', this.pages.indexOf(parseInt(div.dataset.pageNumber)) !== -1)
    div.onclick = () => {
      let pageID: number = parseInt(div.dataset.pageNumber)
      if (this.splitting) { // only select 1 page
        if (pageID == this.nPages) return
        this.pages = [pageID]
        div.parentNode.childNodes.forEach(pageEl => {
          (pageEl as Element).classList.toggle('selected', false)
        })
        div.classList.toggle('selected', true)
      } else {
        this.pages.indexOf(pageID) !== -1 ? this.pages.splice(this.pages.indexOf(pageID), 1) : this.pages.push(pageID)
        div.classList.toggle('selected', this.pages.indexOf(pageID) !== -1)
      }
    }
  }
}
