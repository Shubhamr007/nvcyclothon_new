from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas


def _pdf_text(value: str) -> str:
    return value.encode("latin-1", "replace").decode("latin-1")


def generate_participation_certificate(*, name: str, rider_id: int, route: str) -> bytes:
    buffer = BytesIO()
    page_width, page_height = landscape(A4)
    document = canvas.Canvas(buffer, pagesize=(page_width, page_height))

    document.setFillColor(colors.HexColor("#071313"))
    document.rect(0, 0, page_width, page_height, fill=1, stroke=0)
    document.setStrokeColor(colors.HexColor("#d9ff38"))
    document.setLineWidth(5)
    document.rect(28, 28, page_width - 56, page_height - 56, fill=0, stroke=1)

    document.setFillColor(colors.HexColor("#d9ff38"))
    document.setFont("Helvetica-Bold", 15)
    document.drawCentredString(page_width / 2, page_height - 92, "NV CYCLOTHON 2026")

    document.setFillColor(colors.white)
    document.setFont("Helvetica-Bold", 36)
    document.drawCentredString(page_width / 2, page_height - 150, "PARTICIPATION CERTIFICATE")

    document.setFont("Helvetica", 16)
    document.drawCentredString(page_width / 2, page_height - 202, "This certificate is proudly presented to")
    document.setFillColor(colors.HexColor("#d9ff38"))
    document.setFont("Helvetica-Bold", 31)
    document.drawCentredString(page_width / 2, page_height - 252, _pdf_text(name))

    document.setFillColor(colors.white)
    document.setFont("Helvetica", 15)
    document.drawCentredString(
        page_width / 2,
        page_height - 305,
        f"for participating in the {_pdf_text(route)} bicycle route",
    )
    document.drawCentredString(
        page_width / 2,
        page_height - 332,
        "NV Cyclothon · 18 October 2026 · Rewa, Madhya Pradesh",
    )

    document.setFillColor(colors.HexColor("#ff5f3d"))
    document.setFont("Helvetica-Bold", 13)
    document.drawCentredString(page_width / 2, 95, f"RIDER ID  #{rider_id}")
    document.setFillColor(colors.white)
    document.setFont("Helvetica", 11)
    document.drawCentredString(page_width / 2, 70, "With appreciation from NV Cyclothon and Rewa Cycling Federation")

    document.showPage()
    document.save()
    return buffer.getvalue()
