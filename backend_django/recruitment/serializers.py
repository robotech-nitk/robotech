from rest_framework import serializers
from .models import RecruitmentDrive, TimelineEvent, RecruitmentAssignment, RecruitmentApplication

class TimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineEvent
        fields = '__all__'

class RecruitmentAssignmentSerializer(serializers.ModelSerializer):
    sig_name = serializers.SerializerMethodField()
    class Meta:
        model = RecruitmentAssignment
        fields = '__all__'

    def get_sig_name(self, obj):
        try:
            return obj.sig.name if obj.sig else "General"
        except:
            return "N/A"

class RecruitmentApplicationSerializer(serializers.ModelSerializer):
    sig_name = serializers.SerializerMethodField()
    
    class Meta:
        model = RecruitmentApplication
        fields = '__all__'

    def get_sig_name(self, obj):
        try:
            if obj.sig:
                return obj.sig.name
            if obj.user and hasattr(obj.user, 'profile') and obj.user.profile.sig:
                return obj.user.profile.sig.name
        except:
            pass
        return "N/A"

class RecruitmentDriveSerializer(serializers.ModelSerializer):
    timeline = TimelineEventSerializer(many=True, read_only=True)
    assignments = RecruitmentAssignmentSerializer(many=True, read_only=True)
    applications_count = serializers.IntegerField(source='applications.count', read_only=True)
    
    class Meta:
        model = RecruitmentDrive
        fields = '__all__'
