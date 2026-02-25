import datetime
from db import supabase_db
from werkzeug.security import generate_password_hash, check_password_hash
from encryption_utils import DataCipher

class UserRepository:
    @staticmethod
    def create_user(name, email, password):
        """Create a new user securely in Supabase."""
        hashed_password = generate_password_hash(password)
        data = {
            "name": DataCipher.encrypt(name),
            "email": email,
            "password_hash": hashed_password,
            "created_at": datetime.datetime.now().isoformat()
        }
        response = supabase_db.table("users").insert(data).execute()
        return response.data

    @staticmethod
    def get_user_by_email(email):
        """Get user by email from Supabase and decrypt name."""
        response = supabase_db.table("users").select("*").eq("email", email).execute()
        if response.data:
            user = response.data[0]
            user['name'] = DataCipher.decrypt(user['name'])
            return user
        return None

    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID from Supabase and decrypt name."""
        response = supabase_db.table("users").select("*").eq("id", user_id).execute()
        if response.data:
            user = response.data[0]
            user['name'] = DataCipher.decrypt(user['name'])
            return user
        return None

    @staticmethod
    def promote_to_admin(email):
        """Promote a user to admin."""
        response = supabase_db.table("users").update({"is_admin": True}).eq("email", email).execute()
        return response.data

    @staticmethod
    def verify_password(password_hash, password):
        """Verify user password."""
        return check_password_hash(password_hash, password)
