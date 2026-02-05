import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from models import Event
from validators import validate_event

events_bp = Blueprint('events', __name__, url_prefix='/events')

@events_bp.route('/')
def index():
    """Events management page."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']
    events = Event.get_events(user_id)

    # Enrich events with spent_amount (sum of expense transactions), remaining and progress
    for ev in events:
        ev_id = ev.get('id') or ev.get('ID')
        txs = Event.get_event_transactions(user_id, ev_id)
        # spent_amount: sum of 'expense' transactions (money spent)
        spent_amount = sum(t['amount'] for t in txs if t.get('type') == 'expense')
        ev['current_amount'] = spent_amount
        budget = ev.get('budget') or 0
        ev['remaining_amount'] = max(budget - spent_amount, 0)
        ev['progress_percent'] = int((spent_amount / budget * 100) if budget > 0 else 0)

    return render_template('events.html', events=events)

@events_bp.route('/add', methods=['POST'])
def add_event():
    """Add a new event."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']
    # Expect straightforward, vanilla form fields from templates
    name = request.form.get('name')
    description = request.form.get('description')
    category = request.form.get('category')
    event_budget = request.form.get('target_amount')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    exclude_from_main_budget = True  # Events are always excluded from main budget

    errors = validate_event(name, start_date, event_budget)
    if errors:
        for error in errors:
            flash(error, 'error')
        return redirect(url_for('events.index'))

    try:
        Event.add_event(user_id, name, exclude_from_main_budget, event_budget, start_date, end_date)
        flash('Event added successfully!', 'success')
    except Exception as e:
        flash('Error adding event.', 'error')

    return redirect(url_for('events.index'))


@events_bp.route('/<int:event_id>', methods=['DELETE'])
def delete_event_api(event_id):
    """Delete an event via DELETE /events/<id> (JSON)"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']
    try:
        Event.delete_event(user_id, event_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@events_bp.route('/api/delete-event/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete an event via API."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        Event.delete_event(user_id, event_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@events_bp.route('/events')
def get_events_json():
    """Get events as JSON."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']
    events = Event.get_events(user_id)
    return jsonify({'events': events})

@events_bp.route('/add-event', methods=['POST'])
def add_event_json():
    """Add event via JSON."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']
    data = request.get_json()
    event_name = data.get('name')
    exclude = data.get('exclude', False)

    errors = validate_event(event_name, '2023-01-01')  # dummy date, no budget required
    if errors:
        return jsonify({'success': False, 'message': errors[0]}), 400

    try:
        Event.add_event(user_id, event_name, exclude)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@events_bp.route('/delete-event/<int:event_id>', methods=['DELETE'])
def delete_event_new(event_id):
    """Delete event."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        Event.delete_event(user_id, event_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@events_bp.route('/edit/<int:event_id>', methods=['GET', 'POST'])
def edit_event(event_id):
    """Edit an event."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    if request.method == 'POST':
        # Use simplified, vanilla form field names from templates
        event_name = request.form.get('name')
        event_budget = request.form.get('target_amount')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        exclude_from_main_budget = True  # Events are always excluded from main budget

        errors = validate_event(event_name, start_date, event_budget)
        if errors:
            for error in errors:
                flash(error, 'error')
            return redirect(url_for('events.edit_event', event_id=event_id))

        try:
            Event.update_event(user_id, event_id, event_name, exclude_from_main_budget, event_budget, start_date, end_date)
            flash('Event updated successfully!', 'success')
            return redirect(url_for('events.index'))
        except Exception as e:
            flash('Error updating event.', 'error')
            return redirect(url_for('events.edit_event', event_id=event_id))

        try:
            Event.update_event(user_id, event_id, event_name, exclude_from_main_budget, event_budget)
            flash('Event updated successfully!', 'success')
            return redirect(url_for('events.index'))
        except Exception as e:
            flash('Error updating event.', 'error')
            return redirect(url_for('events.edit_event', event_id=event_id))

    # GET request - show edit form
    event = Event.get_event_by_id(user_id, event_id)
    if not event:
        flash('Event not found.', 'error')
        return redirect(url_for('events.index'))

    # compute current_amount and progress for display
    txs = Event.get_event_transactions(user_id, event_id)
    current_amount = sum(t['amount'] for t in txs if t.get('type') == 'income')
    event['current_amount'] = current_amount
    budget = event.get('budget') or 0
    progress_percentage = int((current_amount / budget * 100) if budget > 0 else 0)

    return render_template('edit_event.html', event=event, progress_percentage=progress_percentage)

@events_bp.route('/<int:event_id>')
def event_detail(event_id):
    """View event details and transactions."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']
    event = Event.get_event_by_id(user_id, event_id)

    if not event:
        flash('Event not found.', 'error')
        return redirect(url_for('events.index'))

    # Get transactions for this event
    transactions = Event.get_event_transactions(user_id, event_id)

    # Calculate totals
    total_spent = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    budget = event['budget'] or 0
    remaining_budget = budget - total_spent
    progress_percentage = int((total_spent / budget * 100) if budget > 0 else 0)

    return render_template('event_detail.html',
                         event=event,
                         transactions=transactions,
                         total_spent=total_spent,
                         remaining_budget=remaining_budget,
                         progress_percentage=progress_percentage,
                         today=datetime.date.today().isoformat())

@events_bp.route('/<int:event_id>/add-transaction', methods=['POST'])
def add_event_transaction(event_id):
    """Add a transaction to an event."""
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    # Verify event belongs to user
    event = Event.get_event_by_id(user_id, event_id)
    if not event:
        flash('Event not found.', 'error')
        return redirect(url_for('events.index'))

    amount = request.form.get('amount')
    transaction_type = request.form.get('transaction_type')
    date = request.form.get('date')
    category = request.form.get('category')
    description = request.form.get('description', '')

    # Validate that transaction date falls within event date range
    try:
        transaction_date = datetime.datetime.strptime(date, '%Y-%m-%d').date()
        event_start = event['start_date'] if isinstance(event['start_date'], datetime.date) else datetime.datetime.strptime(str(event['start_date']), '%Y-%m-%d').date()
        event_end = event['end_date'] if isinstance(event['end_date'], datetime.date) else datetime.datetime.strptime(str(event['end_date']), '%Y-%m-%d').date()
        
        if transaction_date < event_start or transaction_date > event_end:
            flash(f'Transaction date must be between {event_start} and {event_end}', 'error')
            return redirect(url_for('events.event_detail', event_id=event_id))
    except (ValueError, AttributeError):
        flash('Invalid date format', 'error')
        return redirect(url_for('events.event_detail', event_id=event_id))

    from validators import validate_transaction
    errors = validate_transaction(amount, transaction_type, date, category)
    if errors:
        for error in errors:
            flash(error, 'error')
        return redirect(url_for('events.event_detail', event_id=event_id))

    try:
        Event.add_event_transaction(user_id, event_id, amount, transaction_type, date, category, description)
        flash('Transaction added successfully!', 'success')
    except Exception as e:
        flash('Error adding transaction.', 'error')

    return redirect(url_for('events.event_detail', event_id=event_id))

@events_bp.route('/api/delete-transaction/<int:transaction_id>', methods=['DELETE'])
def delete_event_transaction(transaction_id):
    """Delete a transaction from an event."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user_id = session['user_id']

    try:
        Event.delete_event_transaction(user_id, transaction_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
