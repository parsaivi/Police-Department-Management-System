from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

from apps.common.models import TimeStampedModel


class User(AbstractUser):
    """
    Custom User model with unique identifiers for multi-field authentication.
    Supports login via username, email, phone, or national_id.
    """
    
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    national_id = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        help_text="National ID (کد ملی)"
    )
    
    # Profile fields
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    
    # Complaint tracking for 3-strike rule
    invalid_complaints_count = models.PositiveSmallIntegerField(default=0)
    is_blocked_from_complaints = models.BooleanField(default=False)
    
    # Suspect/Criminal tracking
    is_suspect = models.BooleanField(default=False)
    is_criminal = models.BooleanField(default=False)
    
    REQUIRED_FIELDS = ["email", "first_name", "last_name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"

    def get_roles(self):
        """Return list of role names (groups) for this user."""
        return list(self.groups.values_list("name", flat=True))

    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role."""
        return self.groups.filter(name=role_name).exists()

    def add_role(self, role_name: str):
        """Add a role to this user."""
        group, _ = Group.objects.get_or_create(name=role_name)
        self.groups.add(group)

    def remove_role(self, role_name: str):
        """Remove a role from this user."""
        try:
            group = Group.objects.get(name=role_name)
            self.groups.remove(group)
        except Group.DoesNotExist:
            pass


class DefaultRoles:
    """
    Default role names for the system.
    These are NOT hardcoded in business logic - they're just initial seeds.
    New roles can be created dynamically without code changes.
    """
    
    ADMINISTRATOR = "Administrator"
    CHIEF = "Chief"
    CAPTAIN = "Captain"
    SERGEANT = "Sergeant"
    DETECTIVE = "Detective"
    POLICE_OFFICER = "Police Officer"
    PATROL_OFFICER = "Patrol Officer"
    CADET = "Cadet"
    COMPLAINANT = "Complainant"
    WITNESS = "Witness"
    SUSPECT = "Suspect"
    CRIMINAL = "Criminal"
    JUDGE = "Judge"
    CORONARY = "Coronary"
    BASE_USER = "Base User"
    
    @classmethod
    def get_all(cls):
        return [
            cls.ADMINISTRATOR,
            cls.CHIEF,
            cls.CAPTAIN,
            cls.SERGEANT,
            cls.DETECTIVE,
            cls.POLICE_OFFICER,
            cls.PATROL_OFFICER,
            cls.CADET,
            cls.COMPLAINANT,
            cls.WITNESS,
            cls.SUSPECT,
            cls.CRIMINAL,
            cls.JUDGE,
            cls.CORONARY,
            cls.BASE_USER,
        ]

    @classmethod
    def get_police_ranks(cls):
        """Get all police-related roles (excluding civilians)."""
        return [
            cls.CHIEF,
            cls.CAPTAIN,
            cls.SERGEANT,
            cls.DETECTIVE,
            cls.POLICE_OFFICER,
            cls.PATROL_OFFICER,
            cls.CADET,
        ]
