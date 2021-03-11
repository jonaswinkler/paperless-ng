import { Component, OnInit } from '@angular/core';
import { SplitMergeMetadata } from 'src/app/data/split-merge-request';
import { SplitMergeService } from 'src/app/services/split-merge.service';

@Component({
  selector: 'app-split-merge',
  templateUrl: './split-merge.component.html',
  styleUrls: ['./split-merge.component.scss']
})
export class SplitMergeComponent implements OnInit {

  constructor(private splitMergeService: SplitMergeService) { }

  ngOnInit(): void {
  }

  get documents() {
    return this.splitMergeService.getDocuments()
  }

  doIt() {
    this.splitMergeService.executeSplitMerge(false, false, SplitMergeMetadata.COPY_FIRST).subscribe(
      result => {
        console.log(result)
      }
    )
  }

}
