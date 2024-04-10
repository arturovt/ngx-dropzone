import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { coerceBooleanProperty, coerceNumberProperty } from '../coercion';
import { NgxDropzonePreviewComponent } from '../ngx-dropzone-preview/ngx-dropzone-preview.component';
import { NgxDropzoneService, RejectedFile } from '../ngx-dropzone.service';
import { isPlatformBrowser, unpatchedFromEvent } from '../utils';

declare const ngDevMode: boolean;

const NG_DEV_MODE = typeof ngDevMode !== 'undefined' && ngDevMode;

export interface NgxDropzoneChangeEvent {
  source: NgxDropzoneComponent;
  addedFiles: File[];
  rejectedFiles: RejectedFile[];
}

@Component({
  selector: 'ngx-dropzone, [ngx-dropzone]',
  templateUrl: './ngx-dropzone.component.html',
  styleUrls: ['./ngx-dropzone.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    '[class.ngx-dz-disabled]': 'disabled()',
    '[class.ngx-dz-hovered]': '_isHovered()',
    '[class.unclickable]': 'disableClick()',
    '[class.expandable]': 'expandable()',
  },
})
export class NgxDropzoneComponent implements OnChanges {
  private readonly _service = inject(NgxDropzoneService);

  /** A list of the content-projected preview children. */
  readonly _previewChildren = contentChildren(NgxDropzonePreviewComponent, {
    descendants: true,
  });

  readonly _hasPreviews = computed(() => !!this._previewChildren().length);

  /** A template reference to the native file input element. */
  readonly _fileInput =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /** Emitted when any files were added or rejected. */
  readonly change = output<NgxDropzoneChangeEvent>();

  /** Set the accepted file types. Defaults to '*'. */
  readonly accept = input('*');

  /** Disable any user interaction with the component. */
  readonly disabled = input(false, { transform: coerceBooleanProperty });

  /** Allow the selection of multiple files. */
  readonly multiple = input(true, { transform: coerceBooleanProperty });

  /** Set the maximum size a single file may have. */
  readonly maxFileSize = input(0, {
    transform: coerceNumberProperty,
  });

  /** Allow the dropzone container to expand vertically. */
  readonly expandable = input(false, { transform: coerceBooleanProperty });

  /** Open the file selector on click. */
  readonly disableClick = input(false, { transform: coerceBooleanProperty });

  /** Allow dropping directories. */
  readonly processDirectoryDrop = input(false, {
    transform: coerceBooleanProperty,
  });

  /** Expose the id, aria-label, aria-labelledby and aria-describedby of the native file input for proper accessibility. */
  readonly id = input('');
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly ariaLabelledby = input('', { alias: 'aria-labelledby' });
  readonly ariaDescribedBy = input('', { alias: 'aria-describedby' });

  readonly _isHovered = signal(false);

  constructor() {
    if (isPlatformBrowser()) {
      this._setupEventListeners();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && this._isHovered()) {
      this._isHovered.set(false);
    }
  }

  showFileSelector() {
    if (!this.disabled()) {
      this._fileInput().nativeElement.click();
    }
  }

  protected _onFilesSelected(event: Event) {
    const fileInput = <HTMLInputElement>event.target;
    const files = fileInput.files!;

    this._handleFileDrop(files);

    // Reset the native file input element to allow selecting the same file again
    fileInput.value = '';

    // fix(#32): Prevent the default event behaviour which caused the change event to emit twice.
    this._preventDefault(event);
  }

  private _handleFileDrop(files: FileList): void {
    const result = this._service.parseFileList(
      files,
      this.accept(),
      this.maxFileSize(),
      this.multiple()
    );

    this.change.emit({
      addedFiles: result.addedFiles,
      rejectedFiles: result.rejectedFiles,
      source: this,
    });
  }

  private _preventDefault(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  private _setupEventListeners(): void {
    const { nativeElement } = inject(ElementRef);

    /** Show the native OS file explorer to select files. */
    unpatchedFromEvent(nativeElement, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.disableClick()) {
          this.showFileSelector();
        }
      });

