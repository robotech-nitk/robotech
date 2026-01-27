from rest_framework import serializers
from .models import RecruitmentDrive, TimelineEvent

class TimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineEvent
        fields = '__all__'

class RecruitmentDriveSerializer(serializers.ModelSerializer):
    timeline = TimelineEventSerializer(many=True, read_only=True)
    
    class Meta:
        model = RecruitmentDrive
        fields = '__all__'
