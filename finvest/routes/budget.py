from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import Budget, CategoryBudget, Transaction
from validators import validate_amount
from db import execute_query
from datetime import datetime

budget_bp = Blueprint('budget', __name__, url_prefix='/budget')

@budget_bp.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    transactions = Transaction.get_transactions(user_id)
    
    # Calculate all-time income
    all_time_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')
    
    # Set budget to all-time income
    try:
        if all_time_income > 0:
            Budget.set_budget(user_id, all_time_income)
            budget = Budget.get_budget(user_id)
        else:
            budget = None
    except ValueError:
        budget = None
    
    # Use all-time income for display
    total_income = all_time_income

    # Calculate all-time spending
    spent = sum(float(t['amount']) for t in transactions if t['type'] == 'expense')
    
    remaining = (float(budget['monthly_budget']) - spent) if budget else 0

    # Get category budgets and spending
    category_budgets = CategoryBudget.get_category_budgets(user_id)
    category_spending = CategoryBudget.get_category_spending(user_id, months=None)

    # Get all expenses
    all_expenses = []
    for t in transactions:
        if t['type'] == 'expense':
            expense = dict(t)
            expense['amount'] = float(expense['amount'])
            all_expenses.append(expense)
    recent_expenses = all_expenses[:10]

    # Convert Decimal values to float for template compatibility
    if budget:
        budget = dict(budget)
        budget['monthly_budget'] = float(budget['monthly_budget'])

    # Convert category budgets to float
    category_budgets = [dict(cb) for cb in category_budgets]
    for cb in category_budgets:
        cb['monthly_budget'] = float(cb['monthly_budget'])

    # Convert category spending to float
    category_spending = [dict(cs) for cs in category_spending]
    for cs in category_spending:
        cs['total_spent'] = float(cs['total_spent'])

    # Calculate all-time category spending
    all_time_category_spending = {}
    for t in transactions:
        if t['type'] == 'expense':
            cat = t.get('category', 'Other')
            if cat not in all_time_category_spending:
                all_time_category_spending[cat] = 0
            all_time_category_spending[cat] += float(t['amount'])

    # Build category budgets with spending info
    for cb in category_budgets:
        cat = cb.get('category')
        spent_amt = float(all_time_category_spending.get(cat, 0))
        cb['spent_amount'] = spent_amt
        cb['remaining'] = cb['monthly_budget'] - spent_amt
        cb['percentage'] = (spent_amt / cb['monthly_budget'] * 100) if cb['monthly_budget'] > 0 else 0
        # choose progress class for visual state
        if cb['percentage'] >= 100:
            cb['progress_class'] = 'bg-danger'
            cb['alert'] = True
        elif cb['percentage'] >= 75:
            cb['progress_class'] = 'bg-warning'
            cb['alert'] = False
        else:
            cb['progress_class'] = 'bg-success'
            cb['alert'] = False

    # Calculate total allocated budget
    total_allocated = sum(cb['monthly_budget'] for cb in category_budgets)

    return render_template('budget.html', budget=budget, spent=spent, remaining=remaining,
                         recent_expenses=recent_expenses, category_budgets=category_budgets,
                         category_spending=category_spending, total_income=total_income,
                         total_allocated=total_allocated, current_allocated=total_allocated)

@budget_bp.route('/set', methods=['POST'])
def set_budget():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']
    monthly_budget = request.form.get('monthly_budget')

    if not validate_amount(monthly_budget):
        flash('Budget must be positive', 'error')
        return redirect(url_for('budget.index'))

    try:
        Budget.set_budget(user_id, float(monthly_budget))
        flash('Budget set successfully', 'success')
    except ValueError as e:
        flash(str(e), 'error')
    except Exception as e:
        flash('Failed to set budget', 'error')

    return redirect(url_for('budget.index'))

@budget_bp.route('/api/budget')
def api_budget():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']
    budget = Budget.get_budget(user_id)

    if budget:
        return jsonify(budget)
    else:
        return jsonify({'monthly_budget': 0})

