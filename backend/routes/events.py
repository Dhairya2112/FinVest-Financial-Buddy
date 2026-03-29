import datetime
from flask import Blueprint, request, jsonify
from repositories.event_repository import EventRepository
from validators import validate_event, validate_transaction
from auth_middleware import token_required

events_bp = Blueprint('events', __name__)

@events_bp.route('/api/events', methods=['GET'])
@token_required
def get_events(current_user_id):
    """Get all events for user with enriched data."""
    try:
        events = EventRepository.get_events(current_user_id)
        
        # Enrich events with spent amount and progress
        for ev in events:
            ev_id = ev.get('id') or ev.get('ID')
            txs = EventRepository.get_event_transactions(current_user_id, ev_id)
            total_expense = sum(float(t['amount']) for t in txs if t.get('type') == 'expense')
            total_refund = sum(float(t['amount']) for t in txs if t.get('type') == 'income')
            spent_amount = max(total_expense - total_refund, 0)
            ev['current_amount'] = spent_amount
            budget = ev.get('budget') or 0
            ev['remaining_amount'] = max(budget - spent_amount, 0)
            ev['progress_percent'] = int((spent_amount / budget * 100) if budget > 0 else 0)

        return jsonify({"status": "success", "data": events})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@events_bp.route('/api/events/add', methods=['POST'])
@token_required
def add_event(current_user_id):
    """Add a new event."""
    data = request.json
    name = data.get('name')
    event_budget = data.get('budget')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    exclude_from_main_budget = True

    errors = validate_event(name, start_date, end_date, event_budget)
    if errors:
        return jsonify({"status": "error", "message": errors[0]}), 400

    try:
        EventRepository.add_event(current_user_id, name, exclude_from_main_budget, event_budget, start_date, end_date)
        return jsonify({"status": "success", "message": "Event created"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@events_bp.route('/api/events/delete/<int:event_id>', methods=['DELETE'])
@token_required
def delete_event(current_user_id, event_id):
    """Delete an event."""
    try:
        EventRepository.delete_event(current_user_id, event_id)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@events_bp.route('/api/events/<int:event_id>/transactions', methods=['GET'])
@token_required
def get_event_transactions(current_user_id, event_id):
    """Get transactions for an event."""
    try:
        txs = EventRepository.get_event_transactions(current_user_id, event_id)
        return jsonify({"status": "success", "data": txs})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@events_bp.route('/api/events/<int:event_id>/transactions/add', methods=['POST'])
@token_required
def add_event_tx(current_user_id, event_id):
    """Add a transaction to an event."""
    data = request.json
    amount = data.get('amount')
    transaction_type = data.get('type')
    date = data.get('date')
    category = data.get('category')
    description = data.get('description', '')

    try:
        EventRepository.add_event_transaction(current_user_id, event_id, amount, transaction_type, date, category, description)
        return jsonify({"status": "success", "message": "Transaction added"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@events_bp.route('/api/events/transactions/delete/<int:tx_id>', methods=['DELETE'])
@token_required
def delete_event_tx(current_user_id, tx_id):
    """Delete an isolated transaction."""
    try:
        EventRepository.delete_event_transaction(current_user_id, tx_id)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

