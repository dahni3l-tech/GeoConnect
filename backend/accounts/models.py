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