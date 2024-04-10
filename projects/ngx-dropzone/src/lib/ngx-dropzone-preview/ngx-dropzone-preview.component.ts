import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Observable, race } from 'rxjs';

import { coerceBooleanProperty } from '../coercion';
import { isPlatformBrowser, unpatchedFromEvent } from '../utils';

import { NgxDropzoneRemoveBadgeComponent } from './ngx-dropzone-remove-badge/ngx-dropzone-remove-badge.component';

const enum KeyCode {
  Backspace = 8,
  Delete = 46,
}

declare const ngDevMode: boolean;

const NG_DEV_MODE = typeof ngDevMode !== 'undefined' && ngDevMode;

@Component({
  selector: 'ngx-dropzone-preview',
  template: `
    <ng-content select="ngx-dropzone-label"></ng-content>
    @if (removable()) {
      <ngx-dropzone-remove-badge (click)="_remove($event)" />
    }
  `,
  styleUrls: ['./ngx-dropzone-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxDropzoneRemoveBadgeComponent],
})
export class NgxDropzonePreviewComponent {
  /** The file to preview. */
  readonly file = input<File>();

  /** Allow the user to remove files. */
  readonly removable = input(false, { transform: coerceBooleanProperty });

  /** Emitted when the element should be removed. */
  readonly removed = output<File>();

  protected _sanitizer = inject(DomSanitizer);

  constructor() {
    if (isPlatformBrowser()) {
      const { nativeElement } = inject(ElementRef);

      unpatchedFromEvent<KeyboardEvent>(nativeElement, 'keyup')
        .pipe(takeUntilDestroyed())
        .subscribe(({ keyCode }) => {
          if (keyCode === KeyCode.Backspace || keyCode === KeyCode.Delete) {
            this.remove();
          }
        });
    }
  }

  /** We use the HostBinding to pass these common styles to child components. */
  @HostBinding('style')
  get hostStyle(): SafeStyle {
    const styles = `
			display: flex;
			height: 140px;
			min-height: 140px;
			min-width: 180px;
			max-width: 180px;
			justify-content: center;
			align-items: center;
			padding: 0 20px;
			margin: 10px;
			border-radius: 5px;
			position: relative;
		`;

    return this._sanitizer.bypassSecurityTrustStyle(styles);
  }

  /** Make the preview item focusable using the tab key. */
  @HostBinding('tabindex') tabIndex = 0;

  /** Remove method to be used from the template. */
  _remove(event: MouseEvent): void {
    event.stopPropagation();
    this.remove();
  }

  /** Remove the preview item (use from component code). */
  remove(): void {
    if (this.removable()) {
      this.removed.emit(this.file()!);
    }
  }

  protected _readFile(file: File | undefined) {
    return new Observable<string | ArrayBuffer>((subscriber) => {
      if (!file) {
        subscriber.error(
          'No file to read. Please provide a file using the [file] Input property.'
        );

        return;
      }

      const reader = new FileReader();

      const subscription = race(
        unpatchedFromEvent(reader, 'load'),
        unpatchedFromEvent(reader, 'error')
      ).subscribe((event) => {
        if (event.type === 'load') {
          subscriber.next(reader.result!);
          subscriber.complete();
        } else {
          if (NG_DEV_MODE) {
            console.error(`FileReader failed on file ${this.file.name}.`);
          }

          subscriber.error(event);
        }
      });

      reader.readAsDataURL(file);

      return subscription;
    });
  }
}
