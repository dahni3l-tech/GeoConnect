from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    ChangePasswordView,
    ForgotPasswordView,
    ResetPasswordView,
    UserSearchView,
    SendFriendRequestView,
    AcceptFriendRequestView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("reset-password/<uidb64>/<token>/", ResetPasswordView.as_view(), name="reset_password"),
    path( "users/search/", UserSearchView.as_view(), name="user_search"),
    path("friend-requests/", SendFriendRequestView.as_view(), name="friend_requests",),
    path("friend-requests/<int:pk>/accept/", AcceptFriendRequestView.as_view(), name="accept_friend_request",),
]