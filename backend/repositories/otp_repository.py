import datetime
from db import supabase_db

class OtpRepository:
    @staticmethod
    def create_otp(email, otp_code):
        """Create a new OTP request, expiring in 10 minutes. Includes rate limiting."""
        # Check rate limit (30 seconds)
        response = supabase_db.table("otp_requests").select("created_at").eq("email", email).order("created_at", desc=True).limit(1).execute()
        if response.data:
            last_created = datetime.datetime.fromisoformat(response.data[0]['created_at'].replace('Z', '+00:00'))
            if datetime.datetime.now(datetime.timezone.utc) < last_created + datetime.timedelta(seconds=30):
                raise Exception("Please wait 30 seconds before requesting another OTP.")

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
        """Get and validate an OTP code for an email. Invalidates OTP on failure to prevent brute-forcing."""
        response = supabase_db.table("otp_requests").select("*").eq("email", email).order("created_at", desc=True).limit(1).execute()
        if response.data:
            otp_record = response.data[0]
            
            # 1. ONE-SHOT SECURITY: Delete the OTP immediately to prevent brute-force guessing
            supabase_db.table("otp_requests").delete().eq("email", email).execute()

            # 2. Check if code matches
            if otp_record['otp_code'] != otp_code:
                return None

            # 3. Check expiration
            expires_at = datetime.datetime.fromisoformat(otp_record['expires_at'].replace('Z', '+00:00'))
            if datetime.datetime.now(datetime.timezone.utc) <= expires_at:
                return otp_record
        return None

    @staticmethod
    def delete_otp(email):
        """Clean up OTP after successful use."""
        supabase_db.table("otp_requests").delete().eq("email", email).execute()
