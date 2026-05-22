from django.urls import path
from .views import signup, login, get_users, test_db

urlpatterns = [
    path('signup/', signup, name='signup'),
    path('login/', login, name='login'),
    path('users/', get_users, name='get_users'),
    path('test-db/', test_db, name='test_db'),
]
