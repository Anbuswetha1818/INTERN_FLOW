"""
SIMS — Certificate Generation Views
Server-side PDF generation for all certificate types.
"""
import io
from django.http import FileResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Certificate, UserProfile
from ..serializers import CertificateSerializer
from ..permissions import IsStaffOrAbove


def generate_pdf(title, content_lines):
    """Generate a beautiful, premium PDF certificate."""
    try:
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import HexColor

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=landscape(A4))
        w, h = landscape(A4)

        # Define Premium Palette
        NAVY = HexColor("#0F2042")
        GOLD = HexColor("#B8860B")
        DARK_GRAY = HexColor("#222222")
        LIGHT_BG = HexColor("#FDFDFD")

        # 1. Background color fill
        c.setFillColor(LIGHT_BG)
        c.rect(0, 0, w, h, fill=True, stroke=False)

        # 2. Outer Border (Deep Navy)
        c.setStrokeColor(NAVY)
        c.setLineWidth(6)
        c.rect(25, 25, w - 50, h - 50, fill=False, stroke=True)

        # 3. Inner Border (Golden)
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.5)
        c.rect(35, 35, w - 70, h - 70, fill=False, stroke=True)

        # 4. Elegant Corner Accents (Triangles in the four corners)
        # Top-Left Corner Shape
        c.setFillColor(NAVY)
        p = c.beginPath()
        p.moveTo(25, h - 70)
        p.lineTo(70, h - 25)
        p.lineTo(25, h - 25)
        p.close()
        c.drawPath(p, fill=True, stroke=False)

        # Top-Right Corner Shape
        p = c.beginPath()
        p.moveTo(w - 25, h - 70)
        p.lineTo(w - 70, h - 25)
        p.lineTo(w - 25, h - 25)
        p.close()
        c.drawPath(p, fill=True, stroke=False)

        # Bottom-Left Corner Shape
        p = c.beginPath()
        p.moveTo(25, 70)
        p.lineTo(70, 25)
        p.lineTo(25, 25)
        p.close()
        c.drawPath(p, fill=True, stroke=False)

        # Bottom-Right Corner Shape
        p = c.beginPath()
        p.moveTo(w - 25, 70)
        p.lineTo(w - 70, 25)
        p.lineTo(w - 25, 25)
        p.close()
        c.drawPath(p, fill=True, stroke=False)

        # 5. Header / Organization Brand
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(GOLD)
        c.drawCentredString(w / 2, h - 75, "INTERNFLOW")

        # 6. Main Certificate Title
        c.setFont("Helvetica-Bold", 32)
        c.setFillColor(NAVY)
        c.drawCentredString(w / 2, h - 120, title.upper())

        # 7. Decorative central line
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.2)
        c.line(w / 2 - 120, h - 135, w / 2 + 120, h - 135)

        # 8. Content rendering
        c.setFont("Helvetica", 14)
        c.setFillColor(DARK_GRAY)
        
        y = h - 175
        for line in content_lines:
            if not line.strip():  # Spacer line
                y -= 15
                continue
            
            # Special formatting logic for high contrast/importance lines
            if "certify that" in line or "Awarded to" in line or "Dear" in line:
                c.setFont("Helvetica", 15)
                c.setFillColor(DARK_GRAY)
                c.drawCentredString(w / 2, y, line)
            elif any(x in line for x in ["Yaswanth", "ADM", "VDI", "Dear"]):
                c.setFont("Helvetica-Bold", 18)
                c.setFillColor(NAVY)
                c.drawCentredString(w / 2, y, line)
                c.setFont("Helvetica", 14)
                c.setFillColor(DARK_GRAY)
            else:
                c.setFont("Helvetica", 14)
                c.setFillColor(DARK_GRAY)
                c.drawCentredString(w / 2, y, line)
            
            y -= 28

        # 9. Draw Gold Verification Seal (Bottom Center)
        seal_x = w / 2
        seal_y = 105
        c.setStrokeColor(GOLD)
        c.setFillColor(LIGHT_BG)
        c.setLineWidth(1.5)
        c.circle(seal_x, seal_y, 25, fill=True, stroke=True)
        c.circle(seal_x, seal_y, 22, fill=False, stroke=True)
        
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(GOLD)
        c.drawCentredString(seal_x, seal_y - 3, "SEAL")

        # 10. Signature Blocks (Left and Right)
        c.setStrokeColor(HexColor("#CCCCCC"))
        c.setLineWidth(1)
        c.line(80, 95, 230, 95)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(NAVY)
        c.drawString(80, 80, "Program Director")
        c.setFont("Helvetica", 8)
        c.setFillColor(HexColor("#666666"))
        c.drawString(80, 68, "InternFlow")

        c.line(w - 230, 95, w - 80, 95)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(NAVY)
        c.drawString(w - 230, 80, "Authorized Signatory")
        c.setFont("Helvetica", 8)
        c.setFillColor(HexColor("#666666"))
        c.drawString(w - 230, 68, "SIMS Verification Engine")

        # 11. Footer System Label
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColor(HexColor("#888888"))
        c.drawCentredString(w / 2, 48, "SIMS — Secure Digital Certificate")

        c.save()
        buffer.seek(0)
        return buffer
    except ImportError:
        return None


