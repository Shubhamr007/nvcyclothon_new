"use strict";

const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const logger = require("./logger");

const TEMPLATE_PATH = path.join(__dirname, "..", "..", "assets", "certificate-template.pdf");

if (!fs.existsSync(TEMPLATE_PATH)) {
  throw new Error(
    `[certificate] Template not found at: ${TEMPLATE_PATH}\n` +
      `  → Make sure backend/assets/certificate-template.pdf is present.`
  );
}

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

const NAME_LINE = {
  centerX: 0.5009 * PAGE_WIDTH,
  y: PAGE_HEIGHT - 0.4613 * PAGE_HEIGHT + 6,
  maxWidth: 0.44 * PAGE_WIDTH
};

const FIELD_Y = PAGE_HEIGHT - 0.6258 * PAGE_HEIGHT + 2;

const FIELDS = {
  position: { centerX: 0.2923 * PAGE_WIDTH, maxWidth: 0.086 * PAGE_WIDTH },
  category: { centerX: 0.4274 * PAGE_WIDTH, maxWidth: 0.108 * PAGE_WIDTH },
  eventDate: { centerX: 0.5726 * PAGE_WIDTH, maxWidth: 0.105 * PAGE_WIDTH },
  venue: { centerX: 0.7068 * PAGE_WIDTH, maxWidth: 0.088 * PAGE_WIDTH }
};

const NAVY = rgb(0.02, 0.09, 0.27);
const SLATE = rgb(0.15, 0.18, 0.24);

function drawFittedCentered(page, { text, font, startSize, minSize, centerX, y, maxWidth, color }) {
  let size = startSize;
  let width = font.widthOfTextAtSize(text, size);
  while (width > maxWidth && size > minSize) {
    size -= 0.5;
    width = font.widthOfTextAtSize(text, size);
  }
  page.drawText(text, { x: centerX - width / 2, y, size, font, color });
}

function formatDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

async function generateCertificatePdf(participant, options = {}) {
  const { eventDate = new Date().toISOString(), venue = "Rewa, Madhya Pradesh" } = options;

  logger.debug({ participantId: participant.id }, "Generating certificate PDF");

  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const templateDoc = await PDFDocument.load(templateBytes);

  const pdfDoc = await PDFDocument.create();
  const [embeddedTemplatePage] = await pdfDoc.embedPdf(templateDoc, [0]);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawPage(embeddedTemplatePage, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });

  const fontScript = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  const fontBody = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  drawFittedCentered(page, {
    text: participant.name,
    font: fontScript,
    startSize: 22,
    minSize: 12,
    centerX: NAME_LINE.centerX,
    y: NAME_LINE.y,
    maxWidth: NAME_LINE.maxWidth,
    color: NAVY
  });

  drawFittedCentered(page, {
    text: participant.position || "Finisher",
    font: fontBody,
    startSize: 9,
    minSize: 6,
    centerX: FIELDS.position.centerX,
    y: FIELD_Y,
    maxWidth: FIELDS.position.maxWidth,
    color: SLATE
  });

  drawFittedCentered(page, {
    text: participant.category || "-",
    font: fontBody,
    startSize: 9,
    minSize: 6,
    centerX: FIELDS.category.centerX,
    y: FIELD_Y,
    maxWidth: FIELDS.category.maxWidth,
    color: SLATE
  });

  drawFittedCentered(page, {
    text: formatDate(eventDate),
    font: fontBody,
    startSize: 9,
    minSize: 6,
    centerX: FIELDS.eventDate.centerX,
    y: FIELD_Y,
    maxWidth: FIELDS.eventDate.maxWidth,
    color: SLATE
  });

  drawFittedCentered(page, {
    text: venue,
    font: fontBody,
    startSize: 9,
    minSize: 6,
    centerX: FIELDS.venue.centerX,
    y: FIELD_Y,
    maxWidth: FIELDS.venue.maxWidth,
    color: SLATE
  });

  const pdfBytes = await pdfDoc.save();
  logger.debug({ participantId: participant.id }, "Certificate PDF generated");
  return Buffer.from(pdfBytes);
}

module.exports = { generateCertificatePdf };
