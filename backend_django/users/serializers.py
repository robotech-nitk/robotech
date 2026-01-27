from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Role, MemberProfile, Sig, ProfileFieldDefinition, TeamPosition, AuditLog

User = get_user_model()

class SigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sig
        fields = '__all__'

class TeamPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamPosition
        fields = '__all__'

class ProfileFieldDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileFieldDefinition
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    def get_actor_name(self, obj):
        return obj.actor.username if obj.actor else "System/Deleted User"
    
    class Meta:
        model = AuditLog
        fields = '__all__'

class MemberProfileSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    custom_fields = serializers.JSONField(required=False)
    
    class Meta:
        model = MemberProfile
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    user_roles = RoleSerializer(many=True, read_only=True)
    profile = MemberProfileSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()
    projects_info = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'user_roles', 'profile', 'is_active', 'permissions', 'projects_info')

    def get_projects_info(self, obj):
        return {
            'led': list(obj.led_projects.values('id', 'title')),
            'member': list(obj.projects.values('id', 'title'))
        }

    def get_permissions(self, obj):
        perms = set()
        
        # 1. Direct Roles
        for r in obj.user_roles.all():
            self._add_role_perms(r, perms)
            
        # 2. Position-Linked Roles (NEW)
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.position:
                # Try to find Position by name
                # Ideally user.profile.position would be a ForeignKey, but legacy string support
                pos = TeamPosition.objects.filter(name__iexact=obj.profile.position).select_related('role_link').first()
                if pos and pos.role_link:
                    self._add_role_perms(pos.role_link, perms)
                    # Add role name to perms for frontend visibility checks
                    if pos.role_link.name == 'WEB_LEAD': perms.add('can_manage_everything') 
        except Exception: 
            pass

        # 3. Virtual Sudo Permission
        if 'can_manage_security' in perms:
            perms.add('can_manage_everything')

        return list(perms)

    def _add_role_perms(self, r, perms):
        if r.can_manage_users: perms.add('can_manage_users')
        if r.can_manage_projects: perms.add('can_manage_projects')
        if r.can_manage_events: perms.add('can_manage_events')
        if r.can_manage_team: perms.add('can_manage_team')
        if r.can_manage_gallery: perms.add('can_manage_gallery')
        if r.can_manage_announcements: perms.add('can_manage_announcements')
        if r.can_manage_security: perms.add('can_manage_security')
        if r.can_manage_messages: perms.add('can_manage_messages')
        if r.can_manage_sponsorship: perms.add('can_manage_sponsorship')
        if r.can_manage_forms: perms.add('can_manage_forms')
        if r.name == 'WEB_LEAD': perms.add('can_manage_everything') 
