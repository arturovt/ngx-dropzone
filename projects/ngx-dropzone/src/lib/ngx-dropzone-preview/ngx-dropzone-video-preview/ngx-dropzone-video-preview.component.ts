import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

import { NgxDropzonePreviewComponent } from '../ngx-dropzone-preview.component';
import { NgxDropzoneRemoveBadgeComponent } from '../ngx-dropzone-remove-badge/ngx-dropzone-remove-badge.component';

declare const ngDevMode: boolean;

const NG_DEV_MODE = typeof ngDevMode !== 'undefined' && ngDevMode;

@Component({
  selector: 'ngx-dropzone-video-preview',
  template: `
    @if (sanitizedVideoSrc(); as sanitizedVideoSrc) {
      <video controls (click)="$event.stopPropagation()">
        <source [src]="sanitizedVideoSrc" />
      </video>
    }

    <ng-content select="ngx-dropzone-label"></ng-content>

    @if (removable()) {
      <ngx-dropzone-remove-badge (click)="_remove($event)" />
    }
  `,
  styleUrls: ['./ngx-dropzone-video-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxDropzoneRemoveBadgeComponent],
  providers: [
    {
      provide: NgxDropzonePreviewComponent,
      useExisting: NgxDropzoneVideoPreviewComponent,
    },
  ],
})
export class NgxDropzoneVideoPreviewComponent
  extends NgxDropzonePreviewComponent
  implements OnInit, OnDestroy
{
  /** The video data source. */
  readonly sanitizedVideoSrc = signal<SafeUrl | undefined>(undefined);

  private videoSrc: string | null = null;

  ngOnInit() {
    const file = this.file();

    if (!file) {
      NG_DEV_MODE &&
        console.error(
          'No file to read. Please provide a file using the [file] Input property.'
        );
      return;
    }

    /**
     * We sanitize the URL here to enable the preview.
     * Please note that this could cause security issues!
     **/
    this.videoSrc = URL.createObjectURL(file);
    this.sanitizedVideoSrc.set(
      this._sanitizer.bypassSecurityTrustUrl(this.videoSrc)
    );
  }

  ngOnDestroy() {
    this.videoSrc && URL.revokeObjectURL(this.videoSrc);
  }
}
