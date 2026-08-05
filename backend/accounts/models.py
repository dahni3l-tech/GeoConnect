from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField


class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True, null=True)
    

    profile_picture = CloudinaryField(
    "profile_picture",
    blank=True,
    null=True,
    )

    latitude = models.FloatField(
        null=True,
        blank=True
    )

    longitude = models.FloatField(
        null=True,
        blank=True
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True
    )
    is_email_verified = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    is_guardian = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    
    
class FriendRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]
# RNING: This is a development server. Do not use it in a production setting. Use a production WSGI or ASGI server instead.
# For more information on production servers see: https://docs.djangoproject.com/en/6.0/howto/deployment/
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_friend_requests",
    )

    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_friend_requests",
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("sender", "receiver")

    def __str__(self):
        return f"{self.sender.username} → {self.receiver.username} ({self.status})"


class GuardianProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="guardian_profile")
    guardian_name = models.CharField(max_length=255)
    guardian_phone = models.CharField(max_length=20)
    guardian_email = models.EmailField(blank=True)
    guardian_relation = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Guardian Profile for {self.user.username}"


class FamilyMember(models.Model):
    guardian_profile = models.ForeignKey(GuardianProfile, on_delete=models.CASCADE, related_name="family_members")
    name = models.CharField(max_length=255)
    relation = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.relation})"


class SafePlace(models.Model):
    guardian_profile = models.ForeignKey(GuardianProfile, on_delete=models.CASCADE, related_name="safe_places")
    name = models.CharField(max_length=255)
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius = models.IntegerField(default=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class EmergencyContact(models.Model):
    guardian_profile = models.ForeignKey(GuardianProfile, on_delete=models.CASCADE, related_name="emergency_contacts")
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    contact_type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.contact_type})"


class FamilyInvitation(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
        ("blocked", "Blocked"),
    ]

    guardian = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_family_invitations")
    child = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_family_invitations")
    relation = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("guardian", "child", "status")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.guardian.username} → {self.child.username} ({self.status})"


class FamilyMemberLink(models.Model):
    guardian = models.ForeignKey(User, on_delete=models.CASCADE, related_name="guardian_links")
    child = models.ForeignKey(User, on_delete=models.CASCADE, related_name="child_links")
    relation = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("guardian", "child")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.guardian.username} ↔ {self.child.username}"


class LocationPermission(models.Model):
    PERMISSION_CHOICES = [
        ("always", "Always Share"),
        ("school_hours", "School Hours Only"),
        ("safe_places", "Safe Places Only"),
        ("emergencies_only", "Emergencies Only"),
        ("paused", "Paused"),
        ("approximate", "Approximate Location"),
    ]

    child = models.ForeignKey(User, on_delete=models.CASCADE, related_name="location_permissions")
    guardian = models.ForeignKey(User, on_delete=models.CASCADE, related_name="granted_permissions")
    permission_type = models.CharField(max_length=20, choices=PERMISSION_CHOICES, default="always")
    paused_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("child", "guardian")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.child.username} → {self.guardian.username}: {self.permission_type}"


class SOSAlert(models.Model):
    child = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sos_alerts")
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, default="active")
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"SOS from {self.child.username} at {self.created_at}"


class RouteHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="route_history")
    latitude = models.FloatField()
    longitude = models.FloatField()
    accuracy = models.FloatField(null=True, blank=True)
    battery_level = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} @ {self.created_at}"


class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ("family_joined", "Family Joined"),
        ("family_left", "Family Left"),
        ("permission_changed", "Permission Changed"),
        ("sos_triggered", "SOS Triggered"),
        ("sos_resolved", "SOS Resolved"),
        ("safe_place_arrived", "Arrived at Safe Place"),
        ("safe_place_left", "Left Safe Place"),
        ("low_battery", "Low Battery"),
        ("location_shared", "Location Shared"),
        ("location_paused", "Location Paused"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activity_logs")
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.activity_type}"


class PermissionRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
    ]

    child = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_permission_requests")
    guardian = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_permission_requests")
    current_permission = models.CharField(max_length=20, choices=LocationPermission.PERMISSION_CHOICES)
    requested_permission = models.CharField(max_length=20, choices=LocationPermission.PERMISSION_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Permission request from {self.guardian.username} to {self.child.username}: {self.current_permission} -> {self.requested_permission}"