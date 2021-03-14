import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SplitMergeMetadata } from 'src/app/data/split-merge-request';
import { SplitMergeService } from 'src/app/services/split-merge.service';
import { DocumentService } from 'src/app/services/rest/document.service';
import { PaperlessDocument } from 'src/app/data/paperless-document';
import { DndDropEvent } from 'ngx-drag-drop';

@Component({
  selector: 'app-split-merge',
  templateUrl: './split-merge.component.html',
  styleUrls: ['./split-merge.component.scss']
})
export class SplitMergeComponent implements OnInit {

  onDragStart( event:DragEvent ) {
    console.log( "Drag started!", event );
  }

  onDragged(document: PaperlessDocument, documents: PaperlessDocument[]) {
    const index = this.documents.indexOf(document)
    console.log(index)
    this.documents.splice(index, 1)
  }

  onDrop(event:DndDropEvent, documents: PaperlessDocument[]) {
    console.log('onDrop', event)
    let index = event.index
    if (typeof index === "undefined") {
      index = this.documents.length
    }
    this.documents.splice(index, 0, event.data)
  }

  constructor(
    private splitMergeService: SplitMergeService,
    private documentService: DocumentService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  get documents(): PaperlessDocument[] {
    return this.splitMergeService.getDocuments()
  }

  getThumbUrl(documentId: number) {
    return this.documentService.getThumbUrl(documentId)
  }

  doIt() {
    this.splitMergeService.executeSplitMerge(false, false, SplitMergeMetadata.COPY_FIRST).subscribe(
      result => {
        console.log(result)
        // this.splitMergeService.clear()
        // this.router.navigate([""])
      }
    )
  }

}
