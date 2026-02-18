from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.cases.models import Case
from apps.suspects.models import Suspect
from apps.complaints.models import Complaint
from django.contrib.auth import get_user_model

User = get_user_model()


@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    """Get dashboard statistics (public for homepage display)."""
    stats = {
        'active_cases': Case.objects.filter(status='open').count(),
        'total_solved_cases': Case.objects.filter(status='solved').count(),
        'total_staff': User.objects.filter(is_staff=True).count(),
        'total_suspects': Suspect.objects.count(),
        'pending_complaints': Complaint.objects.filter(status='pending').count(),
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def cases_stats(request):
    """Get case statistics."""
    stats = {
        'total_cases': Case.objects.count(),
        'open_cases': Case.objects.filter(status='open').count(),
        'solved_cases': Case.objects.filter(status='solved').count(),
        'closed_cases': Case.objects.filter(status='closed').count(),
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def suspects_stats(request):
    """Get suspect statistics."""
    stats = {
        'total_suspects': Suspect.objects.count(),
        'wanted': Suspect.objects.filter(status='wanted').count(),
        'arrested': Suspect.objects.filter(status='arrested').count(),
        'cleared': Suspect.objects.filter(status='cleared').count(),
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def complaints_stats(request):
    """Get complaint statistics."""
    stats = {
        'total_complaints': Complaint.objects.count(),
        'pending': Complaint.objects.filter(status='pending').count(),
        'resolved': Complaint.objects.filter(status='resolved').count(),
        'dismissed': Complaint.objects.filter(status='dismissed').count(),
    }
    return Response(stats)
