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
from email.mime.multipart import MIMEMultipart
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
    sender_email = os.environ.get('SMTP_USERNAME')
    sender_password = os.environ.get('SMTP_PASSWORD')
    
    if not sender_email or not sender_password:
        print("WARNING: Gmail credentials missing. Cannot send OTP.")
        return True
    
    msg = MIMEMultipart()
    msg['From'] = f"FinVest Representative <{sender_email}>"
    msg['To'] = to_email
    msg['Subject'] = "FinVest Account Verification"
    
    html_content = f"""
        <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f8fafc; padding: 40px; border-radius: 16px; border: 1px solid #27272a; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">FINVEST</h1>
          </div>
          <div style="background-color: #18181b; padding: 32px; border-radius: 12px; border: 1px solid #3f3f46; text-align: center;">
            <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Your Verification Code</p>
            <p style="margin: 0; font-size: 42px; font-family: 'SF Mono', Consolas, monospace; font-weight: 700; color: #10b981; letter-spacing: 12px;">{otp_code}</p>
          </div>
          <div style="margin-top: 32px; color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: left;">
            <p style="margin: 0 0 12px 0;">Hello,</p>
            <p style="margin: 0 0 12px 0;">You recently requested to sign in or create an account on FinVest. Please use the verification code above to securely authenticate your session.</p>
            <p style="margin: 0; color: #ef4444; font-size: 13px;">⚠️ <strong>Security Notice:</strong> This code expires in 10 minutes. If you did not initiate this request, please ignore this email and ensure your account is secure.</p>
          </div>
          <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #27272a; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px; font-weight: 500;">
              Developed and Architectured by Dhairya Dave
            </p>
            <p style="margin: 0;">
              <a href="https://www.linkedin.com/in/dhairya-dave-077773340/" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center;">
                Connect on LinkedIn &rarr;
              </a>
            </p>
          </div>
        </div>
    """
    
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email via Gmail: {e}")
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
