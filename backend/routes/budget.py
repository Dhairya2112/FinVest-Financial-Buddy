from flask import Blueprint, jsonify, request
from repositories.budget_repository import BudgetRepository
from repositories.transaction_repository import TransactionRepository
from auth_middleware import token_required

budget_bp = Blueprint('budget', __name__)

@budget_bp.route('/api/budget', methods=['GET'])
@token_required
def get_budget(current_user_id):
    """Budget API endpoint."""
    user_id = current_user_id

    # Fetch existing budget
    budget = BudgetRepository.get_budget(user_id)
    transactions = TransactionRepository.get_transactions(user_id)

    from datetime import datetime
    current_month = datetime.now().month

    def get_month(date_str):
        if isinstance(date_str, str):
            try:
                return datetime.strptime(date_str.split(' ')[0], '%Y-%m-%d').month
            except ValueError:
                return -1
        return date_str.month if hasattr(date_str, 'month') else -1

    # Calculate current month spending
    spent = sum(float(t['amount']) for t in transactions if t['type'] == 'expense' and get_month(t['date']) == current_month)
    all_time_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')

    # Category breakdown
    category_breakdown = {}
    for t in transactions:
        if t['type'] == 'expense':
            cat = t.get('category', 'Uncategorized')
            category_breakdown[cat] = category_breakdown.get(cat, 0) + float(t['amount'])
            
    # Sort categories by spent amount descending
    sorted_categories = [{"category": k, "amount": v} for k, v in sorted(category_breakdown.items(), key=lambda item: item[1], reverse=True)]

    if budget:
        budget_amount = float(budget['monthly_budget'])
        remaining = budget_amount - spent
    else:
        budget_amount = 0
        remaining = 0

    return jsonify({
        "status": "success",
        "data": {
            "budget_amount": budget_amount,
            "spent": spent,
            "remaining": remaining,
            "total_income": all_time_income,
            "category_breakdown": sorted_categories,
            "transactions": transactions[:10]
        }
    })

@budget_bp.route('/api/budget/set', methods=['POST'])
@token_required
def set_budget(current_user_id):
    """Set the budget."""
    data = request.json
    monthly_budget = data.get('monthly_budget')

    if not monthly_budget or float(monthly_budget) <= 0:
        return jsonify({"status": "error", "message": "Budget must be a positive number."}), 400

    try:
        BudgetRepository.set_budget(current_user_id, float(monthly_budget))
        return jsonify({"status": "success", "message": "Budget set successfully"})
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to set budget."}), 500

@budget_bp.route('/api/budget/micro', methods=['GET'])
@token_required
def get_micro_budgets(current_user_id):
    """Get all category micro-budgets."""
    try:
        budgets = BudgetRepository.get_category_budgets(current_user_id)
        return jsonify({
            "status": "success",
            "data": budgets
        })
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to fetch micro-budgets."}), 500

@budget_bp.route('/api/budget/micro/set', methods=['POST'])
@token_required
def set_micro_budget(current_user_id):
    """Set a category micro-budget."""
    data = request.json
    category = data.get('category')
    amount = data.get('amount')

    if not category:
        return jsonify({"status": "error", "message": "Category is required."}), 400

    try:
        BudgetRepository.set_category_budget(current_user_id, category, float(amount))
        return jsonify({"status": "success", "message": "Micro-budget updated"})
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to update micro-budget."}), 500
