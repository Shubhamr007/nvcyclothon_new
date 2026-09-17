const { generateCertificatePdf } = require("./certificatePdf");
const { generateRiderPassPdf: generateApprovedRiderPassPdf } = require("./riderPassPdf");

function riderId(registration) {
  return `NVC26-${String(registration.id).padStart(4, "0")}`;
}

function dataUrlToBuffer(dataUrl) {
  return Buffer.from(String(dataUrl).split(",")[1], "base64");
}

function fitText(text, maxLength = 34) {
  const value = String(text || "").trim();
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function drawCentered(page, text, y, size, font, color, pageWidth) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: Math.max(18, (pageWidth - width) / 2), y, size, font, color });
}

async function generateRiderPassPdf({ templatePath, registration, checkinPayload, eventDate, assemblyPoint }) {
  const distance = String(registration.ride_category || "").match(/\d+\s*Km/i)?.[0] || "Ride";
  return generateApprovedRiderPassPdf(
    {
      id: registration.id,
      name: registration.full_name,
      bib: riderId(registration),
      category: registration.ride_category,
      distance,
      startWave: "Wave A",
      reportingTime: "5:30 AM",
    },
    {
      eventDate: eventDate || "2026-11-22",
      assemblyPoint: assemblyPoint || "Rewa, Madhya Pradesh",
      qrCodeUrl: checkinPayload || `https://nvcyclothon.event/rider/${registration.id}`,
    }
  );
}

async function generateParticipationCertificate({ templatePath, registration, eventDate, venue }) {
  return generateCertificatePdf(
    {
      id: registration.id,
      name: registration.full_name,
      position: "Finisher",
      category: registration.ride_category,
    },
    {
      eventDate: eventDate || "2026-11-22",
      venue: venue || "Rewa, Madhya Pradesh",
    }
  );
}

module.exports = {
  generateRiderPassPdf,
  generateParticipationCertificate,
  riderId,
};
