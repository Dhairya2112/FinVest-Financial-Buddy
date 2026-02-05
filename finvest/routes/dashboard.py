from flask import Blueprint, render_template, session, redirect, url_for
from models import Transaction, Portfolio, Budget
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
def index():
    """Dashboard index page."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    # Get current month transactions
    current_month = datetime.now().month
    current_year = datetime.now().year

    transactions = Transaction.get_transactions(user_id)
    monthly_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income' and t['date'].month == current_month)
    monthly_expenses = sum(float(t['amount']) for t in transactions if t['type'] == 'expense' and t['date'].month == current_month)

    # Calculate total income and expenses (all time)
    total_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')
    total_expenses = sum(float(t['amount']) for t in transactions if t['type'] == 'expense')
    balance = total_income - total_expenses

    # Get recent transactions (last 5)
    recent_transactions = Transaction.get_transactions(user_id, sort_by='created_at', sort_order='DESC')[:5]

    # Get transaction category breakdown for current month
    transactions_last_30 = Transaction.get_transactions(user_id, date_from=(datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
    categories = {}
    for t in transactions_last_30:
        if t['type'] == 'expense':
            category = t['category']
            if category not in categories:
                categories[category] = 0
            categories[category] += t['amount']
    category_breakdown = [{'category': k, 'amount': v} for k, v in categories.items()]
    category_labels = [item['category'] for item in category_breakdown]
    category_data = [item['amount'] for item in category_breakdown]

    # Get budget status
    budget = Budget.get_budget(user_id)
    budget_spent = monthly_expenses if budget else 0

    return render_template('dashboard.html',
                         balance=balance,
                         monthly_income=monthly_income,
                         monthly_expenses=monthly_expenses,
                         total_income=total_income,
                         total_expenses=total_expenses,
                         recent_transactions=recent_transactions,
                         category_labels=category_labels,
                         category_data=category_data,
                         budget=budget,
                         budget_spent=budget_spent)
