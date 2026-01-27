from django.db import models
from django.utils import timezone

class RecruitmentDrive(models.Model):
    title = models.CharField(max_length=200) # e.g. "Core Team Recruitment 2025"
    description = models.TextField(blank=True)
    registration_link = models.URLField(blank=True)
    
    is_active = models.BooleanField(default=False) # Is this the currently active/highlighted one
    is_public = models.BooleanField(default=True) # Visible on site?
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # If setting to active, unset others
        if self.is_active:
             RecruitmentDrive.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

class TimelineEvent(models.Model):
    drive = models.ForeignKey(RecruitmentDrive, on_delete=models.CASCADE, related_name='timeline')
    title = models.CharField(max_length=200) # e.g. "Written Test"
    date = models.DateTimeField()
    
    # Visual cues
    is_completed = models.BooleanField(default=False)
    is_tentative = models.BooleanField(default=False)
    
    # For strike-through history
    original_date = models.DateTimeField(null=True, blank=True) 
    
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.title} ({self.drive.title})"
