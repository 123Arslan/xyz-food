from django.urls import path
from .views import signup, login, get_users, test_db, FoodListingListCreateView, FoodListingDetailView, get_food, claim_food, complete_transaction, my_claims, post_feedback, admin_stats, admin_listings, admin_delete_listing, admin_users, admin_toggle_ban_user, send_message, chat_history

urlpatterns = [
    path('signup/', signup, name='signup'),
    path('login/', login, name='login'),
    path('users/', get_users, name='get_users'),
    path('test-db/', test_db, name='test_db'),
    path('food-listings/', FoodListingListCreateView.as_view(), name='foodlisting-list-create'),
    path('food-listings/<int:pk>/', FoodListingDetailView.as_view(), name='foodlisting-detail'),
    path('get-food/', get_food, name='get-food'),
    path('claim-food/<int:food_id>/', claim_food, name='claim-food'),
    path('complete-transaction/<int:food_id>/', complete_transaction, name='complete-transaction'),
    path('my-claims/', my_claims, name='my-claims'),
    path('feedback/', post_feedback, name='post_feedback'),
    path('admin/stats/', admin_stats, name='admin_stats'),
    path('admin/listings/', admin_listings, name='admin_listings'),
    path('admin/listings/<int:pk>/', admin_delete_listing, name='admin_delete_listing'),
    path('admin/users/', admin_users, name='admin_users'),
    path('admin/users/<int:user_id>/ban/', admin_toggle_ban_user, name='admin_toggle_ban_user'),
    path('chat/send/', send_message, name='send_message'),
    path('chat/history/<int:listing_id>/', chat_history, name='chat_history'),
]
