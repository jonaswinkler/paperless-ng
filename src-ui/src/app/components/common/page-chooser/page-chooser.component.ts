import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PaperlessDocument, PaperlessDocumentPart } from 'src/app/data/paperless-document';
import { DocumentService } from 'src/app/services/rest/document.service';

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

  private pages: number[]

  @Output()
  public confirmPages = new EventEmitter<number[]>()

  ngOnInit(): void {
    this.pages = (this.document as PaperlessDocumentPart).pages
    if (!this.pages) this.pages = []
  }

  cancelClicked() {
    this.activeModal.close()
  }

  confirmClicked() {
    this.confirmPages.emit(this.pages.sort())
  }

  public afterPageRendered(pageRenderedEvent: any) {
    const pageView = pageRenderedEvent.source /* as PDFPageView */
    const div = pageView.div as HTMLDivElement
    div.classList.toggle('selected', this.pages.indexOf(parseInt(div.dataset.pageNumber)) !== -1)
    div.onclick = () => {
      let pageID: number = parseInt(div.dataset.pageNumber)
      this.pages.indexOf(pageID) !== -1 ? this.pages.splice(this.pages.indexOf(pageID), 1) : this.pages.push(pageID)
      div.classList.toggle('selected', this.pages.indexOf(pageID) !== -1)
    }
  }
}
