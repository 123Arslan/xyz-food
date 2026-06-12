from django.urls import path
from .views import signup, login, get_users, test_db, FoodListingListCreateView, FoodListingDetailView, get_food

urlpatterns = [
    path('signup/', signup, name='signup'),
    path('login/', login, name='login'),
    path('users/', get_users, name='get_users'),
    path('test-db/', test_db, name='test_db'),
    path('food-listings/', FoodListingListCreateView.as_view(), name='foodlisting-list-create'),
    path('food-listings/<int:pk>/', FoodListingDetailView.as_view(), name='foodlisting-detail'),
    path('get-food/', get_food, name='get-food'),
]
