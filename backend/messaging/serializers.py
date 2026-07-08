from rest_framework import serializers
from .models import Conversation, Message
from accounts.serializers import UserSearchSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSearchSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "text",
            "is_read",
            "created_at",
        ]


class SendMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "text",
        ]
    
class StartConversationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSearchSerializer(
        many=True,
        read_only=True,
    )

    messages = MessageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Conversation
        fields = [
            "id",
            "participants",
            "messages",
            "created_at",
        ]


class ConversationListSerializer(serializers.ModelSerializer):
    participants = UserSearchSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Conversation
        fields = [
            "id",
            "participants",
            "created_at",
        ]