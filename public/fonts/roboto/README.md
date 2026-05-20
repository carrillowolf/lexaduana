# Roboto

Static TTF variants of [Roboto](https://fonts.google.com/specimen/Roboto)
(Regular / Bold / Italic / BoldItalic). Used by `lib/cbamReportGenerator.jsx`
when rendering the CBAM advisory report PDF.

Why we bundle this font: `@react-pdf/renderer`'s built-in fonts (Helvetica
et al.) only carry the WinAnsi character set, so glyphs like the subscript
`₂` in `tCO₂e`, the `Σ` summation symbol and the mathematical minus `−`
render as garbage. Roboto covers the full set we need (subscripts, Greek
capitals, accented Latin) and ships under a permissive license.

License: Apache License 2.0 (see `LICENSE.txt`). Sourced from the official
Google Fonts mirror at
https://github.com/googlefonts/roboto-2/tree/main/src/hinted .
