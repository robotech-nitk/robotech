from rest_framework import viewsets, permissions
from .models import Event
from .serializers import EventSerializer
from users.permissions import GlobalPermission

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer
    permission_classes = [GlobalPermission]

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        qs = Event.objects.all().order_by('-date')

        # 1. Anonymous / Public users: Only Published Global/SIG events
        # 1. Anonymous / Public users: Only Published Global/SIG events
        if not user.is_authenticated:
             # Allowing DRAFT events too for now as per "make seen to all" request, 
             # assuming admin wants immediate visibility. 
             # Ideally should be: qs.filter(visibility='PUBLISHED').exclude(scope='PERSONAL')
             return qs.exclude(scope='PERSONAL')

        # 2. Superusers: See all
        if user.is_superuser:
            return qs

        # 3. Authenticated Users (Admins/Members):
        # - See all PUBLISHED Global/SIG events
        # - See OWN Personal events (Draft or Published)
        # - See DRAFT events if they have management permissions (simplified: if lead or can_manage_events)
        
        # Check if user has global event management permission
        has_perm = user.user_roles.filter(can_manage_events=True).exists()
        
        if has_perm:
            # Manager: See all events except OTHER people's Personal events
            # Manager: See all events except OTHER people's Personal events
            # Simplified: Exclude Personal events where lead != user
            return qs.filter(~Q(scope='PERSONAL') | Q(lead=user))
        
        # Standard Member/Lead:
        return qs.filter(
            # Public events
            Q(visibility='PUBLISHED', scope__in=['GLOBAL', 'SIG']) | 
            # My events (any status)
            Q(lead=user)
        ).distinct()

    def perform_create(self, serializer):
        # Set the lead to the current user if not explicitly provided
        serializer.save(lead=self.request.user)
