from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import Portfolio, ChartGenerator
from validators import validate_asset

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/portfolio')

@portfolio_bp.route('/')
def index():
    """Portfolio dashboard page."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    # Get portfolio data
    assets = Portfolio.get_portfolio(user_id)
    summary = Portfolio.get_portfolio_summary(user_id)
    risk_analysis = Portfolio.get_risk_analysis(user_id)
    alerts = Portfolio.get_alerts(user_id)

    # Generate charts
    history_data = Portfolio.get_portfolio_history(user_id, 30)
    growth_chart = ChartGenerator.generate_portfolio_growth_chart(history_data)
    allocation_chart = Portfolio.generate_portfolio_chart(user_id, 'allocation')

    return render_template('portfolio.html',
                         assets=assets,
                         summary=summary,
                         risk_analysis=risk_analysis,
                         alerts=alerts,
                         growth_chart=growth_chart,
                         allocation_chart=allocation_chart)

@portfolio_bp.route('/add', methods=['POST'])
def add_asset():
    """Add a new asset."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    name = request.form.get('name')
    symbol = request.form.get('symbol')
    asset_type = request.form.get('asset_type')
    current_price = request.form.get('current_price')
    quantity = request.form.get('quantity')
    purchase_price = request.form.get('purchase_price')
    purchase_date = request.form.get('purchase_date')

    # Basic validation
    if not all([name, symbol, asset_type, current_price, quantity, purchase_price, purchase_date]):
        flash('All fields are required.', 'error')
        return redirect(url_for('portfolio.index'))

    try:
        current_price = float(current_price)
        quantity = float(quantity)
        purchase_price = float(purchase_price)

        if current_price <= 0 or quantity <= 0 or purchase_price <= 0:
            flash('Prices and quantity must be positive numbers.', 'error')
            return redirect(url_for('portfolio.index'))

        Portfolio.add_asset(user_id, name, symbol, asset_type, current_price, quantity, purchase_price, purchase_date)
        flash('Asset added successfully!', 'success')
    except ValueError:
        flash('Invalid number format.', 'error')
    except Exception as e:
        flash('Error adding asset.', 'error')

    return redirect(url_for('portfolio.index'))

@portfolio_bp.route('/update-price', methods=['POST'])
def update_price():
    """Update asset price."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']
    asset_id = request.form.get('asset_id')
    new_price = request.form.get('new_price')

    try:
        asset_id = int(asset_id)
        new_price = float(new_price)
        if new_price <= 0:
            return jsonify({'success': False, 'message': 'Price must be positive.'}), 400

        if Portfolio.update_asset_price(user_id, asset_id, new_price):
            return jsonify({'success': True, 'message': 'Price updated successfully!'})
        else:
            return jsonify({'success': False, 'message': 'Asset not found.'}), 404
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid price format.'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error updating price.'}), 500

@portfolio_bp.route('/api/search')
def search_assets():
    """Search and filter assets via API."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']
    search = request.args.get('search', '')
    asset_type = request.args.get('asset_type', '')
    sort_by = request.args.get('sort_by', 'name')
    sort_order = request.args.get('sort_order', 'ASC')

    try:
        assets = Portfolio.get_portfolio(user_id, search, asset_type, sort_by, sort_order)
        return jsonify({'success': True, 'assets': assets})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@portfolio_bp.route('/api/assets/<int:asset_id>/delete', methods=['POST'])
def delete_asset(asset_id):
    """Delete an asset via API."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        Portfolio.delete_asset(user_id, asset_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@portfolio_bp.route('/api/assets/<int:asset_id>', methods=['GET'])
def get_asset(asset_id):
    """Get asset details via API."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        asset = Portfolio.get_asset_by_id(user_id, asset_id)
        if asset:
            return jsonify({'success': True, 'asset': asset})
        else:
            return jsonify({'success': False, 'message': 'Asset not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@portfolio_bp.route('/edit/<int:asset_id>', methods=['POST'])
def edit_asset(asset_id):
    """Edit an existing asset."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    name = request.form.get('name')
    symbol = request.form.get('symbol')
    asset_type = request.form.get('asset_type')
    current_price = request.form.get('current_price')
    quantity = request.form.get('quantity')
    purchase_price = request.form.get('purchase_price')
    purchase_date = request.form.get('purchase_date')

    # Basic validation
    if not all([name, symbol, asset_type, current_price, quantity, purchase_price, purchase_date]):
        flash('All fields are required.', 'error')
        return redirect(url_for('portfolio.index'))

    try:
        current_price = float(current_price)
        quantity = float(quantity)
        purchase_price = float(purchase_price)

        if current_price <= 0 or quantity <= 0 or purchase_price <= 0:
            flash('Prices and quantity must be positive numbers.', 'error')
            return redirect(url_for('portfolio.index'))

        Portfolio.update_asset(user_id, asset_id, name, symbol, asset_type, current_price, quantity, purchase_price, purchase_date)
        flash('Asset updated successfully!', 'success')
    except ValueError:
        flash('Invalid number format.', 'error')
    except Exception as e:
        flash('Error updating asset.', 'error')

    return redirect(url_for('portfolio.index'))
