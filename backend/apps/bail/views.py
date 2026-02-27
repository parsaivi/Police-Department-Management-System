from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Bail, BailStatus
from .serializers import (
    BailCreateSerializer,
    BailListSerializer,
    BailSerializer,
    InitiatePaymentSerializer,
)


class BailViewSet(viewsets.ModelViewSet):
    """
    Bails: list (public), retrieve (public), create (Sergeant only).
    initiate_payment: POST with return_url -> redirect URL (mock: return_url?bail_id=&status=success).
    confirm_payment: GET ?status=success -> mark paid and release suspect.
    """
    permission_classes = [AllowAny]
    filterset_fields = ["status", "suspect"]
    ordering_fields = ["created_at", "amount"]

    def get_queryset(self):
        return Bail.objects.select_related("suspect", "created_by").all()

    def get_serializer_class(self):
        if self.action == "list":
            return BailListSerializer
        if self.action == "create":
            return BailCreateSerializer
        return BailSerializer

    def get_permissions(self):
        if self.action in ("create",):
            return [IsAuthenticated()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        user_roles = request.user.get_roles() if request.user.is_authenticated else []
        if not request.user.is_staff and "Sergeant" not in user_roles:
            return Response(
                {"error": "Only Sergeant can create bails."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bail = serializer.save(created_by=request.user)
        return Response(
            BailSerializer(bail).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def initiate_payment(self, request, pk=None):
        """
        Start payment. Mock: return the frontend return URL with bail_id and status=success
        so the client can redirect and then call confirm_payment.
        """
        bail = self.get_object()
        if bail.status != BailStatus.PENDING:
            return Response(
                {"error": "Bail is not pending payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = InitiatePaymentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        return_url = ser.validated_data["return_url"]
        # Mock: append query params for frontend to use when calling confirm_payment
        redirect_url = f"{return_url}?bail_id={bail.pk}&status=success"
        return Response({"redirect_url": redirect_url})

    @action(detail=True, methods=["get"], url_path="confirm_payment")
    def confirm_payment(self, request, pk=None):
        """
        Confirm payment (mock or callback). GET ?status=success marks bail as paid
        and releases the suspect.
        """
        bail = self.get_object()
        if bail.status != BailStatus.PENDING:
            return Response(
                {"detail": "Bail already processed.", "status": bail.status},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment_status = request.query_params.get("status", "").lower()
        if payment_status != "success":
            return Response(
                {"detail": "Payment was not successful.", "status": payment_status},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bail.status = BailStatus.PAID
        bail.paid_at = timezone.now()
        bail.save()
        suspect = bail.suspect
        try:
            suspect.release_on_bail()
            suspect.save()
        except Exception as e:
            return Response(
                {"error": f"Could not release suspect: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({
            "detail": "Payment confirmed. Suspect released on bail.",
            "bail_id": bail.pk,
            "suspect_id": suspect.pk,
            "suspect_status": suspect.status,
        })
