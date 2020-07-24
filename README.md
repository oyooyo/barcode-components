# barcode-components

A set of [Web Components](https://en.wikipedia.org/wiki/Web_Components) for easily adding barcodes to webpages, by simply placing HTML elements like
```
<qr-code data="https://github.com"></qr-code>
```
in the HTML/DOM.

## Supported barcode types

The following barcode types are currently supported:

- QR-Code
- Code 128 _(Only code set B = Code 128B, the most commonly used code set that can encode all ASCII characters from 32 to 127)_
- Code 39

## Usage

### Step 1: Include the Javascript file

Add...

`<script src="https://" integrity="sha384-UdIDANN9wPxUwDIG4och2Zl1fJTTJKA1E5voYg/AzpP5VYgDRVM8pXbt0zptGRwl"></script>` _(for QR-Code)_

or

`<script src="https://" integrity="sha384-w4vj6Msjq+tZa8QpQhz+N8hkGVKgv1aqsry5+YMXwVI1omIDpueJM17x4tgYidjn"></script>` _(for Code 128B)_

or

`<script src="https://" integrity="sha384-ztITJusve9zxl/+AaEjCwJFwrp0AdFj62L4cmtG5jSPxM6qToppgUw6Di9dNdO/m"></script>` _(for Code 39)_

...to the script section of your HTML/DOM.

### Step 2: Place barcode elements

Place...

`<qr-code data="<Data to encode in barcode>" scale="<Scale factor>"></qr-code>` _(for QR-Code)_

or

`<code-128b data="<Data to encode in barcode>" scale="<Scale factor>"></code-128b>` _(for Code 128 Set B)_

or

`<code-39 data="<Data to encode in barcode>" scale="<Scale factor>"></code-39>` _(for Code-39)_

...in your HTML/DOM wherever you want to show a barcode.

**Be sure to always add the closing tag** - self-closing tags _(for example `<qr-code />`)_ are not possible.

## Usage examples

- (Online QR-Code Creator)[https://]
- (CheatSheet for configuring the H2WB 2D Barcode Scanner)[https://]

## Advanced topics

### Altering attributes

When the attributes of an existing barcode element are changed, for example by calling
```
some_barcode_element.setAttribute("data", "<new_data>");
```
in Javascript, the barcode will automatically update/re-render.

## Technology and compatibility

*barcode-components* uses [Custom Elements](https://en.wikipedia.org/wiki/Web_Components#Custom_Elements) and [Shadow DOM](https://en.wikipedia.org/wiki/Web_Components#Shadow_DOM) and [should work in more or less all recent webbrowsers](https://caniuse.com/#feat=custom-elementsv1).

## Credits

The QR-Code encoder being used is a slightly modified version of Kazuhiko Arase's [QR-Code-Generator](https://github.com/kazuhikoarase/qrcode-generator). Basically, just the unnecessary image creation parts were removed.
