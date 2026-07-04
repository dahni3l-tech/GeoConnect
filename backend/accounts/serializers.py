from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
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
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "bio",
            "profile_picture",
            "is_premium",
        ]