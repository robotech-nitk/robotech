from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecruitmentDriveViewSet, TimelineEventViewSet, RecruitmentAssignmentViewSet, RecruitmentApplicationViewSet, InterviewPanelViewSet, InterviewSlotViewSet

router = DefaultRouter()
router.register(r'drives', RecruitmentDriveViewSet)
router.register(r'timeline', TimelineEventViewSet)
router.register(r'assignments', RecruitmentAssignmentViewSet)
router.register(r'applications', RecruitmentApplicationViewSet)
router.register(r'panels', InterviewPanelViewSet)
router.register(r'slots', InterviewSlotViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
