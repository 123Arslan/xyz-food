from django.conf import settings
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ACCOUNT_TYPE_CHOICES = (
        ('Donor', 'Donor'),
        ('Receiver', 'Receiver'),
        ('Organization', 'Organization'),
        ('Admin', 'Admin'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default='Donor')
    contact_phone = models.CharField(max_length=30, blank=True, default='')
    instructions = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.account_type}"

class FoodListing(models.Model):
    FOOD_TYPE_CHOICES = (
        ('Veg', 'Veg'),
        ('Non-Veg', 'Non-Veg'),
        ('Cooked', 'Cooked Food'),
        ('Dry', 'Dry Rations'),
    )

    STATUS_CHOICES = (
        ('Available', 'Available'),
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='food_listings'
    )
    food_title = models.CharField(max_length=255)
    food_type = models.CharField(max_length=20, choices=FOOD_TYPE_CHOICES)
    quantity = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    pickup_time = models.DateTimeField()
    expiry_time = models.DateTimeField(blank=True, null=True)
    pickup_location = models.CharField(max_length=500)
    contact_phone = models.CharField(max_length=30)
    food_image_url = models.URLField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    created_at = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.food_title} - {self.food_type} ({self.user})"
class FoodItem(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    quantity = models.IntegerField()
    expiry_date = models.DateField()
    donor_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Donation(models.Model):
    donor_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='donations_made', db_column='donor_id')
    receiver_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='donations_received', db_column='receiver_id')
    food_id = models.ForeignKey(FoodListing, on_delete=models.CASCADE, related_name='donations', db_column='food_id')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Donation of {self.food_id.food_title} from {self.donor_id.email} to {self.receiver_id.email}"

class Feedback(models.Model):
    rating = models.IntegerField()
    comment = models.TextField()
    food_id = models.ForeignKey(FoodListing, on_delete=models.CASCADE, related_name='feedbacks', db_column='food_id')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.food_id.food_title} - {self.rating} Stars"

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    food_listing = models.ForeignKey(FoodListing, on_delete=models.CASCADE, related_name='messages')
    message_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message from {self.sender.email} to {self.receiver.email} on {self.food_listing.food_title}"
