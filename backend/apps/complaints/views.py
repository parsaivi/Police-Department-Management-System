from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Complaint, ComplaintHistory, ComplaintStatus
from .serializers import (
    AddComplainantSerializer,
    ComplaintSerializer,
    ComplaintTransitionSerializer,
)

User = get_user_model()


class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "crime_severity", "created_by"]
    search_fields = ["title", "description", "location"]
    ordering_fields = ["created_at", "updated_at", "crime_severity"]

    def get_queryset(self):
        user = self.request.user
        
        # Admins see all
        if user.is_staff:
            return Complaint.objects.all()
        
        # Users see complaints they created or are complainants on
        return Complaint.objects.filter(
            models.Q(created_by=user) |
            models.Q(complainants=user) |
            models.Q(assigned_cadet=user) |
            models.Q(assigned_officer=user)
        ).distinct()

    def _log_transition(self, complaint, from_status, to_status, user, message=""):
        ComplaintHistory.objects.create(
            complaint=complaint,
            from_status=from_status,
            to_status=to_status,
            changed_by=user,
            message=message,
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """Complainant submits their complaint."""
        complaint = self.get_object()
        from_status = complaint.status
        
        try:
            complaint.submit()
            complaint.save()
            self._log_transition(complaint, from_status, complaint.status, request.user)
            return Response(ComplaintSerializer(complaint).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def assign_cadet(self, request, pk=None):
        """Assign complaint to a cadet for review."""
        complaint = self.get_object()
        serializer = ComplaintTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cadet_id = serializer.validated_data.get("target_user_id")
        cadet = User.objects.get(id=cadet_id) if cadet_id else request.user
        
        from_status = complaint.status
        try:
            complaint.assign_to_cadet(cadet)
            complaint.save()
            self._log_transition(complaint, from_status, complaint.status, request.user)
            return Response(ComplaintSerializer(complaint).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def return_to_complainant(self, request, pk=None):
        """Cadet returns complaint to complainant for corrections."""
        complaint = self.get_object()
        serializer = ComplaintTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = serializer.validated_data.get("message", "")
        from_status = complaint.status
        
        try:
            with transaction.atomic():
                complaint.return_to_complainant(message)
                complaint.save()
                self._log_transition(
                    complaint, from_status, complaint.status, request.user, message
                )
            return Response(ComplaintSerializer(complaint).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def resubmit(self, request, pk=None):
        """Complainant resubmits after corrections."""
        complaint = self.get_object()
        from_status = complaint.status
        
        try:
            complaint.resubmit()
            complaint.save()
            self._log_transition(complaint, from_status, complaint.status, request.user)
            return Response(ComplaintSerializer(complaint).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def escalate(self, request, pk=None):
        """Cadet approves and escalates to officer."""
        complaint = self.get_object()
        serializer = ComplaintTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        officer_id = serializer.validated_data.get("target_user_id")
        officer = User.objects.get(id=officer_id) if officer_id else None
        
        from_status = complaint.status
        try:
            complaint.escalate_to_officer(officer)
            complaint.save()
            self._log_transition(complaint, from_status, complaint.status, request.user)
            return Response(ComplaintSerializer(complaint).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def return_to_cadet(self, request, pk=None):
        """Officer returns to cadet for review."""
        complaint = self.get_object()
        serializer = ComplaintTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = serializer.validated_data.get("message", "")
        from_status = complaint.status
        
        try:
            complaint.return_to_cadet(message)
            complaint.save()
            self._log_transition(
                complaint, from_status, complaint.status, request.user, message
            )
            return Response(ComplaintSerializer(complaint).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Officer approves the complaint."""
        complaint = self.get_object()
        from_status = complaint.status
        
        try:
            complaint.approve()
            complaint.save()
            self._log_transition(complaint, from_status, complaint.status, request.user)
            # TODO: Trigger case creation
            return Response(ComplaintSerializer(complaint).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject the complaint permanently."""
        complaint = self.get_object()
        serializer = ComplaintTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = serializer.validated_data.get("message", "")
        from_status = complaint.status
        
        try:
            complaint.reject(message)
            complaint.save()
            self._log_transition(
                complaint, from_status, complaint.status, request.user, message
            )
            return Response(ComplaintSerializer(complaint).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def add_complainant(self, request, pk=None):
        """Add additional complainant to the complaint."""
        complaint = self.get_object()
        serializer = AddComplainantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data["user_id"]
        approved = serializer.validated_data["approved"]
        
        if approved:
            user = User.objects.get(id=user_id)
            complaint.complainants.add(user)
            return Response({
                "message": "Complainant added successfully.",
                "complaint": ComplaintSerializer(complaint).data
            })
        else:
            return Response({"message": "Complainant request rejected."})


# Need to import models for Q
from django.db import models


