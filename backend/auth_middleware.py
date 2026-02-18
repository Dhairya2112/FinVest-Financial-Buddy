import jwt
import os
from functools import wraps
from flask import request, jsonify

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if token is in the headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'status': 'error', 'message': 'Token is missing!'}), 401

        try:
            # Decode the token
            secret_key = os.environ.get('SECRET_KEY', 'finvest-industry-grade-secret-jwt-key-2026')
            data = jwt.decode(token, secret_key, algorithms=["HS256"])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'status': 'error', 'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'status': 'error', 'message': 'Token is invalid!'}), 401

        return f(current_user_id, *args, **kwargs)
    
    return decorated
