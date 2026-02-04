from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RecruitmentDrive, TimelineEvent, RecruitmentAssignment, RecruitmentApplication, InterviewPanel, InterviewSlot
from .serializers import RecruitmentDriveSerializer, TimelineEventSerializer, RecruitmentAssignmentSerializer, RecruitmentApplicationSerializer, InterviewPanelSerializer, InterviewSlotSerializer
from django.db import transaction
from datetime import timedelta
from django.utils.dateparse import parse_datetime

class RecruitmentDriveViewSet(viewsets.ModelViewSet):
    queryset = RecruitmentDrive.objects.all().order_by('-created_at')
    serializer_class = RecruitmentDriveSerializer
    # permission_classes = [GlobalPermission] -> Moved to get_permissions

    def get_permissions(self):
        if self.action == 'active_public':
            return [permissions.AllowAny()]
        from users.permissions import GlobalPermission
        return [GlobalPermission()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def active_public(self, request):
        """Public endpoint to get the current active recruitment drive"""
        drive = RecruitmentDrive.objects.filter(is_active=True, is_public=True).prefetch_related('timeline', 'assignments').first()
        if drive:
            return Response(RecruitmentDriveSerializer(drive).data)
        return Response(None)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def submit_assessment(self, request):
        """Public endpoint for candidates to submit their assessment files"""
        identifier = request.data.get('identifier')
        drive_id = request.data.get('drive')
        file = request.FILES.get('assessment_file')
        solution_link = request.data.get('solution_link')
        
        if not identifier or not drive_id or (not file and not solution_link):
             return Response({"error": "Identifier, Drive, and either a File or Link are required."}, status=400)
             
        try:
            drive = RecruitmentDrive.objects.get(id=drive_id)
            # Find or create application
            app, created = RecruitmentApplication.objects.get_or_create(
                drive=drive,
                identifier=identifier
            )
            
            # Update basic fields
            candidate_name = request.data.get('candidate_name')
            sig_id = request.data.get('sig')
            
            if candidate_name:
                app.candidate_name = candidate_name
            if sig_id:
                app.sig_id = sig_id

            if file: app.assessment_file = file
            if solution_link: app.solution_link = solution_link
            
            from django.utils import timezone
            app.assessment_submitted_at = timezone.now()
            if app.status == 'APPLIED' or app.status == 'ASSESSMENT_PENDING':
                app.status = 'ASSESSMENT_COMPLETED'
            app.save()
            
            return Response({"success": "Assessment submitted successfully."})
        except RecruitmentDrive.DoesNotExist:
            return Response({"error": "Invalid drive id."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class TimelineEventViewSet(viewsets.ModelViewSet):
    queryset = TimelineEvent.objects.all()
    serializer_class = TimelineEventSerializer
    # permission_classes = [GlobalPermission] -> Moved to get_permissions
    
    def get_permissions(self):
        from users.permissions import GlobalPermission
        return [GlobalPermission()]

class RecruitmentApplicationViewSet(viewsets.ModelViewSet):
    queryset = RecruitmentApplication.objects.all()
    serializer_class = RecruitmentApplicationSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        drive_id = self.request.query_params.get('drive_id')
        if drive_id:
            qs = qs.filter(drive_id=drive_id)
        return qs

    def get_permissions(self):
        from users.permissions import GlobalPermission
        return [GlobalPermission()]

    def perform_update(self, serializer):
        # Check if date changed, if so, update original_date if it wasn't set
        instance = self.get_object()
        new_date = serializer.validated_data.get('date')
        
        if new_date and instance.date != new_date and not instance.original_date:
             # Store the old date as original before updating
             serializer.save(original_date=instance.date)
        else:
             serializer.save()
class RecruitmentAssignmentViewSet(viewsets.ModelViewSet):
    queryset = RecruitmentAssignment.objects.all()
    serializer_class = RecruitmentAssignmentSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        from users.permissions import GlobalPermission
        return [GlobalPermission()]

class InterviewPanelViewSet(viewsets.ModelViewSet):
    queryset = InterviewPanel.objects.all()
    serializer_class = InterviewPanelSerializer
    
    def get_permissions(self):
        from users.permissions import GlobalPermission
        return [GlobalPermission()]

    def get_queryset(self):
        qs = super().get_queryset()
        drive_id = self.request.query_params.get('drive_id')
        if drive_id:
            qs = qs.filter(drive_id=drive_id)
        return qs

    @action(detail=True, methods=['post'])
    def generate_slots(self, request, pk=None):
        panel = self.get_object()
        
        # Get parameters from request or panel
        start_time = panel.start_time
        duration = panel.slot_duration
        
        # Override if provided in request
        if 'start_time' in request.data and request.data['start_time']:
            start_time = parse_datetime(request.data['start_time'])
        if 'duration_minutes' in request.data and request.data['duration_minutes']:
             duration = timedelta(minutes=int(request.data['duration_minutes']))

        if not start_time or not duration:
            return Response({"error": "Start time and duration are required. Set them in panel config or pass in request."}, status=400)
        
        # Update panel config
        panel.start_time = start_time
        panel.slot_duration = duration
        panel.save()

        candidate_ids = request.data.get('candidate_ids', [])
        
        created_slots = []
        current_time = start_time
        
        # If candidate_ids provided, create slots for them
        for index, candidate_id in enumerate(candidate_ids):
            # Fetch application
            try:
                app = RecruitmentApplication.objects.get(id=candidate_id)
                # Check if already has slot? Maybe override?
                # For now assume fresh assignment
                
                slot = InterviewSlot.objects.create(
                    panel=panel,
                    application=app,
                    start_time=current_time,
                    end_time=current_time + duration,
                    order=index
                )
                created_slots.append(slot)
                current_time += duration
                
                # Update application status
                app.status = 'INTERVIEW_SCHEDULED'
                app.interview_time = slot.start_time
                app.save()
                
            except RecruitmentApplication.DoesNotExist:
                continue
                
        return Response(InterviewPanelSerializer(panel).data)

class InterviewSlotViewSet(viewsets.ModelViewSet):
    queryset = InterviewSlot.objects.all()
    serializer_class = InterviewSlotSerializer
    
    def get_permissions(self):
        from users.permissions import GlobalPermission
        return [GlobalPermission()]
    
    def get_queryset(self):
        qs = super().get_queryset()
        panel_id = self.request.query_params.get('panel_id')
        if panel_id:
            qs = qs.filter(panel_id=panel_id)
        return qs
