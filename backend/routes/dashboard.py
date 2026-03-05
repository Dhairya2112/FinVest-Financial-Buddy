from flask import Blueprint, jsonify, session, request
from repositories.transaction_repository import TransactionRepository
from repositories.budget_repository import BudgetRepository
from repositories.portfolio_repository import PortfolioRepository
from datetime import datetime, timedelta

from auth_middleware import token_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
@token_required
def index(current_user_id):
    """Dashboard API endpoint."""
    user_id = current_user_id

    current_month = datetime.now().month
    transactions = TransactionRepository.get_transactions(user_id)
    
    def get_month(date_str):
        if isinstance(date_str, str):
            try:
                return datetime.strptime(date_str.split(' ')[0], '%Y-%m-%d').month
            except ValueError:
                return -1
        return date_str.month if hasattr(date_str, 'month') else -1

    monthly_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income' and get_month(t['date']) == current_month)
    monthly_expenses = sum(float(t['amount']) for t in transactions if t['type'] == 'expense' and get_month(t['date']) == current_month)

    total_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')
    total_expenses = sum(float(t['amount']) for t in transactions if t['type'] == 'expense')
    balance = total_income - total_expenses

    recent_transactions = TransactionRepository.get_transactions(user_id, sort_by='date', sort_order='DESC')[:50]
    budget = BudgetRepository.get_budget(user_id)
    
    # ---------------------------------------------------------
    # DAILY ACTION CENTER (Insight Generation Logic)
    # ---------------------------------------------------------
    insights = []
    
    # 1. Onboarding check
    if not budget:
        insights.append({
            "type": "warning",
            "title": "Set your Budget",
            "message": "You haven't defined a monthly budget yet.",
            "action": "Set Budget"
        })
    else:
        # 2. Budget threshold checks
        budget_limit = float(budget['monthly_budget'])
        if budget_limit > 0:
            spent_percentage = (monthly_expenses / budget_limit) * 100
            if spent_percentage > 90:
                insights.append({
                    "type": "danger",
                    "title": "Critical Budget Alert",
                    "message": f"You have spent {spent_percentage:.1f}% of your monthly budget. Slow down!"
                })
            elif spent_percentage > 75:
                insights.append({
                    "type": "warning",
                    "title": "Approaching Limit",
                    "message": f"You are at {spent_percentage:.1f}% of your budget."
                })

    # 3. Engagement check (Have they logged anything lately?)
    def get_date(date_str):
        if isinstance(date_str, str):
            try:
                return datetime.strptime(date_str.split(' ')[0], '%Y-%m-%d').date()
            except ValueError:
                return datetime.now().date()
        return date_str.date() if hasattr(date_str, 'date') else datetime.now().date()

    if not recent_transactions or (datetime.now().date() - get_date(recent_transactions[0]['date'])).days > 3:
        insights.append({
            "type": "info",
            "title": "Log your expenses",
            "message": "You haven't logged any transactions in over 3 days. Stay on top of your finances!",
            "action": "Log Now"
        })

    return jsonify({
        "status": "success",
        "data": {
            "metrics": {
                "balance": balance,
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "total_income": total_income,
            },
            "recent_transactions": recent_transactions,
            "budget": budget,
            "insights": insights
        }
    })
