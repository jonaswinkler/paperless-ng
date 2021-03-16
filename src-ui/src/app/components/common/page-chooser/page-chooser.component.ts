import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PaperlessDocument } from 'src/app/data/paperless-document';
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

  @Input()
  private pages: Set<number>

  @Output()
  public confirmPages = new EventEmitter<Set<number>>()


  ngOnInit(): void {
    if (!this.pages) this.pages = new Set<number>()
  }

  cancelClicked() {
    this.activeModal.close()
  }

  confirmClicked() {
    this.confirmPages.emit(this.pages)
  }

  public afterPageRendered(pageRenderedEvent: any) {
    const pageView = pageRenderedEvent.source /* as PDFPageView */
    const div = pageView.div as HTMLDivElement
    div.onclick = () => {
      let pageID: number = parseInt(div.dataset.pageNumber)
      this.pages.has(pageID) ? this.pages.delete(pageID) : this.pages.add(pageID)
      div.classList.toggle('selected', this.pages.has(pageID))
    }
  }
}
