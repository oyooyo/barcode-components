# barcode-components

A set of [Web Components](https://en.wikipedia.org/wiki/Web_Components) for easily adding barcodes to webpages, by simply placing HTML elements like
```
<qr-code data="https://github.com"></qr-code>
```
in the HTML/DOM.

## Usage examples

![Usage examples of barcode-components](https://oyooyo.github.io/barcode-components/examples/example_barcodes.png)

More usage examples (look at HTML code):

- [Online QR-Code Generator](https://oyooyo.github.io/barcode-components/examples/qrcode_generator.html)
- [CheatSheet for configuring the H2WB 2D Barcode Scanner](https://oyooyo.github.io/barcode-components/examples/h2wb_cheatsheet.html)
- [Example barcodes](https://oyooyo.github.io/barcode-components/examples/example_barcodes.html)

## Supported barcode types

The following barcode types are currently supported:

- QR-Code
- Code 128 _(Only code set B = Code 128B, the most commonly used code set that can encode all ASCII characters from 32 to 127)_
- Code 39
- EAN-13
- EAN-8

## Usage

### Step 1: Include the Javascript file

Add...

`<script src="https://oyooyo.github.io/barcode-components/barcode-components.min.js"></script>` _(for all available barcode types, ~24kB)_

or

`<script src="https://oyooyo.github.io/barcode-components/barcode-components-qrcode.min.js"></script>` _(for QR-Code only, ~18kB)_

or

`<script src="https://oyooyo.github.io/barcode-components/barcode-components-code128b.min.js"></script>` _(for Code 128B only, ~7kB)_

or

`<script src="https://oyooyo.github.io/barcode-components/barcode-components-code39.min.js"></script>` _(for Code 39 only, ~6kB)_

or

`<script src="https://oyooyo.github.io/barcode-components/barcode-components-ean13.min.js"></script>` _(for EAN-13 only, ~6kB)_

or

`<script src="https://oyooyo.github.io/barcode-components/barcode-components-ean8.min.js"></script>` _(for EAN-8 only, ~6kB)_

...to the script section of your HTML/DOM.

### Step 2: Place barcode elements

Place...

`<qr-code data="<Data to encode in barcode>" scale="<Scale factor>"></qr-code>` _(for QR-Code)_

or

`<code-128b data="<Data to encode in barcode>" scale="<Scale factor>"></code-128b>` _(for Code 128B)_

or

`<code-39 data="<Data to encode in barcode>" scale="<Scale factor>"></code-39>` _(for Code 39)_

or

`<ean-13 data="<Data to encode in barcode, 12 or 13 digits>" scale="<Scale factor>"></ean-13>` _(for EAN-13)_

or

`<ean-8 data="<Data to encode in barcode, 7 or 8 digits>" scale="<Scale factor>"></ean-8>` _(for EAN-8)_

...in your HTML/DOM wherever you want to show a barcode.

**Be sure to always add the closing tag** - self-closing tags _(for example `<qr-code />`)_ are not possible.

## Advanced topics

### Altering attributes

When the attributes of an existing barcode element are changed, for example by calling
```
some_barcode_element.setAttribute("data", "<new_data>");
```
in Javascript, the barcode will automatically update/re-render.

## ToDo

- Add way to specify the QR-Code error correction level
- Document undocumented configuration attributes
- Add some more configuration attributes
- Add more barcode types

## Technology and compatibility

*barcode-components* uses [Custom Elements](https://en.wikipedia.org/wiki/Web_Components#Custom_Elements) and [Shadow DOM](https://en.wikipedia.org/wiki/Web_Components#Shadow_DOM) and [should work in more or less all recent webbrowsers](https://caniuse.com/#feat=custom-elementsv1).

## Credits

The QR-Code encoder being used is a slightly modified version of [Kazuhiko Arase](https://github.com/kazuhikoarase)'s [QR-Code-Generator](https://github.com/kazuhikoarase/qrcode-generator). Basically, just the unnecessary image creation parts were removed.
