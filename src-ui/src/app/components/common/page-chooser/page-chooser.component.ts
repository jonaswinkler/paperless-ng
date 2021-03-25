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

  public pages: number[]

  public enabledPages: number[]

  private nPages: number

  @Output()
  public confirmPages = new EventEmitter<number[]>()

  get title(): string {
    return this.splitting ? 'Select Split' : 'Select Pages'
  }

  ngOnInit(): void {
    this.pages = (this.document as PaperlessDocumentPart).pages
    if (this.splitting && this.pages?.length) this.enabledPages = this.pages.concat([])
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
        if (!this.enabledPages || (this.enabledPages && this.enabledPages.indexOf(page) !== -1)) this.pages.push(page)
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
    if (this.splitting && this.enabledPages?.length) {
      div.classList.toggle('disabled', this.enabledPages.indexOf(parseInt(div.dataset.pageNumber)) == -1)
    } else {
      div.classList.toggle('selected', this.pages.indexOf(parseInt(div.dataset.pageNumber)) !== -1)
    }
    div.onclick = () => {
      let pageNum: number = parseInt(div.dataset.pageNumber)
      if (this.splitting) { // only select 1 page
        if (pageNum == this.nPages || (this.enabledPages?.length && pageNum == Math.max(...this.enabledPages))) return
        this.pages = [pageNum]
        div.parentNode.childNodes.forEach(pageEl => {
          (pageEl as Element).classList.toggle('selected', false)
        })
        div.classList.toggle('selected', true)
      } else {
        this.pages.indexOf(pageNum) !== -1 ? this.pages.splice(this.pages.indexOf(pageNum), 1) : this.pages.push(pageNum)
        div.classList.toggle('selected', this.pages.indexOf(pageNum) !== -1)
      }
    }
  }
}
