import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PaperlessDocument } from 'src/app/data/paperless-document';
import { DocumentListViewService } from 'src/app/services/document-list-view.service';

@Component({
  selector: 'app-document-chooser',
  templateUrl: './document-chooser.component.html',
  styleUrls: ['./document-chooser.component.scss']
})
export class DocumentChooserComponent implements OnInit {

  constructor(
    public activeModal: NgbActiveModal,
    public list: DocumentListViewService
  ) { }

  @Output()
  public confirmClicked = new EventEmitter()

  @Input()
  public single: boolean = false

  ngOnInit(): void {
    this.list.selectNone()
    this.list.activateSavedView(null)
    this.list.reload()
  }

  cancelClicked() {
    this.list.selectNone()
    this.activeModal.close()
  }

  toggleSelected(d: PaperlessDocument, event: MouseEvent): void {
    if (this.single) {
      if (!this.list.isSelected(d)) this.list.selectNone()
      this.list.toggleSelected(d)
    } else {
      if (!event.shiftKey) this.list.toggleSelected(d)
      else this.list.selectRangeTo(d)
    }
  }
}
