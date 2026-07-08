from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationListSerializer,
    MessageSerializer,
    SendMessageSerializer,
    StartConversationSerializer,
)

from accounts.models import User, FriendRequest



class StartConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartConversationSerializer(data=request.data)

        if serializer.is_valid():
            user_id = serializer.validated_data["user_id"]

            try:
                other_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if other_user == request.user:
                return Response(
                    {"error": "You cannot message yourself."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            is_friend = FriendRequest.objects.filter(
                status="accepted",
            ).filter(
                Q(sender=request.user, receiver=other_user) |
                Q(sender=other_user, receiver=request.user)
            ).exists()

            if not is_friend:
                return Response(
                    {"error": "You can only message your friends."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            conversations = Conversation.objects.filter(
                participants=request.user
            )

            for conversation in conversations:
                if conversation.participants.filter(id=other_user.id).exists():
                    return Response(
                        ConversationSerializer(conversation).data
                    )

            conversation = Conversation.objects.create(
    started_by=request.user
)

            conversation.participants.add(
                request.user,
                other_user,
            )

            return Response(
                ConversationSerializer(conversation).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
    

class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {"error": "You are not part of this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = SendMessageSerializer(data=request.data)

        if serializer.is_valid():
            message = serializer.save(
                sender=request.user,
                conversation=conversation,
            )

            return Response(
                MessageSerializer(message).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
    
class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(
                id=conversation_id
            )
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not conversation.participants.filter(
            id=request.user.id
        ).exists():
            return Response(
                {"error": "You are not part of this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ConversationSerializer(conversation)

        return Response(serializer.data)
