from flask import Blueprint, jsonify, request
from repositories.user_repository import UserRepository
import re
import jwt
import datetime
import os
import random
import string
import requests
from repositories.otp_repository import OtpRepository

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.environ.get('SECRET_KEY', 'finvest-industry-grade-secret-jwt-key-2026')

def validate_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.now() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def send_otp_email(to_email, otp_code):
    resend_api_key = os.environ.get('RESEND_API_KEY')
    if not resend_api_key:
        print("WARNING: RESEND_API_KEY missing. Cannot send OTP.")
        return True
    
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {resend_api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "from": "FinVest Security <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "FinVest Terminal Verification Code",
        "html": f"""
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #1a1a1a;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">FINVEST TERMINAL</h1>
          </div>
          <div style="background-color: #111111; padding: 30px; border-radius: 8px; border: 1px solid #222222; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #888888; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Secure Authorization Code</p>
            <p style="margin: 0; font-size: 36px; font-family: monospace; font-weight: bold; color: #7FFF00; letter-spacing: 8px;">{otp_code}</p>
          </div>
          <p style="color: #666666; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 30px;">
            This access code will expire in 10 minutes. If you did not request this authorization, please secure your account.
          </p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1a1a1a; text-align: center;">
            <p style="margin: 0; color: #444444; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">
              Engineered & Developed by Dhairya Dave
            </p>
          </div>
        </div>
        """
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Failed to send email via Resend: {e}")
        return False

@auth_bp.route('/api/auth/request-otp', methods=['POST'])
def request_otp():
    try:
        data = request.json
        email = data.get('email')
        req_type = data.get('type', 'login') # 'login' or 'register'

        if not email or not validate_email(email):
            return jsonify({"status": "error", "message": "Valid email is required"}), 400

        user = UserRepository.get_user_by_email(email)
        
        if req_type == 'login' and not user:
            return jsonify({"status": "error", "message": "Account not found. Please register."}), 404
            
        if req_type == 'register' and user:
            return jsonify({"status": "error", "message": "Email already registered. Please login."}), 409

        # Generate 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        OtpRepository.create_otp(email, otp_code)
        send_otp_email(email, otp_code)
        return jsonify({"status": "success", "message": "OTP sent successfully"})
    except Exception as e:
        print("OTP Request Error:", str(e))
        return jsonify({"status": "error", "message": "Backend Error: " + str(e)}), 500

@auth_bp.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        email = data.get('email')
        otp_code = data.get('otp')
        name = data.get('name')
        req_type = data.get('type', 'login')

        if not email or not otp_code:
            return jsonify({"status": "error", "message": "Email and OTP are required"}), 400

        # Validate OTP
        valid_otp = OtpRepository.get_otp(email, otp_code)
        if not valid_otp:
            return jsonify({"status": "error", "message": "Invalid or expired OTP"}), 401

        user = UserRepository.get_user_by_email(email)
        is_new_user = False
        
        if req_type == 'register':
            if user:
                return jsonify({"status": "error", "message": "Account already exists"}), 409
            if not name:
                return jsonify({"status": "error", "message": "Name is required for registration"}), 400
                
            dummy_password = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
            user_data = UserRepository.create_user(name, email, dummy_password)
            user = user_data[0]
            is_new_user = True
        else:
            if not user:
                return jsonify({"status": "error", "message": "Account not found"}), 404
            
        token = generate_token(user['id'])
        OtpRepository.delete_otp(email) # Cleanup
        
        return jsonify({
            "status": "success",
            "token": token,
            "is_new_user": is_new_user,
            "data": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "is_admin": user.get('is_admin')
            }
        })
    except Exception as e:
        print("OTP Verification Error:", str(e))
        return jsonify({"status": "error", "message": "Backend Error: " + str(e)}), 500

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({"status": "success", "message": "Logged out successfully"})

from auth_middleware import token_required

@auth_bp.route('/api/auth/me', methods=['GET'])
@token_required
def me(current_user_id):
    user = UserRepository.get_user_by_id(current_user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
        
    return jsonify({
        "status": "success",
        "data": {
            "id": user['id'],
            "name": user['name'],
            "is_admin": user.get('is_admin')
        }
    })
