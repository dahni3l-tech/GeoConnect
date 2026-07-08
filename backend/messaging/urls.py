from django.urls import path
from .views import (
    StartConversationView,
    SendMessageView,
    ConversationDetailView,
)

urlpatterns = [
    path(
        "start/",
        StartConversationView.as_view(),
        name="start_conversation",
    ),

    path(
        "<int:conversation_id>/send/",
        SendMessageView.as_view(),
        name="send_message",
    ),

    path(
    "<int:conversation_id>/",
    ConversationDetailView.as_view(),
    name="conversation_detail",
),
]