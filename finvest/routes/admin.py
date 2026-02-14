from flask import Blueprint, render_template, redirect, url_for, session, flash, request
from functools import wraps
from models import User

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Access denied: Login required.', 'error')
            return redirect(url_for('auth.login'))
        
        user = User.get_user_by_id(session['user_id'])
        if not user or not user.get('is_admin'):
            flash('Access denied: Administrative privileges required.', 'error')
            return redirect(url_for('dashboard.index'))
        
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    stats = User.get_admin_stats()
    return render_template('admin/dashboard.html', stats=stats)

@admin_bp.route('/users')
@admin_required
def users():
    all_users = User.get_all_users()
    return render_template('admin/users.html', users=all_users)

@admin_bp.route('/promote', methods=['POST'])
@admin_required
def promote():
    email = request.form.get('email')
    if email:
        User.promote_to_admin(email)
        flash(f'User {email} promoted to Admin.', 'success')
    else:
        flash('Email is required for promotion.', 'error')
    return redirect(url_for('admin.users'))