@budget_bp.route('/reset', methods=['POST'])
def reset_budget():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    user_id = session['user_id']

    try:
        # Delete the current budget
        query = "DELETE FROM budgets WHERE user_id = %s"
        execute_query(query, (user_id,))

        return jsonify({'success': True, 'message': 'Budget reset successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@budget_bp.route('/api/category-budgets')
def api_category_budgets():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']
    budgets = CategoryBudget.get_category_budgets(user_id)
    return jsonify(budgets)

@budget_bp.route('/api/category-budgets', methods=['POST'])
def api_set_category_budget():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    user_id = session['user_id']
    data = request.get_json()
    category = data.get('category')
    monthly_budget = data.get('monthly_budget')

    if not category or not monthly_budget:
        return jsonify({'success': False, 'message': 'Category and budget are required'}), 400

    if not validate_amount(str(monthly_budget)):
        return jsonify({'success': False, 'message': 'Budget must be positive'}), 400

    try:
        CategoryBudget.set_category_budget(user_id, category, float(monthly_budget))
        return jsonify({'success': True, 'message': 'Category budget set successfully'})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@budget_bp.route('/api/category-budgets/<category>', methods=['DELETE'])
def api_delete_category_budget(category):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    user_id = session['user_id']

    try:
        CategoryBudget.delete_category_budget(user_id, category)
        return jsonify({'success': True, 'message': 'Category budget deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@budget_bp.route('/api/category-spending')
def api_category_spending():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']
    spending = CategoryBudget.get_category_spending(user_id)
    return jsonify(spending)

@budget_bp.route('/api/available-months')
def api_available_months():
    """Get all available transaction months."""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']
    transactions = Transaction.get_transactions(user_id)
    
    months = set()
    for t in transactions:
        t_date = t['date']
        if isinstance(t_date, str):
            try:
                date_str = t_date.split(' ')[0]
                transaction_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                continue
        elif hasattr(t_date, 'date'):
            transaction_date = t_date.date()
        else:
            transaction_date = t_date
        
        month_key = transaction_date.strftime('%Y-%m')
        months.add(month_key)
    
    # Sort months in reverse (newest first)
    sorted_months = sorted(list(months), reverse=True)
    
    return jsonify({'months': sorted_months})

@budget_bp.route('/api/budget-data')
def api_budget_data():
    """Get budget data filtered by date range."""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not logged in'}), 401

        user_id = session['user_id']
        filter_type = request.args.get('filter', 'current_month')
        
        transactions = Transaction.get_transactions(user_id)
        
        # Parse dates
        def parse_transaction_date(t_date):
            if isinstance(t_date, str):
                try:
                    date_str = t_date.split(' ')[0]
                    return datetime.strptime(date_str, '%Y-%m-%d').date()
                except ValueError:
                    return None
            elif hasattr(t_date, 'date'):
                return t_date.date()
            else:
                return t_date
        
        # Filter transactions based on filter_type
        filtered_transactions = []
        filtered_income_transactions = []
        
        if filter_type == 'total':
            # All time
            filtered_transactions = [t for t in transactions if t['type'] == 'expense']
            filtered_income_transactions = [t for t in transactions if t['type'] == 'income']
        elif filter_type == 'current_month':
            # Current month
            current_month = datetime.now().month
            current_year = datetime.now().year
            for t in transactions:
                t_date = parse_transaction_date(t['date'])
                if t_date and t_date.month == current_month and t_date.year == current_year:
                    if t['type'] == 'expense':
                        filtered_transactions.append(t)
                    elif t['type'] == 'income':
                        filtered_income_transactions.append(t)
        else:
            # Specific month (format: YYYY-MM)
            try:
                year, month = map(int, filter_type.split('-'))
                for t in transactions:
                    t_date = parse_transaction_date(t['date'])
                    if t_date and t_date.month == month and t_date.year == year:
                        if t['type'] == 'expense':
                            filtered_transactions.append(t)
                        elif t['type'] == 'income':
                            filtered_income_transactions.append(t)
            except (ValueError, AttributeError):
                filtered_transactions = []
                filtered_income_transactions = []
        
        # Calculate spent amount
        spent = sum(float(t['amount']) for t in filtered_transactions)
        
        # Calculate filtered income amount
        filtered_income = sum(float(t['amount']) for t in filtered_income_transactions)
        
        # Get budget info
        budget = Budget.get_budget(user_id)
        budget_amount = float(budget['monthly_budget']) if budget else 0
        remaining = budget_amount - spent
        
        # Get category budgets
        category_budgets = CategoryBudget.get_category_budgets(user_id)
        category_budgets = [dict(cb) for cb in category_budgets]
        for cb in category_budgets:
            cb['monthly_budget'] = float(cb['monthly_budget'])
        
        # Calculate category-wise spending for filtered period
        category_spending_filtered = {}
        for t in filtered_transactions:
            cat = t.get('category', 'Other')
            if cat not in category_spending_filtered:
                category_spending_filtered[cat] = 0
            category_spending_filtered[cat] += float(t['amount'])
        
        # Enrich category budgets with spending info
        for cb in category_budgets:
            cat = cb.get('category')
            spent_amt = float(category_spending_filtered.get(cat, 0))
            cb['spent_amount'] = spent_amt
            cb['remaining'] = cb['monthly_budget'] - spent_amt
            cb['percentage'] = (spent_amt / cb['monthly_budget'] * 100) if cb['monthly_budget'] > 0 else 0
            
            # Choose progress class
            if cb['percentage'] >= 100:
                cb['progress_class'] = 'bg-danger'
                cb['alert'] = True
            elif cb['percentage'] >= 75:
                cb['progress_class'] = 'bg-warning'
                cb['alert'] = False
            else:
                cb['progress_class'] = 'bg-success'
                cb['alert'] = False
        
        # Calculate total allocated
        total_allocated = sum(cb['monthly_budget'] for cb in category_budgets)
        
        return jsonify({
            'spent': spent,
            'remaining': remaining,
            'budget_amount': budget_amount,
            'total_income': filtered_income,
            'total_allocated': total_allocated,
            'category_budgets': category_budgets,
            'expenses': [dict(t) for t in filtered_transactions[:10]]
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
