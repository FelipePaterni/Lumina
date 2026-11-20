import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { inflateSync } from "node:zlib";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import test from "node:test";
import { WatermarkProcessingError, WatermarkService } from "../../../apps/api/dist/modules/watermark/watermark.service.js";

function createEpub() {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
  );
  zip.file(
    "OEBPS/content.opf",
    '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata/><manifest><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>',
  );
  zip.file("OEBPS/chapter.xhtml", "<html><body>Texto original sintético</body></html>");
  return zip.generateAsync({ type: "uint8array" });
}

test("PDF copy visibly watermarks and records name, email, and purchase id", async () => {
  const original = await PDFDocument.create();
  original.addPage([612, 792]).drawText("Conteúdo original sintético");
  const originalBytes = await original.save();
  const watermark = new WatermarkService();
  const copy = await watermark.personalize(originalBytes, "application/pdf", {
    name: "João Cliente",
    email: "joao@example.invalid",
    purchaseId: "order-synthetic-017",
  });

  assert.equal(copy.extension, "pdf");
  assert.equal(copy.mimeType, "application/pdf");
  assert.notDeepEqual(Buffer.from(copy.content), Buffer.from(originalBytes));
  const document = await PDFDocument.load(copy.content);
  const keywords = document.getKeywords();
  assert.match(keywords, /João Cliente/);
  assert.match(keywords, /joao@example\.invalid/);
  assert.match(keywords, /order-synthetic-017/);
  assert.equal(document.getPageCount(), 1);
  const bytes = Buffer.from(copy.content);
  const decodedStreams = [];
  let searchFrom = 0;
  while (searchFrom < bytes.length) {
    const streamStart = bytes.indexOf(Buffer.from("stream\n"), searchFrom);
    if (streamStart < 0) break;
    const contentStart = streamStart + Buffer.byteLength("stream\n");
    const streamEnd = bytes.indexOf(Buffer.from("endstream"), contentStart);
    if (streamEnd < 0) break;
    let contentEnd = streamEnd;
    if (bytes[contentEnd - 1] === 0x0a) contentEnd -= 1;
    if (bytes[contentEnd - 1] === 0x0d) contentEnd -= 1;
    try {
      decodedStreams.push(inflateSync(bytes.subarray(contentStart, contentEnd)).toString("latin1"));
    } catch {
      // A non-Flate PDF stream is irrelevant to the watermark content assertion.
    }
    searchFrom = streamEnd + Buffer.byteLength("endstream");
  }
  const visibleText = decodedStreams.join("\n");
  // pdf-lib writes text operands as hexadecimal PDF strings; compare their
  // encoded ASCII fields instead of expecting readable text in the stream.
  const pdfHex = visibleText.replace(/<([0-9A-Fa-f]+)>/g, (_, hex) =>
    Buffer.from(hex, "hex").toString("latin1"),
  );
  assert.match(pdfHex, /Nome:/);
  assert.match(pdfHex, /joao@example\.invalid/);
  assert.match(pdfHex, /order-synthetic-017/);
});

test("EPUB copy adds a personalized page and keeps mimetype first and uncompressed", async () => {
  const original = await createEpub();
  const watermark = new WatermarkService();
  const copy = await watermark.personalize(original, "application/epub+zip", {
    name: "Cliente <Sintético>",
    email: "cliente@example.invalid",
    purchaseId: "order-synthetic-017",
  });
  const archive = await JSZip.loadAsync(copy.content);
  const packageDocument = await archive.file("OEBPS/content.opf").async("string");
  const watermarkName = Object.keys(archive.files).find((path) =>
    /^OEBPS\/lumina-watermark(?:-\d+)?\.xhtml$/.test(path),
  );
  assert.ok(watermarkName);
  const page = await archive.file(watermarkName).async("string");

  assert.equal(copy.extension, "epub");
  assert.equal(copy.mimeType, "application/epub+zip");
  assert.match(packageDocument, /id="lumina-watermark" href="lumina-watermark\.xhtml"/);
  assert.match(packageDocument, /<itemref idref="lumina-watermark"\/>/);
  assert.match(page, /Cliente &lt;Sintético&gt;/);
  assert.match(page, /cliente@example\.invalid/);
  assert.match(page, /order-synthetic-017/);

  const zipBytes = Buffer.from(copy.content);
  const firstNameLength = zipBytes.readUInt16LE(26);
  assert.equal(zipBytes.subarray(30, 30 + firstNameLength).toString("utf8"), "mimetype");
  assert.equal(zipBytes.readUInt16LE(8), 0);
});

test("watermark processor rejects malformed and unsupported source files", async () => {
  const watermark = new WatermarkService();
  await assert.rejects(
    watermark.personalize(Buffer.from("not a pdf"), "application/pdf", {
      name: "Synthetic Customer",
      email: "customer@example.invalid",
      purchaseId: "order-synthetic-017",
    }),
    (error) => error instanceof WatermarkProcessingError && error.code === "INVALID_FILE",
  );
  await assert.rejects(
    watermark.personalize(Buffer.from("bytes"), "application/octet-stream", {
      name: "Synthetic Customer",
      email: "customer@example.invalid",
      purchaseId: "order-synthetic-017",
    }),
    (error) => error instanceof WatermarkProcessingError && error.code === "UNSUPPORTED_FORMAT",
  );
});
