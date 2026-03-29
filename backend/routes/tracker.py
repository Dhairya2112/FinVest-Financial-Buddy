from flask import Blueprint, jsonify, request
from repositories.transaction_repository import TransactionRepository
from datetime import datetime
from auth_middleware import token_required

tracker_bp = Blueprint('tracker', __name__)

@tracker_bp.route('/api/transactions', methods=['GET'])
@token_required
def get_transactions(current_user_id):
    user_id = current_user_id

    transactions = TransactionRepository.get_transactions(user_id)
    return jsonify({
        "status": "success",
        "data": transactions
    })

@tracker_bp.route('/api/transactions/add', methods=['POST'])
@token_required
def add_transaction(current_user_id):
    user_id = current_user_id
    data = request.json

    amount = data.get('amount')
    transaction_type = data.get('type')
    date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    category = data.get('category')
    description = data.get('description', '')

    if not amount or float(amount) <= 0:
        return jsonify({"status": "error", "message": "Amount must be positive"}), 400

    if transaction_type not in ['income', 'expense']:
        return jsonify({"status": "error", "message": "Invalid transaction type"}), 400

    if not category:
        return jsonify({"status": "error", "message": "Category is required"}), 400

    try:
        amount_float = float(amount)
        result = TransactionRepository.add_transaction(
            user_id, amount_float, transaction_type, date, category, description
        )
        return jsonify({
            "status": "success",
            "message": "Transaction added successfully",
            "data": result
        })
    except Exception as e:
        print("Add TX Error:", str(e))
        return jsonify({"status": "error", "message": "Failed to add transaction"}), 500

@tracker_bp.route('/api/transactions/delete/<int:transaction_id>', methods=['DELETE'])
@token_required
def delete_transaction(current_user_id, transaction_id):
    user_id = current_user_id

    try:
        TransactionRepository.delete_transaction(user_id, transaction_id)
        return jsonify({"status": "success", "message": "Transaction deleted"})
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to delete transaction"}), 500
