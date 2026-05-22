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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.account_type}"

class FoodItem(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    quantity = models.IntegerField()
    expiry_date = models.DateField()
    donor_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
