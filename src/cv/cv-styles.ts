export const cvStyles = `
  @page {
    size: A4;
    margin: 12mm 14mm 13mm;
  }

  :root {
    color-scheme: light;
    font-family: Georgia, "Times New Roman", serif;
    color: #202226;
    background: #ffffff;
    font-size: 9.5pt;
    line-height: 1.34;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  @media screen {
    html {
      background: #ffffff;
    }

    body {
      width: 210mm;
      min-height: 297mm;
      padding: 12mm 14mm 13mm;
    }
  }

  h1,
  h2,
  h3,
  p,
  ul {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 2.5mm;
    font-family: "Avenir Next", Avenir, Helvetica, Arial, sans-serif;
    font-size: 24pt;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.055em;
    text-transform: uppercase;
  }

  h1 + p {
    margin-bottom: 6mm;
    padding-bottom: 3.5mm;
    border-bottom: 1.5pt double #484d55;
    font-family: "Avenir Next", Avenir, Helvetica, Arial, sans-serif;
    color: #4f545c;
    font-size: 8.8pt;
    line-height: 1.45;
  }

  h1 + p strong {
    color: #202226;
    font-size: 10.5pt;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  h2 {
    margin: 5mm 0 2.3mm;
    padding-bottom: 1mm;
    border-bottom: 0.5pt solid #9b9da1;
    break-after: avoid;
    font-family: "Avenir Next", Avenir, Helvetica, Arial, sans-serif;
    font-size: 10pt;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  h3 {
    margin: 3.5mm 0 0.8mm;
    break-after: avoid;
    font-family: "Avenir Next", Avenir, Helvetica, Arial, sans-serif;
    font-size: 10pt;
    font-weight: 600;
    line-height: 1.25;
  }

  p {
    margin-bottom: 2.2mm;
    orphans: 3;
    widows: 3;
  }

  h2 + p,
  h3 + p {
    break-before: avoid;
  }

  h3 + p {
    margin-bottom: 1.4mm;
  }

  h3 + p em,
  p > em:only-child {
    color: #5d6269;
    font-size: 8.7pt;
  }

  ul {
    margin-bottom: 2.7mm;
    padding-left: 4.5mm;
  }

  li {
    margin-bottom: 0.8mm;
    padding-left: 0.8mm;
    orphans: 2;
    widows: 2;
  }

  li::marker {
    color: #61666d;
    font-size: 0.75em;
  }

  strong {
    font-weight: 700;
  }

  a {
    color: inherit;
    text-decoration-color: #73777d;
    text-decoration-thickness: 0.6pt;
    text-underline-offset: 1.5pt;
  }

  hr {
    display: none;
  }

  @media print {
    a {
      text-decoration: none;
    }
  }
`;
