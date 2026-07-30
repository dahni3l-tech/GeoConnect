from django.urls import path
from .views import PushSubscriptionView

urlpatterns = [
    path("subscribe/", PushSubscriptionView.as_view(), name="push-subscribe"),
    path("unsubscribe/", PushSubscriptionView.as_view(), name="push-unsubscribe"),
]
