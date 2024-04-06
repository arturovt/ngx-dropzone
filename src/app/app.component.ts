import {
  NgxDropzoneChangeEvent,
  NgxDropzoneComponent,
  NgxDropzoneImagePreviewComponent,
  NgxDropzoneLabelDirective,
  NgxDropzonePreviewComponent,
  NgxDropzoneVideoPreviewComponent,
} from 'ngx-dropzone';
import { NgFor, NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,

    NgxDropzoneComponent,
    NgxDropzoneLabelDirective,
    NgxDropzonePreviewComponent,
    NgxDropzoneVideoPreviewComponent,
    NgxDropzoneImagePreviewComponent,
  ],
})
export class AppComponent {
  readonly files = signal<File[]>([]);

  onFilesAdded(event: NgxDropzoneChangeEvent) {
    console.log('onFilesAdded: ', event);
    this.files.update((files) => [...files, ...event.addedFiles]);
  }

  onFilesRejected(event: File) {
    console.log('onFilesRejected: ', event);
  }

  onRemove(file: File) {
    console.log('onRemove: ', file);
    this.files.update((files) => {
      files.splice(files.indexOf(file), 1);
      return [...files];
    });
  }
}
