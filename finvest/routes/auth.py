from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from models import User
from validators import validate_email, validate_password, validate_name
from db import execute_query
from werkzeug.security import generate_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Validate input
        if not validate_email(email):
            flash('Invalid email format', 'error')
            return render_template('login.html')

        if not validate_password(password):
            flash('Password must be at least 6 characters', 'error')
            return render_template('login.html')

        # Check user
        user = User.get_user_by_email(email)
        if user and User.verify_password(user['password_hash'], password):
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            session['is_admin'] = bool(user.get('is_admin'))
            flash('Login successful', 'success')
            
            if session['is_admin']:
                return redirect(url_for('admin.dashboard'))
            return redirect(url_for('dashboard.index'))
        else:
            flash('Invalid email or password', 'error')

    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        # Validate input
        if not validate_name(name):
            flash('Name must be 2-50 characters', 'error')
            return render_template('register.html')

        if not validate_email(email):
            flash('Invalid email format', 'error')
            return render_template('register.html')

        if not validate_password(password):
            flash('Password must be at least 6 characters', 'error')
            return render_template('register.html')

        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('register.html')

        # Check if user exists
        if User.get_user_by_email(email):
            flash('Email already registered', 'error')
            return render_template('register.html')

        # Create user
        try:
            User.create_user(name, email, password)
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            flash('Registration failed. Please try again.', 'error')

    return render_template('register.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']
    user = User.get_user_by_id(user_id)

    if request.method == 'POST':
        # Check which form is being submitted
        if 'name' in request.form:  # Profile edit form
            name = request.form.get('name')
            email = request.form.get('email')
            current_password = request.form.get('current_password')

            # Validate input
            if not validate_name(name):
                flash('Invalid name format.', 'error')
                return redirect(url_for('auth.profile'))

            if not validate_email(email):
                flash('Invalid email format.', 'error')
                return redirect(url_for('auth.profile'))

            # Check if email is already taken by another user
            existing_user = User.get_user_by_email(email)
            if existing_user and existing_user['id'] != user_id:
                flash('Email already in use.', 'error')
                return redirect(url_for('auth.profile'))

            # Verify current password for profile changes
            if not User.verify_password(user['password_hash'], current_password):
                flash('Current password is incorrect.', 'error')
                return redirect(url_for('auth.profile'))

            # Update user info
            try:
                query = "UPDATE users SET name = %s, email = %s WHERE id = %s"
                execute_query(query, (name, email, user_id))
                session['user_name'] = name
                flash('Profile updated successfully!', 'success')
                return redirect(url_for('auth.profile'))
            except Exception as e:
                flash('Error updating profile.', 'error')

        elif 'new_password' in request.form:  # Password change form
            current_password = request.form.get('current_password')
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')

            # Validate input
            if not User.verify_password(user['password_hash'], current_password):
                flash('Current password is incorrect.', 'error')
                return redirect(url_for('auth.profile'))

            if new_password != confirm_password:
                flash('New passwords do not match.', 'error')
                return redirect(url_for('auth.profile'))

            if not validate_password(new_password):
                flash('New password must be at least 6 characters.', 'error')
                return redirect(url_for('auth.profile'))

            # Update password
            try:
                hashed_password = generate_password_hash(new_password)
                query = "UPDATE users SET password_hash = %s WHERE id = %s"
                execute_query(query, (hashed_password, user_id))
                flash('Password updated successfully!', 'success')
                return redirect(url_for('auth.profile'))
            except Exception as e:
                flash('Error updating password.', 'error')

    return render_template('profile.html', user=user)