    unpatchedFromEvent<DragEvent>(nativeElement, 'dragover')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (this.disabled()) {
          return;
        }

        this._preventDefault(event);
        this._isHovered.set(true);
      });

    unpatchedFromEvent(nativeElement, 'dragleave')
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this._isHovered.set(false);
      });

    unpatchedFromEvent<DragEvent>(nativeElement, 'drop')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (this.disabled()) {
          return;
        }

        this._preventDefault(event);
        this._isHovered.set(false);

        // If `processDirectoryDrop` is not enabled or `webkitGetAsEntry` is not
        // supported, we handle the drop as usual.
        if (
          !this.processDirectoryDrop ||
          !globalThis.DataTransferItem?.prototype.webkitGetAsEntry
        ) {
          this._handleFileDrop(event.dataTransfer!.files);
          return;
        }

        const droppedItems: DataTransferItemList = event.dataTransfer!.items;

        if (droppedItems.length === 0) {
          return;
        }

        const droppedFiles: File[] = [];
        const droppedDirectories: FileSystemDirectoryEntry[] = [];

        // Separate dropped files from dropped directories for easier handling.
        for (let i = 0; i < droppedItems.length; i++) {
          const entry = droppedItems[i].webkitGetAsEntry();
          if (!entry) continue;
          if (entry.isFile) {
            droppedFiles.push(event.dataTransfer!.files[i]);
          } else if (entry.isDirectory) {
            droppedDirectories.push(<FileSystemDirectoryEntry>entry);
          }
        }

        // Create a DataTransfer
        const droppedFilesList = new DataTransfer();
        droppedFiles.forEach((droppedFile) =>
          droppedFilesList.items.add(droppedFile)
        );

        const noDroppedDirectories = droppedDirectories.length === 0;

        // If no directory is dropped we are done and can call handleFileDrop
        if (noDroppedDirectories && droppedFilesList.items.length) {
          this._handleFileDrop(droppedFilesList.files);
        }

        if (noDroppedDirectories) {
          return;
        }

        // if directories are dropped we extract the files from these directories
        // one-by-one and add it to droppedFilesList.
        const extractFilesFromDirectoryCalls: Promise<unknown>[] = [];

        for (const droppedDirectory of droppedDirectories) {
          extractFilesFromDirectoryCalls.push(
            extractFilesFromDirectory(droppedDirectory)
          );
        }

        // wait for all directories to be proccessed to add the extracted files afterwards
        Promise.all(extractFilesFromDirectoryCalls).then(
          (allExtractedFiles: any[]) => {
            allExtractedFiles
              .reduce((a, b) => [...a, ...b])
              .forEach((extractedFile: File) => {
                droppedFilesList.items.add(extractedFile);
              });

            this._handleFileDrop(droppedFilesList.files);
          }
        );
      });
  }
}

function extractFilesFromDirectory(directory: FileSystemDirectoryEntry) {
  return new Promise((resolve) => {
    const files: File[] = [];

    const dirReader = directory.createReader();

    // we need this to be a recursion because of this issue: https://bugs.chromium.org/p/chromium/issues/detail?id=514087
    const readEntries = () => {
      dirReader.readEntries(async (dirItems) => {
        if (!dirItems.length) {
          resolve(files);
        } else {
          const fileEntries = dirItems.filter((dirItem) => dirItem.isFile);

          for (const fileEntry of fileEntries) {
            const file = await getFileFromFileEntry(fileEntry);
            if (file) {
              files.push(file);
            }
          }

          readEntries();
        }
      });
    };
    readEntries();
  });
}

async function getFileFromFileEntry(fileEntry: FileSystemEntry) {
  try {
    return await new Promise<File>((resolve, reject) =>
      (<any>fileEntry).file(resolve, reject)
    );
  } catch (err) {
    NG_DEV_MODE && console.log('Error converting a fileEntry to a File: ', err);
    return undefined;
  }
}
