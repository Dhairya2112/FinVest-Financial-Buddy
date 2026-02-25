import datetime
from db import supabase_db

class OtpRepository:
    @staticmethod
    def create_otp(email, otp_code):
        """Create a new OTP request, expiring in 10 minutes."""
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)
        data = {
            "email": email,
            "otp_code": otp_code,
            "expires_at": expires_at.isoformat()
        }
        # Clear any existing OTPs for this email to prevent spam
        supabase_db.table("otp_requests").delete().eq("email", email).execute()
        
        response = supabase_db.table("otp_requests").insert(data).execute()
        return response.data

    @staticmethod
    def get_otp(email, otp_code):
        """Get and validate an OTP code for an email."""
        response = supabase_db.table("otp_requests").select("*").eq("email", email).eq("otp_code", otp_code).execute()
        if response.data:
            otp_record = response.data[0]
            # Check expiration
            expires_at = datetime.datetime.fromisoformat(otp_record['expires_at'].replace('Z', '+00:00'))
            if datetime.datetime.now(datetime.timezone.utc) <= expires_at:
                return otp_record
        return None

    @staticmethod
    def delete_otp(email):
        """Clean up OTP after successful use."""
        supabase_db.table("otp_requests").delete().eq("email", email).execute()
