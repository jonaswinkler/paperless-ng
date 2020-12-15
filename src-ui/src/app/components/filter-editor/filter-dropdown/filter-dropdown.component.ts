import { Component, EventEmitter, Input, Output, ElementRef, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { Results } from 'src/app/data/results';
import { ObjectWithId } from 'src/app/data/object-with-id';
import { FilterPipe } from  'src/app/pipes/filter.pipe';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-filter-dropdown',
  templateUrl: './filter-dropdown.component.html',
  styleUrls: ['./filter-dropdown.component.scss']
})
export class FilterDropdownComponent {

  @Input()
  set items(items: ObjectWithId[]) {
    this._items = items
    this.onItemsSet(items)
  }

  get items(): ObjectWithId[] {
    return this._items
  }

  @Input()
  itemsSelected: ObjectWithId[]

  _items: ObjectWithId[]
  title: string
  icon: string

  @Output()
  toggle = new EventEmitter()

  @ViewChild('listFilterTextInput') listFilterTextInput: ElementRef
  @ViewChild('filterDropdown') filterDropdown: NgbDropdown

  filterText: string

  constructor(private filterPipe: FilterPipe) { }

  onItemsSet(items: ObjectWithId[]): void { // like a constructor once items are set
    if (items && items.length > 0) {
      let item = items[0]

      if ('is_inbox_tag' in item) { // ~ item instanceof PaperlessTag
          this.title = 'Tags'
          this.icon = 'tag-fill'
      } else if ('last_correspondence' in item) { // ~ item instanceof PaperlessCorrespondent
          this.title = 'Correspondents'
          this.icon = 'person-fill'
      } else { // else this.item is PaperlessDocumentType
          this.title = 'Document Types'
          this.icon = 'file-earmark-fill'
      }
    }
  }

  toggleItem(item: ObjectWithId): void {
    this.toggle.emit(item)
  }

  isItemSelected(item: ObjectWithId): boolean {
    return this.itemsSelected?.find(i => i.id == item.id) !== undefined
  }

  dropdownOpenChange(open: boolean): void {
    if (open) {
      setTimeout(() => {
        this.listFilterTextInput.nativeElement.focus();
      }, 0);
    } else {
      this.filterText = ''
    }
  }

  listFilterEnter(): void {
    let filtered = this.filterPipe.transform(this.items, this.filterText)
    if (filtered.length == 1) this.toggleItem(filtered.shift())
    this.filterDropdown.close()
  }
}
