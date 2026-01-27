from django.db import models
from django.conf import settings

class Event(models.Model):
    STATUS_CHOICES = [
        ('UPCOMING', 'Upcoming'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    SCOPE_CHOICES = [
        ('GLOBAL', 'Global'),
        ('SIG', 'SIG Specific'),
        ('PERSONAL', 'Personal'),
    ]

    VISIBILITY_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateTimeField(verbose_name='Event Date')
    due_date = models.DateTimeField(null=True, blank=True)
    
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='GLOBAL')
    sig = models.ForeignKey('users.Sig', on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    is_full_event = models.BooleanField(default=True)

    location = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UPCOMING')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='DRAFT')
    
    # Organizers
    lead = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_events')
    volunteers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='events', blank=True)
    
    # Media
    image = models.ImageField(upload_to='events/', blank=True, null=True)
    registration_link = models.URLField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
