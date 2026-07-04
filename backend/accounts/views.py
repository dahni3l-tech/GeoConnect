from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
)

from .models import User
from .serializers import RegisterSerializer, LoginSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
class LoginView(APIView):
    def post(self, request):
        print(request.data)

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]
            
            refresh = RefreshToken.for_user(user)
            return Response({
    "message": "Login successful",
    "user": {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    },
    "tokens": {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }
})

            print(user)
            print(user.username)
            print(user.email)

            return Response(
                {"message": "Login validation successful!"}
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )   
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)

        return Response(serializer.data)