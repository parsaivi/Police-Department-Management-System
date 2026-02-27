from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import BailViewSet

router = DefaultRouter()
router.register("bails", BailViewSet, basename="bail")

urlpatterns = [
    path("", include(router.urls)),
]
