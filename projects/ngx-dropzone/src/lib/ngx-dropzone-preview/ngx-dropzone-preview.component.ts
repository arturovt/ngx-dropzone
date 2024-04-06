import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  inject,
  input,
  NgZone,
  output,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { fromEvent, Observable, Subscription } from 'rxjs';

import { coerceBooleanProperty } from '../helpers';

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

  protected _ngZone = inject(NgZone);
  protected _sanitizer = inject(DomSanitizer);

  @HostListener('keyup', ['$event'])
  keyEvent({ keyCode }: KeyboardEvent) {
    if (keyCode === KeyCode.Backspace || keyCode === KeyCode.Delete) {
      this.remove();
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

      const subscription = new Subscription();

      this._ngZone.runOutsideAngular(() => {
        subscription.add(
          fromEvent(reader, 'load').subscribe(() => {
            subscriber.next(reader.result!);
            subscriber.complete();
          })
        );

        subscription.add(
          fromEvent(reader, 'error').subscribe((error) => {
            if (NG_DEV_MODE) {
              console.error(`FileReader failed on file ${this.file.name}.`);
            }

            subscriber.error(error);
          })
        );
      });

      reader.readAsDataURL(file);

      return subscription;
    });
  }
}
