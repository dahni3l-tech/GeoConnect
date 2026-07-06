from rest_framework import serializers
from .models import Location, LocationHistory
from accounts.serializers import UserSearchSerializer


class LocationSerializer(serializers.ModelSerializer):
    user = UserSearchSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            "id",
            "user",
            "latitude",
            "longitude",
            "address",
            "description",
            "privacy",
            "created_at",
            "updated_at",
            "expires_at",
            "is_expired",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at", "is_expired"]

    def get_is_expired(self, obj):
        return obj.is_expired


class LocationCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating locations.
    User is set from request context.
    """

    class Meta:
        model = Location
        fields = [
            "latitude",
            "longitude",
            "address",
            "description",
            "privacy",
            "expires_at",
        ]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class LocationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationHistory
        fields = [
            "id",
            "latitude",
            "longitude",
            "address",
            "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]


class LocationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing multiple locations.
    """
    user = UserSearchSerializer(read_only=True)

    class Meta:
        model = Location
        fields = [
            "id",
            "user",
            "latitude",
            "longitude",
            "address",
            "description",
            "updated_at",
        ]
