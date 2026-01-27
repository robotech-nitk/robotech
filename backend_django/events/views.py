from rest_framework import viewsets, permissions
from .models import Event
from .serializers import EventSerializer
from users.permissions import GlobalPermission

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer
    permission_classes = [GlobalPermission]

    def get_queryset(self):
        # Allow visibility for all (GlobalPermission handles read/write)
        return Event.objects.all().order_by('-date')

    def perform_create(self, serializer):
        serializer.save()
