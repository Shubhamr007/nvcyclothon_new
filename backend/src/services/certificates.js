const PDFDocument = require("pdfkit");

function generateParticipationCertificate({ name, riderId, route }) {
  const document = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  const chunks = [];

  return new Promise((resolve) => {
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));

    const width = document.page.width;
    const height = document.page.height;

    document.rect(0, 0, width, height).fill("#071313");
    document.lineWidth(5).strokeColor("#d9ff38").rect(28, 28, width - 56, height - 56).stroke();

    document.fillColor("#d9ff38").font("Helvetica-Bold").fontSize(15).text("NV CYCLOTHON 2026", 0, 78, {
      align: "center",
    });

    document.fillColor("white").fontSize(36).text("PARTICIPATION CERTIFICATE", 0, 120, {
      align: "center",
    });

    document.font("Helvetica").fontSize(16).text("This certificate is proudly presented to", 0, 190, {
      align: "center",
    });

    document.fillColor("#d9ff38").font("Helvetica-Bold").fontSize(31).text(String(name), 0, 230, {
      align: "center",
    });

    document.fillColor("white").font("Helvetica").fontSize(15).text(
      `for participating in the ${String(route)} bicycle route`,
      0,
      300,
      { align: "center" }
    );
    document.text("NV Cyclothon - 18 October 2026 - Rewa, Madhya Pradesh", 0, 328, {
      align: "center",
    });

    document.fillColor("#ff5f3d").font("Helvetica-Bold").fontSize(13).text(`RIDER ID  #${riderId}`, 0, height - 110, {
      align: "center",
    });

    document.fillColor("white").font("Helvetica").fontSize(11).text(
      "With appreciation from NV Cyclothon and Rewa Cycling Federation",
      0,
      height - 86,
      { align: "center" }
    );

    document.end();
  });
}

module.exports = {
  generateParticipationCertificate,
};
