from django.contrib import admin
from .models import Profile, FoodItem, FoodListing, Donation, Feedback, Message

class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'account_type', 'contact_phone', 'created_at')
    list_filter = ('account_type', 'created_at')
    search_fields = ('user__email', 'full_name', 'contact_phone')

class FoodItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'donor_name', 'quantity', 'expiry_date', 'created_at')
    list_filter = ('expiry_date', 'created_at')
    search_fields = ('name', 'donor_name', 'description')

class FoodListingAdmin(admin.ModelAdmin):
    list_display = ('food_title', 'user', 'status', 'food_type', 'pickup_location', 'created_at')
    list_filter = ('status', 'food_type', 'created_at')
    search_fields = ('food_title', 'pickup_location', 'description')

class DonationAdmin(admin.ModelAdmin):
    list_display = ('id', 'donor_id', 'receiver_id', 'food_id', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('donor_id__email', 'receiver_id__email', 'food_id__food_title')

class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'food_id', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('comment', 'food_id__food_title')

admin.site.register(Profile, ProfileAdmin)
admin.site.register(FoodItem, FoodItemAdmin)
admin.site.register(FoodListing, FoodListingAdmin)
admin.site.register(Donation, DonationAdmin)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'receiver', 'food_listing', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('message_text', 'sender__email', 'receiver__email', 'food_listing__food_title')

admin.site.register(Feedback, FeedbackAdmin)
admin.site.register(Message, MessageAdmin)