class GenerateCompletionCertificateView(APIView):
    """POST /Sims/generate-completion-certificate/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def post(self, request):
        profile = request.user.profile
        if profile.role not in ('manager', 'superadmin'):
            return Response({'error': 'Only Managers or Super Admins can generate certificates.'}, status=status.HTTP_403_FORBIDDEN)
        emp_id = request.data.get('emp_id')
        try:
            intern = UserProfile.objects.get(emp_id=emp_id)
            content = [
                "",
                f"This is to certify that {intern.full_name}",
                f"(Employee ID: {intern.emp_id})",
                "has successfully completed the intensive student internship program",
                f"specializing in the domain of {intern.domain.name if intern.domain else 'General Operations'}",
                f"for the period from {intern.start_date} to {intern.end_date}.",
            ]
            pdf = generate_pdf("Certificate of Completion", content)
            if pdf:
                cert = Certificate.objects.create(
                    intern=intern, cert_type='completion', generated_by=request.user.profile
                )
                return FileResponse(pdf, as_attachment=True, filename=f"completion_{emp_id}.pdf")
            return Response({'message': 'Certificate generated (PDF engine not available)'})
        except UserProfile.DoesNotExist:
            return Response({'error': 'Intern not found'}, status=status.HTTP_404_NOT_FOUND)


class GenerateOfferLetterView(APIView):
    """POST /Sims/generate-offer-letter/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def post(self, request):
        profile = request.user.profile
        if profile.role not in ('manager', 'superadmin'):
            return Response({'error': 'Only Managers or Super Admins can generate certificates.'}, status=status.HTTP_403_FORBIDDEN)
        emp_id = request.data.get('emp_id')
        try:
            intern = UserProfile.objects.get(emp_id=emp_id)
            content = [
                "",
                f"Dear {intern.full_name},",
                "",
                f"We are pleased to offer you an internship position at InternFlow.",
                f"Your internship will focus on the {intern.domain.name if intern.domain else 'General'} domain.",
                f"The scheduled start date is {intern.start_date}.",
            ]
            pdf = generate_pdf("Internship Offer Letter", content)
            if pdf:
                Certificate.objects.create(intern=intern, cert_type='offer_letter', generated_by=request.user.profile)
                return FileResponse(pdf, as_attachment=True, filename=f"offer_{emp_id}.pdf")
            return Response({'message': 'Offer letter generated'})
        except UserProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class GenerateTaskCertificateView(APIView):
    """POST /Sims/generate-task-certificate/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def post(self, request):
        profile = request.user.profile
        if profile.role not in ('manager', 'superadmin'):
            return Response({'error': 'Only Managers or Super Admins can generate certificates.'}, status=status.HTTP_403_FORBIDDEN)
        emp_id = request.data.get('emp_id')
        task_name = request.data.get('task_name', 'Project Task')
        try:
            intern = UserProfile.objects.get(emp_id=emp_id)
            content = [
                "",
                f"This is to certify that {intern.full_name}",
                f"(Employee ID: {intern.emp_id})",
                f"has successfully completed the project task milestone:",
                f"\"{task_name}\"",
            ]
            pdf = generate_pdf("Task Certificate", content)
            if pdf:
                Certificate.objects.create(intern=intern, cert_type='task', generated_by=request.user.profile)
                return FileResponse(pdf, as_attachment=True, filename=f"task_cert_{emp_id}.pdf")
            return Response({'message': 'Generated'})
        except UserProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class GenerateAttendanceCertificateView(APIView):
    """POST /Sims/generate-attendance-certificate/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def post(self, request):
        profile = request.user.profile
        if profile.role not in ('manager', 'superadmin'):
            return Response({'error': 'Only Managers or Super Admins can generate certificates.'}, status=status.HTTP_403_FORBIDDEN)
        emp_id = request.data.get('emp_id')
        try:
            intern = UserProfile.objects.get(emp_id=emp_id)
            from ..models import AttendanceRecord
            att = AttendanceRecord.objects.filter(user=intern)
            total = att.count()
            present = att.filter(status='present').count()
            pct = round((present / total * 100), 1) if total > 0 else 0
            content = [
                "",
                f"This is to certify that {intern.full_name}",
                f"(Employee ID: {intern.emp_id})",
                f"has maintained a verified record of attendance of {pct}%",
                f"representing {present} present days out of {total} total program days.",
            ]
            pdf = generate_pdf("Attendance Certificate", content)
            if pdf:
                Certificate.objects.create(intern=intern, cert_type='attendance', generated_by=request.user.profile)
                return FileResponse(pdf, as_attachment=True, filename=f"attendance_{emp_id}.pdf")
            return Response({'message': 'Generated'})
        except UserProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class GeneratePartialCertificateView(APIView):
    """POST /Sims/generate-partial-certificate/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def post(self, request):
        profile = request.user.profile
        if profile.role not in ('manager', 'superadmin'):
            return Response({'error': 'Only Managers or Super Admins can generate certificates.'}, status=status.HTTP_403_FORBIDDEN)
        emp_id = request.data.get('emp_id')
        try:
            intern = UserProfile.objects.get(emp_id=emp_id)
            content = [
                "",
                f"This is to certify that {intern.full_name}",
                f"(Employee ID: {intern.emp_id})",
                "has partially completed components of the internship program",
                f"specializing in the domain of {intern.domain.name if intern.domain else 'General Operations'}.",
            ]
            pdf = generate_pdf("Partial Completion Certificate", content)
            if pdf:
                Certificate.objects.create(intern=intern, cert_type='partial', generated_by=request.user.profile)
                return FileResponse(pdf, as_attachment=True, filename=f"partial_{emp_id}.pdf")
            return Response({'message': 'Generated'})
        except UserProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class CertificateListView(APIView):
    """GET /Sims/certificates/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        certs = Certificate.objects.all()
        if request.user.profile.role == 'intern':
            certs = certs.filter(intern=request.user.profile)
        serializer = CertificateSerializer(certs, many=True)
        return Response(serializer.data)
