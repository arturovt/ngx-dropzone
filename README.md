> **Warning**

> The [`ngx-dropzone`](https://github.com/peterfreeman/ngx-dropzone) repository has been deprecated by the maintainer and no longer receives any updates.

> This repository does not introduce any new functionality or features beyond the existing implementation. However, it has upgraded Angular to the latest versions and utilizes signal inputs and outputs to ensure compatibility with zoneless change detection.

# ngx-dropzone-next

A lightweight and highly customizable Angular dropzone component for file uploads.

- ✅ Supports latest Angular
- ✅ Compatible with zoneless change detection (can be used with `provideZonelessChangeDetection`)

[![NPM](https://img.shields.io/npm/v/ngx-dropzone-next.svg)](https://www.npmjs.com/package/ngx-dropzone-next)

<img src="_images/default.png">

<img src="_images/default_dropped.png">

## Install

```sh
$ npm i ngx-dropzone-next
# Or if you are using yarn
$ yarn add ngx-dropzone-next
# Or if you using pnpm
$ pnpm i ngx-dropzone-next
```

## Usage

```ts
// app.component.ts
import { NgxDropzoneComponent, NgxDropzoneLabelDirective, NgxDropzonePreviewComponent } from 'ngx-dropzone-next';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxDropzoneComponent, NgxDropzoneLabelDirective, NgxDropzonePreviewComponent],
})
export class AppComponent {}
```

```html
<!-- app.component.html -->
<ngx-dropzone (change)="onSelect($event)">
  <ngx-dropzone-label>Drop it, baby!</ngx-dropzone-label>

  @for (file of files(); track file) {
  <ngx-dropzone-preview [removable]="true" (removed)="onRemove(file)">
    <ngx-dropzone-label>{{ file.name }} ({{ file.type }})</ngx-dropzone-label>
  </ngx-dropzone-preview>
  }
</ngx-dropzone>
```

```ts
// app.component.ts
export class AppComponent {
  readonly files = signal<File[]>([]);

  onSelect(event) {
    console.log(event);
    this.files.set([...this.files(), ...event.addedFiles]);
  }

  onRemove(event) {
    console.log(event);
    const files = this.files();
    files.splice(files.indexOf(event), 1);
    this.files.set([...files]);
  }
}
```

You can also use special preview components to preview images or videos:

```html
@for (file of files(); track file) {
<ngx-dropzone-image-preview ngProjectAs="ngx-dropzone-preview" [file]="file">
  <ngx-dropzone-label>{{ file.name }} ({{ file.type }})</ngx-dropzone-label>
</ngx-dropzone-image-preview>
}
```

```html
@for (file of files(); track file) {
<ngx-dropzone-video-preview ngProjectAs="ngx-dropzone-preview" [file]="file">
  <ngx-dropzone-label>{{ file.name }} ({{ file.type }})</ngx-dropzone-label>
</ngx-dropzone-video-preview>
}
```

## Component documentation

#### ngx-dropzone

This component is the actual dropzone container. It contains the label and any file previews.
It has an event listener for file drops and you can also click it to open the native file explorer for selection.

Use it as a stand-alone component `<ngx-dropzone></ngx-dropzone>` or by adding it as an attribute to a custom `div` (`<div class="custom-dropzone" ngx-dropzone></div>`).
It will add the classes `ngx-dz-hovered` and `ngx-dz-disabled` to its host element if necessary. You could override the styling of these effects if you like to.

This component has the following Input properties:

- `[multiple]`: Allow the selection of multiple files at once. Defaults to `true`.
- `accept`: Set the accepted file types (as for a native file element). Defaults to `'*'`. Example: `accept="image/jpeg,image/jpg,image/png,image/gif"`
- `[maxFileSize]`: Set the maximum size a single file may have, in _bytes_. Defaults to `undefined`.
- `[disabled]`: Disable any user interaction with the component. Defaults to `false`.
- `[expandable]`: Allow the dropzone container to expand vertically as the number of previewed files increases. Defaults to `false` which means that it will allow for horizontal scrolling.
- `[disableClick]`: Prevent the file selector from opening when clicking the dropzone.
- `[id], [aria-label], [aria-labelledby]`, `[aria-describedby]`: Forward the accessibility properties to the file input element.
- `[processDirectoryDrop]`: Enable extracting files from dropped directories. Defaults to `false`.

It has the following Output event:

- `(change)`: Emitted when any files were added or rejected. It returns a `NgxDropzoneChangeEvent` with the properties `source: NgxDropzoneComponent`, `addedFiles: File[]` and `rejectedFiles: RejectedFile[]`.

The `RejectedFile` extends the native File and adds an optional reason property to tell you why the file was rejected. Its value will be either `'type'` for the wrong acceptance type, `size` if it exceeds the maximum file size or `no_multiple` if multiple is set to false and more than one file is provided.

If you'd like to show the native file selector programmatically then do it as follows:

```html
<ngx-dropzone #drop />

<button (click)="drop.showFileSelector()">Open</button>
```

#### ngx-dropzone-label

This component has no attributes or methods and acts as a container for the label text using content projection.
You can place anything inside of it and the text will always be centered.

#### ngx-dropzone-preview

This component shows a basic file preview when added inside the dropzone container. The previews can be focused using the tab key and be deleted using the backspace or delete keys.

This component has the following Input properties:

- `[file]`: The dropped file to preview.
- `[removable]`: Allow the user to remove files. Required to allow keyboard interaction and show the remove badge on hover.

It has the following Output event:

- `(removed)`: Emitted when the element should be removed (either by clicking the remove badge or by pressing backspace/delete keys). Returns the file from the Input property.

The `ngx-dropzone-image-preview` and `ngx-dropzone-video-preview` components inherit from this component but expand the preview functionality to display either images or videos directly in the component.

#### ngx-dropzone-remove-badge

This component is used within the previews to remove selected files. You can use it within your own preview component implementation if you like.

## Licence

MIT © Peter Freeman
