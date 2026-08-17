from flask import Blueprint, jsonify, request
from repositories.user_repository import UserRepository
import re
import jwt
import datetime
import os
import random
import string
import smtplib
from email.mime.text import MIMEText
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
    smtp_server = os.environ.get('SMTP_SERVER')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USERNAME')
    smtp_pass = os.environ.get('SMTP_PASSWORD')

    if not smtp_server or not smtp_user or not smtp_pass:
        print(f"WARNING: SMTP not configured. OTP for {to_email} is {otp_code}")
        return True

    msg = MIMEText(
        f"Your FinVest verification code is: {otp_code}\n\n"
        f"This code will expire in 10 minutes.\n\n"
        f"- FinVest System\n\n"
        f"------------------------\n"
        f"FinVest is proudly designed and engineered by Dhairya Dave."
    )
    msg['Subject'] = 'FinVest Terminal Verification Code'
    msg['From'] = f"FinVest System <{smtp_user}>"
    msg['To'] = to_email

    try:
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=5)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False

@auth_bp.route('/api/auth/request-otp', methods=['POST'])
def request_otp():
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
    
    try:
        OtpRepository.create_otp(email, otp_code)
        send_otp_email(email, otp_code)
        return jsonify({"status": "success", "message": "OTP sent successfully"})
    except Exception as e:
        print("OTP Request Error:", str(e))
        return jsonify({"status": "error", "message": "Failed to process OTP request"}), 500

@auth_bp.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
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

    try:
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
        return jsonify({"status": "error", "message": "Verification failed"}), 500

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
