from db import execute_query, execute_many
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

class User:
    @staticmethod
    def create_user(name, email, password):
        """Create a new user."""
        hashed_password = generate_password_hash(password)
        query = """
        INSERT INTO users (name, email, password_hash, created_at)
        VALUES (%s, %s, %s, %s)
        """
        params = (name, email, hashed_password, datetime.datetime.now())
        execute_query(query, params)

    @staticmethod
    def get_user_by_email(email):
        """Get user by email."""
        query = "SELECT * FROM users WHERE email = %s"
        result = execute_query(query, (email,), fetch=True)
        return result[0] if result else None

    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID."""
        query = "SELECT * FROM users WHERE id = %s"
        result = execute_query(query, (user_id,), fetch=True)
        return result[0] if result else None

    @staticmethod
    def verify_password(password_hash, password):
        """Verify user password."""
        try:
            return check_password_hash(password_hash, password)
        except (TypeError, ValueError):
            import hmac
            import hashlib
            import base64
            return False

class Transaction:
    @staticmethod
    def add_transaction(user_id, amount, transaction_type, date, category, description=''):
        """Add a new transaction."""
        query = """
        INSERT INTO transactions (user_id, amount, type, date, category, description, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (user_id, amount, transaction_type, date, category, description, datetime.datetime.now())
        execute_query(query, params)

    @staticmethod
    def get_transactions(user_id, search='', amount_min=None, amount_max=None, date_from=None, date_to=None, category=None, sort_by='date', sort_order='DESC'):
        """Get transactions with filters and sorting."""
        query = "SELECT * FROM transactions WHERE user_id = %s"
        params = [user_id]

        if search:
            query += " AND (description LIKE %s OR category LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])

        if amount_min is not None:
            query += " AND amount >= %s"
            params.append(amount_min)

        if amount_max is not None:
            query += " AND amount <= %s"
            params.append(amount_max)

        if date_from:
            query += " AND date >= %s"
            params.append(date_from)

        if date_to:
            query += " AND date <= %s"
            params.append(date_to)

        if category:
            query += " AND category = %s"
            params.append(category)

        query += f" ORDER BY {sort_by} {sort_order}"
        return execute_query(query, tuple(params), fetch=True)

    @staticmethod
    def delete_transaction(user_id, transaction_id):
        """Delete a transaction."""
        query = "DELETE FROM transactions WHERE id = %s AND user_id = %s"
        execute_query(query, (transaction_id, user_id))

class Portfolio:
    @staticmethod
    def add_asset(user_id, name, symbol, asset_type, current_price, quantity, purchase_price, purchase_date):
        """Add an asset to portfolio."""
        total_value = current_price * quantity
        total_cost = purchase_price * quantity
        unrealized_pl = total_value - total_cost
        unrealized_pl_percent = (unrealized_pl / total_cost * 100) if total_cost > 0 else 0

        query = """
        INSERT INTO portfolio_assets (user_id, name, symbol, asset_type, current_price, quantity,
                                     purchase_price, purchase_date, total_value, total_cost,
                                     unrealized_pl, unrealized_pl_percent, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (user_id, name, symbol, asset_type, current_price, quantity,
                 purchase_price, purchase_date, total_value, total_cost,
                 unrealized_pl, unrealized_pl_percent, datetime.datetime.now(), datetime.datetime.now())
        execute_query(query, params)

    @staticmethod
    def get_portfolio(user_id, search='', asset_type='', sort_by='name', sort_order='ASC'):
        """Get user's portfolio with filters and sorting."""
        query = "SELECT * FROM portfolio_assets WHERE user_id = %s"
        params = [user_id]

        if search:
            query += " AND (name LIKE %s OR symbol LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])

        if asset_type:
            query += " AND asset_type = %s"
            params.append(asset_type)

        query += f" ORDER BY {sort_by} {sort_order}"
        return execute_query(query, tuple(params), fetch=True)

    @staticmethod
    def update_asset_price(user_id, asset_id, new_price):
        """Update asset current price and recalculate P/L."""
        # Get current asset data
        query = "SELECT * FROM portfolio_assets WHERE id = %s AND user_id = %s"
        result = execute_query(query, (asset_id, user_id), fetch=True)
        if not result:
            return False

        asset = result[0]
        quantity = float(asset['quantity'])
        total_cost = float(asset['total_cost'])
        total_value = new_price * quantity
        unrealized_pl = total_value - total_cost
        unrealized_pl_percent = (unrealized_pl / total_cost * 100) if total_cost > 0 else 0

        # Update asset
        query = """
        UPDATE portfolio_assets SET current_price = %s, total_value = %s,
               unrealized_pl = %s, unrealized_pl_percent = %s, updated_at = %s
        WHERE id = %s AND user_id = %s
        """
        execute_query(query, (new_price, total_value, unrealized_pl, unrealized_pl_percent,
                     datetime.datetime.now(), asset_id, user_id))

        # Log price history
        Portfolio.log_price_history(user_id, asset_id, new_price)
        return True

    @staticmethod
    def log_price_history(user_id, asset_id, price):
        """Log price history for portfolio growth tracking."""
        query = """
        INSERT INTO portfolio_history (user_id, asset_id, price, date_recorded)
        VALUES (%s, %s, %s, %s)
        """
        execute_query(query, (user_id, asset_id, price, datetime.datetime.now()))

    @staticmethod
    def get_portfolio_summary(user_id):
        """Get portfolio summary with total value, P/L, etc."""
        assets = Portfolio.get_portfolio(user_id)
        total_value = sum(asset['total_value'] for asset in assets)
        total_cost = sum(asset['total_cost'] for asset in assets)
        total_pl = sum(asset['unrealized_pl'] for asset in assets)
        total_pl_percent = (total_pl / total_cost * 100) if total_cost > 0 else 0

        return {
            'total_value': total_value,
            'total_cost': total_cost,
            'total_pl': total_pl,
            'total_pl_percent': total_pl_percent,
            'asset_count': len(assets)
        }

    @staticmethod
    def get_portfolio_history(user_id, days=30):
        """Get portfolio value history for growth chart."""
        query = """
        SELECT DATE(date_recorded) as date,
               SUM(price * quantity) as portfolio_value
        FROM portfolio_history ph
        JOIN portfolio_assets pa ON ph.asset_id = pa.id
        WHERE ph.user_id = %s AND date_recorded >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY DATE(date_recorded)
        ORDER BY date
        """
        result = execute_query(query, (user_id, days), fetch=True)
        return result

    @staticmethod
    def get_risk_analysis(user_id):
        """Analyze portfolio risk based on asset allocation."""
        assets = Portfolio.get_portfolio(user_id)
        if not assets:
            return {
                'diversification_score': 0,
                'risk_level': 'No Assets',
                'asset_types': {},
                'largest_allocation': 0
            }

        # Count assets by type
        type_counts = {}
        total_value = sum(asset['total_value'] for asset in assets)

        for asset in assets:
            asset_type = asset['asset_type']
            type_counts[asset_type] = type_counts.get(asset_type, 0) + asset['total_value']

        # Calculate diversification score (0-100)
        type_count = len(type_counts)
        max_allocation = max(type_counts.values()) / total_value if total_value > 0 else 0
        diversification_score = min(100, type_count * 20 + (1 - max_allocation) * 50)

        # Determine risk level
        if diversification_score >= 80:
            risk_level = 'Low Risk'
        elif diversification_score >= 60:
            risk_level = 'Medium Risk'
        else:
            risk_level = 'High Risk'

        return {
            'diversification_score': round(diversification_score, 1),
            'risk_level': risk_level,
            'asset_types': type_counts,
            'largest_allocation': max_allocation * 100
        }

    @staticmethod
    def get_alerts(user_id):
        """Get portfolio alerts (price changes, etc.)."""
        alerts = []

        # Check for assets with significant P/L changes
        assets = Portfolio.get_portfolio(user_id)
        for asset in assets:
            if abs(asset['unrealized_pl_percent']) >= 10:  # 10% threshold
                alert_type = 'profit' if asset['unrealized_pl'] > 0 else 'loss'
                alerts.append({
                    'type': alert_type,
                    'asset': asset['name'],
                    'symbol': asset['symbol'],
                    'change_percent': round(asset['unrealized_pl_percent'], 1),
                    'change_amount': round(asset['unrealized_pl'], 2)
                })

        return alerts

    @staticmethod
    def update_asset(user_id, asset_id, name, symbol, asset_type, current_price, quantity, purchase_price, purchase_date):
        """Update an existing asset."""
        # Convert Decimal types to float for arithmetic operations
        current_price = float(current_price) if hasattr(current_price, '__float__') else float(current_price)
        quantity = float(quantity) if hasattr(quantity, '__float__') else float(quantity)
        purchase_price = float(purchase_price) if hasattr(purchase_price, '__float__') else float(purchase_price)
        total_value = current_price * quantity
        total_cost = purchase_price * quantity
        unrealized_pl = total_value - total_cost
        unrealized_pl_percent = (unrealized_pl / total_cost * 100) if total_cost > 0 else 0

        query = """
        UPDATE portfolio_assets SET name = %s, symbol = %s, asset_type = %s,
               current_price = %s, quantity = %s, purchase_price = %s,
               purchase_date = %s, total_value = %s, total_cost = %s,
               unrealized_pl = %s, unrealized_pl_percent = %s, updated_at = %s
        WHERE id = %s AND user_id = %s
        """
        execute_query(query, (name, symbol, asset_type, current_price, quantity,
                     purchase_price, purchase_date, total_value, total_cost,
                     unrealized_pl, unrealized_pl_percent, datetime.datetime.now(),
                     asset_id, user_id))

    @staticmethod
    def delete_asset(user_id, asset_id):
        """Delete an asset from portfolio."""
        # Delete price history first
        query = "DELETE FROM portfolio_history WHERE asset_id = %s AND user_id = %s"
        execute_query(query, (asset_id, user_id))

        # Delete asset
        query = "DELETE FROM portfolio_assets WHERE id = %s AND user_id = %s"
        execute_query(query, (asset_id, user_id))

    @staticmethod
    def get_asset_by_id(user_id, asset_id):
        """Get a specific asset by ID."""
        query = "SELECT * FROM portfolio_assets WHERE id = %s AND user_id = %s"
        result = execute_query(query, (asset_id, user_id), fetch=True)
        return result[0] if result else None

    @staticmethod
    def generate_portfolio_chart(user_id, chart_type='growth'):
        """Generate basic portfolio chart using matplotlib."""
        try:
            if chart_type == 'growth':
                history = Portfolio.get_portfolio_history(user_id, 30)
                if not history:
                    return None

                dates = [str(row['date']) for row in history]
                values = [float(row['portfolio_value']) for row in history]

                plt.figure(figsize=(8, 4))
                plt.plot(dates, values, 'b-', linewidth=2)
                plt.title('Portfolio Growth')
                plt.xlabel('Date')
                plt.ylabel('Value ($)')
                plt.xticks(rotation=45)
                plt.grid(True)

            elif chart_type == 'allocation':
                assets = Portfolio.get_portfolio(user_id)
                if not assets:
                    return None

                # Group by asset type
                type_values = {}
                for asset in assets:
                    asset_type = asset['asset_type']
                    type_values[asset_type] = type_values.get(asset_type, 0) + asset['total_value']

                labels = list(type_values.keys())
                sizes = list(type_values.values())

                plt.figure(figsize=(6, 6))
                plt.pie(sizes, labels=labels, autopct='%1.1f%%')
                plt.title('Asset Allocation')
                plt.axis('equal')

            # Save to buffer
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            plt.close()

            return f"data:image/png;base64,{image_base64}"

        except Exception as e:
            print(f"Chart generation error: {e}")
            return None

class Budget:
    @staticmethod
    def set_budget(user_id, monthly_budget=None):
        """Set monthly budget to total income if not specified."""
        # Calculate total income
        transactions = Transaction.get_transactions(user_id)
        total_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')

        if total_income == 0:
            raise ValueError("Before setting a budget, please add some income transactions.")

        # If no budget specified, use total income as budget
        if monthly_budget is None:
            monthly_budget = total_income
        elif monthly_budget > total_income:
            raise ValueError("Budget can't be larger than your total recorded income.")

        query = """
        INSERT INTO budgets (user_id, monthly_budget, created_at)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE monthly_budget = %s
        """
        params = (user_id, monthly_budget, datetime.datetime.now(), monthly_budget)
        execute_query(query, params)

    @staticmethod
    def get_budget(user_id):
        """Get user's budget."""
        query = "SELECT * FROM budgets WHERE user_id = %s"
        result = execute_query(query, (user_id,), fetch=True)
        return result[0] if result else None

class CategoryBudget:
    @staticmethod
    def set_category_budget(user_id, category, monthly_budget):
        """Set budget for a specific category."""
        # Check if user has any income
        transactions = Transaction.get_transactions(user_id)
        total_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')

        if total_income == 0:
            raise ValueError("Before setting category budgets, please add some income transactions.")

        # Get existing category budgets
        existing_budgets = CategoryBudget.get_category_budgets(user_id)
        sum_existing = sum(float(b['monthly_budget']) for b in existing_budgets if b['category'] != category)

        if sum_existing + monthly_budget > total_income:
            raise ValueError("Total category budgets can't exceed your total recorded income.")

        query = """
        INSERT INTO category_budgets (user_id, category, monthly_budget, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE monthly_budget = %s, updated_at = %s
        """
        now = datetime.datetime.now()
        params = (user_id, category, monthly_budget, now, now, monthly_budget, now)
        execute_query(query, params)

    @staticmethod
    def get_category_budgets(user_id):
        """Get all category budgets for a user."""
        query = "SELECT * FROM category_budgets WHERE user_id = %s ORDER BY category"
        return execute_query(query, (user_id,), fetch=True)

    @staticmethod
    def get_category_budget(user_id, category):
        """Get budget for a specific category."""
        query = "SELECT * FROM category_budgets WHERE user_id = %s AND category = %s"
        result = execute_query(query, (user_id, category), fetch=True)
        return result[0] if result else None

    @staticmethod
    def delete_category_budget(user_id, category):
        """Delete budget for a specific category."""
        query = "DELETE FROM category_budgets WHERE user_id = %s AND category = %s"
        execute_query(query, (user_id, category))

    @staticmethod
    def get_category_spending(user_id, months=1):
        """Get current month spending by category."""
        current_date = datetime.datetime.now()

        # Determine start_date based on months parameter
        if months is None:
            # No date filter - return all-time spending
            query = """
            SELECT category, SUM(amount) as total_spent
            FROM transactions
            WHERE user_id = %s AND type = 'expense'
            GROUP BY category
            ORDER BY total_spent DESC
            """
            return execute_query(query, (user_id,), fetch=True)

        if months == 1:
            # First day of current month
            start_date = current_date.replace(day=1)
        elif months == 12:
            # Year-to-date: first day of current year
            start_date = current_date.replace(month=1, day=1)
        else:
            # Compute start_date by subtracting months (approximate by month arithmetic)
            year = current_date.year
            month = current_date.month - months + 1
            while month <= 0:
                month += 12
                year -= 1
            start_date = datetime.datetime(year, month, 1)

        query = """
        SELECT category, SUM(amount) as total_spent
        FROM transactions
        WHERE user_id = %s AND type = 'expense' AND DATE(date) >= DATE(%s)
        GROUP BY category
        ORDER BY total_spent DESC
        """
        return execute_query(query, (user_id, start_date.strftime('%Y-%m-%d')), fetch=True)

class Event:
    @staticmethod
    def add_event(user_id, name, exclude_from_main_budget, budget=None, start_date=None, end_date=None):
        """Add an event with date range for isolated budgeting."""
        query = """
        INSERT INTO events (user_id, name, exclude_from_main_budget, budget, start_date, end_date, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (user_id, name, exclude_from_main_budget, budget, start_date, end_date, datetime.datetime.now())
        execute_query(query, params)

    @staticmethod
    def get_events(user_id):
        """Get user's events."""
        query = "SELECT * FROM events WHERE user_id = %s ORDER BY start_date ASC"
        return execute_query(query, (user_id,), fetch=True)

    @staticmethod
    def delete_event(user_id, event_id):
        """Delete an event."""
        query = "DELETE FROM events WHERE id = %s AND user_id = %s"
        execute_query(query, (event_id, user_id))

    @staticmethod
    def get_event_by_id(user_id, event_id):
        """Get a specific event by ID."""
        query = "SELECT * FROM events WHERE id = %s AND user_id = %s"
        result = execute_query(query, (event_id, user_id), fetch=True)
        return result[0] if result else None

    @staticmethod
    def update_event(user_id, event_id, name, exclude_from_main_budget, budget=None, start_date=None, end_date=None):
        """Update an event."""
        query = """
        UPDATE events SET name = %s, exclude_from_main_budget = %s, budget = %s, start_date = %s, end_date = %s
        WHERE id = %s AND user_id = %s
        """
        execute_query(query, (name, exclude_from_main_budget, budget, start_date, end_date, event_id, user_id))

    @staticmethod
    def get_event_transactions(user_id, event_id):
        """Get all transactions for a specific event."""
        query = """
        SELECT * FROM event_transactions
        WHERE user_id = %s AND event_id = %s
        ORDER BY date DESC, created_at DESC
        """
        return execute_query(query, (user_id, event_id), fetch=True)

    @staticmethod
    def add_event_transaction(user_id, event_id, amount, transaction_type, date, category, description=''):
        """Add a transaction to an event."""
        query = """
        INSERT INTO event_transactions (user_id, event_id, amount, type, date, category, description, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (user_id, event_id, amount, transaction_type, date, category, description, datetime.datetime.now())
        execute_query(query, params)

    @staticmethod
    def delete_event_transaction(user_id, transaction_id):
        """Delete a transaction from an event."""
        query = "DELETE FROM event_transactions WHERE id = %s AND user_id = %s"
        execute_query(query, (transaction_id, user_id))


class ChartGenerator:
    """Generate matplotlib charts with glassmorphism theme colors."""
    
    # Theme colors matching the glassmorphism design
    THEME_COLORS = {
        'bg': '#f0f2f5',
        'glass_bg': 'rgba(255, 255, 255, 0.65)',
        'text': '#2d3748',
        'text_muted': '#718096',
        'primary': '#000000',
        'accent_1': '#667eea',
        'accent_2': '#764ba2',
        'success': '#10b981',
        'danger': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6',
    }
    
    DARK_COLORS = {
        'bg': '#0f1115',
        'glass_bg': 'rgba(20, 20, 22, 0.6)',
        'text': '#e2e8f0',
        'text_muted': '#a0aec0',
        'primary': '#ffffff',
        'accent_1': '#667eea',
        'accent_2': '#764ba2',
        'success': '#10b981',
        'danger': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6',
    }
    
    # Color palette for categories
    PALETTE = ['#667eea', '#764ba2', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#06b6d4', '#8b5cf6']
    
    @staticmethod
    def _get_colors(dark_mode=False):
        return ChartGenerator.DARK_COLORS if dark_mode else ChartGenerator.THEME_COLORS
    
    @staticmethod
    def _fig_to_base64(fig):
        """Convert matplotlib figure to base64 data URL."""
        img = io.BytesIO()
        fig.savefig(img, format='png', bbox_inches='tight', transparent=True, dpi=100)
        img.seek(0)
        return 'data:image/png;base64,' + base64.b64encode(img.getvalue()).decode()
    
    @staticmethod
    def generate_expense_pie_chart(category_summary, dark_mode=False):
        """Generate pie chart for expenses by category."""
        colors = ChartGenerator._get_colors(dark_mode)
        
        if not category_summary:
            return None
        
        # Get categories and expenses
        categories = []
        expenses = []
        for category, data in category_summary.items():
            if data['expense'] > 0:
                categories.append(category)
                expenses.append(data['expense'])
        
        if not expenses:
            return None
        
        fig, ax = plt.subplots(figsize=(10, 7))
        fig.patch.set_facecolor('none')
        ax.set_facecolor('none')
        
        # Use theme colors
        palette = ChartGenerator.PALETTE
        
        wedges, texts, autotexts = ax.pie(
            expenses,
            labels=categories,
            autopct='%1.1f%%',
            startangle=90,
            colors=palette[:len(categories)],
            textprops={'fontsize': 11, 'weight': 'bold', 'color': colors['text']}
        )
        
        # Style percentage text
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontsize(10)
            autotext.set_weight('bold')
        
        ax.set_title('Expenses by Category', fontsize=16, fontweight='bold', color=colors['text'], pad=20)
        
        plt.tight_layout()
        return ChartGenerator._fig_to_base64(fig)
    
    @staticmethod
    def generate_income_bar_chart(category_summary, dark_mode=False):
        """Generate bar chart for income by category."""
        colors = ChartGenerator._get_colors(dark_mode)
        
        if not category_summary:
            return None
        
        # Get categories and income
        categories = []
        incomes = []
        for category, data in category_summary.items():
            if data['income'] > 0:
                categories.append(category)
                incomes.append(data['income'])
        
        if not incomes:
            return None
        
        fig, ax = plt.subplots(figsize=(10, 6))
        fig.patch.set_facecolor('none')
        ax.set_facecolor('none')
        
        palette = ChartGenerator.PALETTE
        bars = ax.bar(categories, incomes, color=palette[:len(categories)], edgecolor='none', alpha=0.85)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'₹{height:,.0f}',
                   ha='center', va='bottom', fontsize=10, color=colors['text'], fontweight='bold')
        
        ax.set_ylabel('Amount (₹)', fontsize=12, color=colors['text'], fontweight='bold')
        ax.set_title('Income by Category', fontsize=16, fontweight='bold', color=colors['text'], pad=20)
        
        # Style axes
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color(colors['text_muted'])
        ax.spines['bottom'].set_color(colors['text_muted'])
        ax.tick_params(colors=colors['text_muted'])
        
        plt.xticks(rotation=45, ha='right', color=colors['text'])
        plt.yticks(color=colors['text'])
        
        plt.tight_layout()
        return ChartGenerator._fig_to_base64(fig)
    
    @staticmethod
    def generate_net_balance_chart(category_summary, dark_mode=False):
        """Generate bar chart for net balance by category."""
        colors = ChartGenerator._get_colors(dark_mode)
        
        if not category_summary:
            return None
        
        # Get categories and net balance
        categories = []
        net_balances = []
        bar_colors = []
        for category, data in category_summary.items():
            if data['net'] != 0:
                categories.append(category)
                net_balances.append(data['net'])
                bar_colors.append(colors['success'] if data['net'] > 0 else colors['danger'])
        
        if not net_balances:
            return None
        
        fig, ax = plt.subplots(figsize=(10, 6))
        fig.patch.set_facecolor('none')
        ax.set_facecolor('none')
        
        bars = ax.bar(categories, net_balances, color=bar_colors, edgecolor='none', alpha=0.85)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'₹{height:,.0f}',
                   ha='center', va='bottom' if height > 0 else 'top',
                   fontsize=10, color=colors['text'], fontweight='bold')
        
        # Add zero line
        ax.axhline(y=0, color=colors['text_muted'], linestyle='-', linewidth=0.8, alpha=0.5)
        
        ax.set_ylabel('Net Balance (₹)', fontsize=12, color=colors['text'], fontweight='bold')
        ax.set_title('Net Balance by Category', fontsize=16, fontweight='bold', color=colors['text'], pad=20)
        
        # Style axes
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color(colors['text_muted'])
        ax.spines['bottom'].set_color(colors['text_muted'])
        ax.tick_params(colors=colors['text_muted'])
        
        plt.xticks(rotation=45, ha='right', color=colors['text'])
        plt.yticks(color=colors['text'])
        
        plt.tight_layout()
        return ChartGenerator._fig_to_base64(fig)
    
    @staticmethod
    def generate_monthly_trend_chart(month_summary, dark_mode=False):
        """Generate line chart for monthly income vs expenses trend."""
        colors = ChartGenerator._get_colors(dark_mode)
        
        if not month_summary:
            return None
        
        # Get months and data
        months = []
        incomes = []
        expenses = []
        for month_key, data in month_summary.items():
            months.append(data['month_name'][:3])  # Shortened month name
            incomes.append(data['income'])
            expenses.append(data['expense'])
        
        if not months:
            return None
        
        fig, ax = plt.subplots(figsize=(12, 6))
        fig.patch.set_facecolor('none')
        ax.set_facecolor('none')
        
        x = np.arange(len(months))
        width = 0.35
        
        bars1 = ax.bar(x - width/2, incomes, width, label='Income', color=colors['success'], alpha=0.85, edgecolor='none')
        bars2 = ax.bar(x + width/2, expenses, width, label='Expenses', color=colors['danger'], alpha=0.85, edgecolor='none')
        
        # Add value labels
        for bars in [bars1, bars2]:
            for bar in bars:
                height = bar.get_height()
                if height > 0:
                    ax.text(bar.get_x() + bar.get_width()/2., height,
                           f'₹{height:,.0f}',
                           ha='center', va='bottom', fontsize=9, color=colors['text'], fontweight='bold')
        
        ax.set_xlabel('Month', fontsize=12, color=colors['text'], fontweight='bold')
        ax.set_ylabel('Amount (₹)', fontsize=12, color=colors['text'], fontweight='bold')
        ax.set_title('Monthly Income vs Expenses Trend', fontsize=16, fontweight='bold', color=colors['text'], pad=20)
        ax.set_xticks(x)
        ax.set_xticklabels(months, color=colors['text'])
        ax.legend(loc='upper left', frameon=False, fontsize=11)
        
        # Style legend
        legend = ax.get_legend()
        if legend:
            for text in legend.get_texts():
                text.set_color(colors['text'])
        
        # Style axes
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color(colors['text_muted'])
        ax.spines['bottom'].set_color(colors['text_muted'])
        ax.tick_params(colors=colors['text_muted'])
        plt.yticks(color=colors['text'])
        
        plt.tight_layout()
        return ChartGenerator._fig_to_base64(fig)
    
    @staticmethod
    def generate_cash_flow_chart(month_summary, dark_mode=False):
        """Generate area chart for net cash flow trend."""
        colors = ChartGenerator._get_colors(dark_mode)

        if not month_summary:
            return None

        # Get months and net balance
        months = []
        net_balances = []
        for month_key, data in month_summary.items():
            months.append(data['month_name'][:3])  # Shortened month name
            net_balances.append(data['net'])

        if not months:
            return None

        fig, ax = plt.subplots(figsize=(12, 6))
        fig.patch.set_facecolor('none')
        ax.set_facecolor('none')

        x = np.arange(len(months))

        # Fill area under line
        ax.fill_between(x, net_balances, alpha=0.3, color=colors['info'])

        # Plot line
        ax.plot(x, net_balances, marker='o', linewidth=3, markersize=8,
               color=colors['info'], markerfacecolor=colors['accent_1'], markeredgewidth=2, markeredgecolor='white')

        # Add value labels
        for i, (xi, yi) in enumerate(zip(x, net_balances)):
            ax.text(xi, yi, f'₹{yi:,.0f}', ha='center', va='bottom',
                   fontsize=10, color=colors['text'], fontweight='bold')

        # Add zero line
        ax.axhline(y=0, color=colors['text_muted'], linestyle='--', linewidth=0.8, alpha=0.5)

        ax.set_xlabel('Month', fontsize=12, color=colors['text'], fontweight='bold')
        ax.set_ylabel('Net Balance (₹)', fontsize=12, color=colors['text'], fontweight='bold')
        ax.set_title('Net Cash Flow Trend', fontsize=16, fontweight='bold', color=colors['text'], pad=20)
        ax.set_xticks(x)
        ax.set_xticklabels(months, color=colors['text'])

        # Style axes
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color(colors['text_muted'])
        ax.spines['bottom'].set_color(colors['text_muted'])
        ax.tick_params(colors=colors['text_muted'])
        plt.yticks(color=colors['text'])

        plt.tight_layout()
        return ChartGenerator._fig_to_base64(fig)

    @staticmethod
    def generate_portfolio_growth_chart(history_data, dark_mode=False):
        """Generate enhanced portfolio growth chart with glassmorphism styling."""
        colors = ChartGenerator._get_colors(dark_mode)

        if not history_data:
            return None

        # Extract dates and values
        dates = [row['date'].strftime('%b %d') if hasattr(row['date'], 'strftime') else str(row['date']) for row in history_data]
        values = [float(row['portfolio_value']) for row in history_data]

        if not values:
            return None

        fig, ax = plt.subplots(figsize=(12, 6))
        fig.patch.set_facecolor('none')
        ax.set_facecolor('none')

        # Create gradient fill under the line
        x = np.arange(len(dates))
        ax.fill_between(x, values, alpha=0.2, color=colors['accent_1'])

        # Plot the main line
        line = ax.plot(x, values, linewidth=3, color=colors['accent_1'], marker='o',
                      markersize=6, markerfacecolor=colors['accent_2'], markeredgewidth=2, markeredgecolor='white')[0]

        # Add value labels at start, end, and significant points
        if len(values) > 1:
            # Start point
            ax.text(0, values[0], f'₹{values[0]:,.0f}', ha='left', va='bottom',
                   fontsize=10, color=colors['text'], fontweight='bold', bbox=dict(boxstyle="round,pad=0.3", facecolor=colors['glass_bg'], edgecolor='none', alpha=0.8))

            # End point
            ax.text(len(values)-1, values[-1], f'₹{values[-1]:,.0f}', ha='right', va='bottom',
                   fontsize=10, color=colors['text'], fontweight='bold', bbox=dict(boxstyle="round,pad=0.3", facecolor=colors['glass_bg'], edgecolor='none', alpha=0.8))

            # Calculate and show percentage change
            if values[0] > 0:
                pct_change = ((values[-1] - values[0]) / values[0]) * 100
                change_color = colors['success'] if pct_change >= 0 else colors['danger']
                ax.text(len(values)-1, values[-1], f'{pct_change:+.1f}%', ha='right', va='top',
                       fontsize=12, color=change_color, fontweight='bold', bbox=dict(boxstyle="round,pad=0.3", facecolor=colors['glass_bg'], edgecolor='none', alpha=0.8))

        # Style the plot
        ax.set_xlabel('Date', fontsize=12, color=colors['text'], fontweight='bold')
        ax.set_ylabel('Portfolio Value (₹)', fontsize=12, color=colors['text'], fontweight='bold')
        ax.set_title('Portfolio Growth Trend', fontsize=16, fontweight='bold', color=colors['text'], pad=20)

        # Set x-ticks to show every few dates for readability
        step = max(1, len(dates) // 7)  # Show about 7 labels
        ax.set_xticks(x[::step])
        ax.set_xticklabels([dates[i] for i in range(0, len(dates), step)], rotation=45, ha='right', color=colors['text'])

        # Style axes
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color(colors['text_muted'])
        ax.spines['bottom'].set_color(colors['text_muted'])
        ax.tick_params(colors=colors['text_muted'])
        ax.grid(True, alpha=0.3, color=colors['text_muted'], linestyle='--')

        # Format y-axis with currency
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'₹{x:,.0f}'))
        plt.yticks(color=colors['text'])

        plt.tight_layout()
        return ChartGenerator._fig_to_base64(fig)
