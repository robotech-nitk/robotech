from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecruitmentDriveViewSet, TimelineEventViewSet

router = DefaultRouter()
router.register(r'drives', RecruitmentDriveViewSet)
router.register(r'timeline', TimelineEventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
