from django.db import models
from django.utils import timezone
from django.conf import settings

class RecruitmentDrive(models.Model):
    title = models.CharField(max_length=200) # e.g. "Core Team Recruitment 2025"
    description = models.TextField(blank=True)
    registration_link = models.URLField(blank=True)
    
    # New Links
    form = models.ForeignKey('core.Form', on_delete=models.SET_NULL, null=True, blank=True, related_name='recruitment_drives')
    quiz = models.ForeignKey('quizzes.Quiz', on_delete=models.SET_NULL, null=True, blank=True, related_name='recruitment_drives')
    primary_field = models.CharField(max_length=200, blank=True, help_text="Field label in form to use as UID (e.g. Email / Roll Number)")
    
    assessment_instructions = models.TextField(blank=True, help_text="Instructions for the file upload assessment")
    
    is_active = models.BooleanField(default=False) 
    is_public = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.is_active:
             RecruitmentDrive.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

class TimelineEvent(models.Model):
    drive = models.ForeignKey(RecruitmentDrive, on_delete=models.CASCADE, related_name='timeline')
    title = models.CharField(max_length=200)
    date = models.DateTimeField()
    is_completed = models.BooleanField(default=False)
    is_tentative = models.BooleanField(default=False)
    original_date = models.DateTimeField(null=True, blank=True) 
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.title} ({self.drive.title})"

class RecruitmentApplication(models.Model):
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('OA_PENDING', 'OA Pending'),
        ('OA_COMPLETED', 'OA Completed'),
        ('ASSESSMENT_PENDING', 'Assessment Pending'),
        ('ASSESSMENT_COMPLETED', 'Assessment Completed'),
        ('INTERVIEW_SCHEDULED', 'Interview Scheduled'),
        ('INTERVIEW_COMPLETED', 'Interview Completed'),
        ('SELECTED', 'Selected'),
        ('REJECTED', 'Rejected'),
    ]

    drive = models.ForeignKey(RecruitmentDrive, on_delete=models.CASCADE, related_name='applications')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='recruitment_applications')
    
    # Primary Identifier from Form Response
    identifier = models.CharField(max_length=255) 
    candidate_name = models.CharField(max_length=255, blank=True)
    sig = models.ForeignKey('users.Sig', on_delete=models.SET_NULL, null=True, blank=True, related_name='applications')
    
    # Assessment
    assessment_file = models.FileField(upload_to='recruitment/assessments/', null=True, blank=True)
    solution_link = models.URLField(blank=True, help_text="Link to hosted solution (Drive/GitHub)")
    assessment_submitted_at = models.DateTimeField(null=True, blank=True)
    
    # Interview
    interview_time = models.DateTimeField(null=True, blank=True)
    
    # Scores
    oa_score = models.FloatField(null=True, blank=True)
    assessment_score = models.FloatField(null=True, blank=True)
    interview_score = models.FloatField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='APPLIED')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('drive', 'identifier')

    def __str__(self):
        return f"{self.identifier} - {self.drive.title}"

class RecruitmentAssignment(models.Model):
    SUBMISSION_CHOICES = [
        ('FILE', 'File Upload'),
        ('LINK', 'Link Submission'),
    ]
    drive = models.ForeignKey(RecruitmentDrive, on_delete=models.CASCADE, related_name='assignments')
    sig = models.ForeignKey('users.Sig', on_delete=models.CASCADE, related_name='recruitment_assignments')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    submission_type = models.CharField(max_length=10, choices=SUBMISSION_CHOICES, default='FILE')
    file = models.FileField(upload_to='recruitment/assignments/', null=True, blank=True)
    external_link = models.URLField(blank=True, help_text="Link to external assignment doc/folder")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sig.name} - {self.title}"

class InterviewPanel(models.Model):
    drive = models.ForeignKey(RecruitmentDrive, on_delete=models.CASCADE, related_name='panels')
    panel_number = models.IntegerField() # e.g. 1, 2, 3
    name = models.CharField(max_length=200, blank=True) # e.g. "Software Panel 1"
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='interview_panels', blank=True)
    
    # Configuration for auto-generation
    start_time = models.DateTimeField(null=True, blank=True)
    slot_duration = models.DurationField(null=True, blank=True, help_text="Duration of each interview slot")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('drive', 'panel_number')

    def __str__(self):
        return f"Panel {self.panel_number} - {self.drive.title}"

class InterviewSlot(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed'),
        ('DELAYED', 'Delayed'),
        ('CANCELLED', 'Cancelled'),
    ]

    panel = models.ForeignKey(InterviewPanel, on_delete=models.CASCADE, related_name='slots')
    application = models.OneToOneField(RecruitmentApplication, on_delete=models.SET_NULL, null=True, blank=True, related_name='interview_slot')
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='SCHEDULED')
    
    # To track order changes or delays
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.panel} - {self.application} ({self.start_time})"
