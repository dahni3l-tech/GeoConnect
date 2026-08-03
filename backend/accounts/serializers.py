from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User, FriendRequest, GuardianProfile, FamilyMember, SafePlace, EmergencyContact 



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    is_guardian = serializers.BooleanField(required=False, default=False)
    guardian_name = serializers.CharField(required=False, allow_blank=True)
    guardian_phone = serializers.CharField(required=False, allow_blank=True)
    guardian_email = serializers.CharField(required=False, allow_blank=True)
    guardian_relation = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "is_guardian", "guardian_name", "guardian_phone", "guardian_email", "guardian_relation", "address"]

    def create(self, validated_data):
        is_guardian = validated_data.pop("is_guardian", False)
        guardian_name = validated_data.pop("guardian_name", "")
        guardian_phone = validated_data.pop("guardian_phone", "")
        guardian_email = validated_data.pop("guardian_email", "")
        guardian_relation = validated_data.pop("guardian_relation", "")
        address = validated_data.pop("address", "")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_guardian=is_guardian,
        )

        if is_guardian and guardian_name and guardian_phone and guardian_relation:
            GuardianProfile.objects.create(
                user=user,
                guardian_name=guardian_name,
                guardian_phone=guardian_phone,
                guardian_email=guardian_email,
                guardian_relation=guardian_relation,
                address=address,
            )

        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        login = attrs.get("login")
        password = attrs.get("password")

        if not login or not password:
            raise serializers.ValidationError(
                "Both login and password are required."
            )

        if "@" in login:
            user = User.objects.filter(email=login).first()
        else:
            user = User.objects.filter(username=login).first()

        if not user:
            raise serializers.ValidationError(
                "Invalid username/email or password."
            )

        authenticated_user = authenticate(
            username=user.username,
            password=password
        )

        if not authenticated_user:
            raise serializers.ValidationError(
                "Invalid username/email or password."
            )

        attrs["user"] = authenticated_user

        return attrs
    
class ProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "bio",
            "profile_picture",
            "ip_address",
            "latitude",
            "longitude",
            "is_online",
            "last_seen",
            "is_guardian",
        ]

    def get_profile_picture(self, obj):
        if not obj.profile_picture:
            return None
        return obj.profile_picture.url     

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["bio", "profile_picture"]

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user

        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError(
                {"old_password": "Old password is incorrect."}
            )

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()

        return user
    
class UserSearchSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "profile_picture",
            "ip_address",
            "latitude",
            "longitude",
            "is_online",
            "last_seen",
        ]

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None
    
class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = [
            "id",
            "sender",
            "receiver",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "sender",
            "status",
            "created_at",
        ]

class FriendRequestListSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(
        source="sender.username",
        read_only=True,
    )

    sender_email = serializers.CharField(
        source="sender.email",
        read_only=True,
    )

    class Meta:
        model = FriendRequest
        fields = [
            "id",
            "sender",
            "sender_username",
            "sender_email",
            "status",
            "created_at",
        ]

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "profile_picture",
            "ip_address",
            "latitude",
            "longitude",
            "is_online",
            "last_seen",
        ]

class UpdateLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["latitude", "longitude"]


class GuardianProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuardianProfile
        fields = ["id", "guardian_name", "guardian_phone", "guardian_email", "guardian_relation", "address", "created_at"]
        read_only_fields = ["id", "created_at"]


class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = ["id", "name", "relation", "phone", "email", "created_at"]
        read_only_fields = ["id", "created_at"]


class SafePlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafePlace
        fields = ["id", "name", "address", "latitude", "longitude", "radius", "created_at"]
        read_only_fields = ["id", "created_at"]


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ["id", "name", "phone", "contact_type", "created_at"]
        read_only_fields = ["id", "created_at"]
