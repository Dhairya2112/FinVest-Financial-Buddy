from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import Transaction
from validators import validate_amount, validate_date, validate_category, validate_description
import json

tracker_bp = Blueprint('tracker', __name__, url_prefix='/tracker')

@tracker_bp.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    # Get filter parameters
    search = request.args.get('search', '')
    amount_min = request.args.get('amount_min')
    amount_max = request.args.get('amount_max')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    category = request.args.get('category')
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'DESC')

    # Convert amount filters to float
    try:
        amount_min = float(amount_min) if amount_min else None
        amount_max = float(amount_max) if amount_max else None
    except ValueError:
        amount_min = amount_max = None

    # Get transactions
    transactions = Transaction.get_transactions(
        user_id, search=search, amount_min=amount_min, amount_max=amount_max,
        date_from=date_from, date_to=date_to, category=category,
        sort_by=sort_by, sort_order=sort_order
    )

    from datetime import datetime
    today = datetime.now().strftime('%Y-%m-%d')
    return render_template('tracker.html', transactions=transactions, today=today)

@tracker_bp.route('/add', methods=['POST'])
def add_transaction():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']

    # Get form data
    amount = request.form.get('amount')
    transaction_type = request.form.get('type')
    date = request.form.get('date')
    category = request.form.get('category')
    description = request.form.get('description', '')

    # Validate input
    if not validate_amount(amount):
        flash('Amount must be positive', 'error')
        return redirect(url_for('tracker.index'))

    if transaction_type not in ['income', 'expense']:
        flash('Invalid transaction type', 'error')
        return redirect(url_for('tracker.index'))

    # Check if date is not in the future
    from datetime import datetime
    try:
        transaction_date = datetime.strptime(date, '%Y-%m-%d').date()
        today = datetime.now().date()
        if transaction_date > today:
            flash('Cannot add transactions for future dates', 'error')
            return redirect(url_for('tracker.index'))
    except ValueError:
        flash('Invalid date format', 'error')
        return redirect(url_for('tracker.index'))

    if not validate_date(date):
        flash('Invalid date format', 'error')
        return redirect(url_for('tracker.index'))

    if not validate_category(category):
        flash('Invalid category', 'error')
        return redirect(url_for('tracker.index'))

    if not validate_description(description):
        flash('Description too long', 'error')
        return redirect(url_for('tracker.index'))

    # Get current totals for validation
    all_transactions = Transaction.get_transactions(user_id)
    current_income = sum(float(t['amount']) for t in all_transactions if t['type'] == 'income')
    current_expenses = sum(float(t['amount']) for t in all_transactions if t['type'] == 'expense')

    amount_float = float(amount)

    if transaction_type == 'expense':
        # Check if this expense would make expenses > income
        if current_expenses + amount_float > current_income:
            flash('Cannot add expense: Total expenses would exceed total income', 'error')
            return redirect(url_for('tracker.index'))

        # Check if this expense would make balance negative
        potential_balance = current_income - (current_expenses + amount_float)
        if potential_balance < 0:
            flash('Cannot add expense: This would result in a negative balance', 'error')
            return redirect(url_for('tracker.index'))

    # Add transaction
    try:
        Transaction.add_transaction(user_id, amount_float, transaction_type, date, category, description)
        flash('Transaction added successfully', 'success')
        # Redirect to budget page so user can see updated spending
        return redirect(url_for('budget.index'))
    except Exception as e:
        flash('Failed to add transaction', 'error')
        return redirect(url_for('tracker.index'))

@tracker_bp.route('/delete/<int:transaction_id>', methods=['POST'])
def delete_transaction(transaction_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']

    try:
        Transaction.delete_transaction(user_id, transaction_id)
        flash('Transaction deleted successfully', 'success')
    except Exception as e:
        flash('Failed to delete transaction', 'error')

    return redirect(url_for('tracker.index'))

@tracker_bp.route('/api/transactions')
def api_transactions():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']

    # Get filter parameters
    search = request.args.get('search', '')
    amount_min = request.args.get('amount_min')
    amount_max = request.args.get('amount_max')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    category = request.args.get('category')

    try:
        amount_min = float(amount_min) if amount_min else None
        amount_max = float(amount_max) if amount_max else None
    except ValueError:
        amount_min = amount_max = None

    transactions = Transaction.get_transactions(
        user_id, search=search, amount_min=amount_min, amount_max=amount_max,
        date_from=date_from, date_to=date_to, category=category
    )

    return jsonify(transactions)
