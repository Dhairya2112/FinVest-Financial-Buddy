from flask import Blueprint, render_template, request, session, redirect, url_for, jsonify
from models import Transaction, ChartGenerator
from datetime import datetime, timedelta

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    user_id = session['user_id']

    # Get date range from request
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    # Default to last 30 days if no dates provided
    if not date_from or not date_to:
        date_to = datetime.now().strftime('%Y-%m-%d')
        date_from = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    # Get transactions for the period
    transactions = Transaction.get_transactions(user_id, date_from=date_from, date_to=date_to)

    # Calculate totals
    total_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')
    total_expenses = sum(float(t['amount']) for t in transactions if t['type'] == 'expense')
    net_balance = total_income - total_expenses

    # Category-wise summary
    category_summary = {}
    for t in transactions:
        category = t['category']
        amount = float(t['amount'])
        if category not in category_summary:
            category_summary[category] = {'income': 0, 'expense': 0, 'net': 0}

        if t['type'] == 'income':
            category_summary[category]['income'] += amount
        else:
            category_summary[category]['expense'] += amount

    # Calculate net for each category
    for cat in category_summary:
        category_summary[cat]['net'] = category_summary[cat]['income'] - category_summary[cat]['expense']

    # Month-wise summary
    month_summary = {}
    for t in transactions:
        date_obj = t['date']  # t['date'] is already a datetime.date object
        month_key = date_obj.strftime('%Y-%m')
        month_name = date_obj.strftime('%B %Y')

        if month_key not in month_summary:
            month_summary[month_key] = {
                'month_name': month_name,
                'income': 0,
                'expense': 0,
                'net': 0,
                'transaction_count': 0
            }

        amount = float(t['amount'])
        if t['type'] == 'income':
            month_summary[month_key]['income'] += amount
        else:
            month_summary[month_key]['expense'] += amount
        month_summary[month_key]['transaction_count'] += 1

    # Calculate net for each month
    for month in month_summary:
        month_summary[month]['net'] = month_summary[month]['income'] - month_summary[month]['expense']

    # Sort months chronologically
    month_summary = dict(sorted(month_summary.items()))

    # Generate charts
    expense_chart = ChartGenerator.generate_expense_pie_chart(category_summary, dark_mode=False)
    income_chart = ChartGenerator.generate_income_bar_chart(category_summary, dark_mode=False)
    monthly_chart = ChartGenerator.generate_monthly_trend_chart(month_summary, dark_mode=False)
    cash_flow_chart = ChartGenerator.generate_cash_flow_chart(month_summary, dark_mode=False)

    return render_template('reports.html',
                         date_from=date_from,
                         date_to=date_to,
                         total_income=total_income,
                         total_expenses=total_expenses,
                         net_balance=net_balance,
                         category_summary=category_summary,
                         month_summary=month_summary,
                         expense_chart=expense_chart,
                         income_chart=income_chart,
                         monthly_chart=monthly_chart,
                         cash_flow_chart=cash_flow_chart)

@reports_bp.route('/api/reports')
def api_reports():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    # Get date range from request
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    # Default to last 30 days if no dates provided
    if not date_from or not date_to:
        date_to = datetime.now().strftime('%Y-%m-%d')
        date_from = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    # Get transactions for the period
    transactions = Transaction.get_transactions(user_id, date_from=date_from, date_to=date_to)

    # Calculate totals
    total_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')
    total_expenses = sum(float(t['amount']) for t in transactions if t['type'] == 'expense')
    net_balance = total_income - total_expenses

    # Category-wise summary
    category_summary = {}
    for t in transactions:
        category = t['category']
        amount = float(t['amount'])
        if category not in category_summary:
            category_summary[category] = {'income': 0, 'expense': 0, 'net': 0}

        if t['type'] == 'income':
            category_summary[category]['income'] += amount
        else:
            category_summary[category]['expense'] += amount

    # Calculate net for each category
    for cat in category_summary:
        category_summary[cat]['net'] = category_summary[cat]['income'] - category_summary[cat]['expense']

    # Month-wise summary
    month_summary = {}
    for t in transactions:
        date_obj = t['date']  # t['date'] is already a datetime.date object
        month_key = date_obj.strftime('%Y-%m')
        month_name = date_obj.strftime('%B %Y')

        if month_key not in month_summary:
            month_summary[month_key] = {
                'month_name': month_name,
                'income': 0,
                'expense': 0,
                'net': 0,
                'transaction_count': 0
            }

        amount = float(t['amount'])
        if t['type'] == 'income':
            month_summary[month_key]['income'] += amount
        else:
            month_summary[month_key]['expense'] += amount
        month_summary[month_key]['transaction_count'] += 1

    # Calculate net for each month
    for month in month_summary:
        month_summary[month]['net'] = month_summary[month]['income'] - month_summary[month]['expense']

    # Sort months chronologically
    month_summary = dict(sorted(month_summary.items()))

    return jsonify({
        'date_from': date_from,
        'date_to': date_to,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'net_balance': net_balance,
        'category_summary': category_summary,
        'month_summary': month_summary
    })

