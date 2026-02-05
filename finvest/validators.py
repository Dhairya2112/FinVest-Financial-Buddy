import re
from datetime import datetime

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password (minimum 6 characters)."""
    return len(password) >= 6

def validate_name(name):
    """Validate name (not empty, only letters and spaces)."""
    if not name or len(name.strip()) == 0:
        return False
    return re.match(r'^[a-zA-Z\s]+$', name) is not None

def validate_amount(amount):
    """Validate amount (positive number)."""
    try:
        amt = float(amount)
        return amt > 0
    except ValueError:
        return False

def validate_date(date_str):
    """Validate date format (YYYY-MM-DD) and not in future."""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.date() <= datetime.now().date()
    except ValueError:
        return False

def validate_category(category):
    """Validate category (not empty)."""
    valid_categories = ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Education', 'Salary', 'Freelance', 'Other']
    return category in valid_categories

def validate_description(description):
    """Validate description (optional, max 255 characters)."""
    if description is None:
        return True
    return len(description.strip()) <= 255

def validate_transaction_type(transaction_type):
    """Validate transaction type."""
    return transaction_type in ['income', 'expense']

def validate_registration(name, email, password):
    """Validate registration data."""
    errors = []

    if not validate_name(name):
        errors.append('Please enter a valid name (letters and spaces only).')

    if not validate_email(email):
        errors.append('Please enter a valid email address.')

    if not validate_password(password):
        errors.append('Please choose a password with at least 6 characters.')

    return errors

def validate_transaction(amount, transaction_type, date, category):
    """Validate transaction data."""
    errors = []

    if not validate_amount(amount):
        errors.append('Please enter a positive number for the amount.')

    if not validate_transaction_type(transaction_type):
        errors.append('Please select a valid transaction type.')

    if not validate_date(date):
        errors.append('Please provide a valid date (not in the future).')

    if not validate_category(category):
        errors.append('Please choose a valid category.')

    return errors

def validate_asset(name, asset_type, value, quantity):
    """Validate asset data."""
    errors = []

    if not name or len(name.strip()) == 0:
        errors.append('Please provide a name for the asset.')

    if asset_type not in ['stock', 'bond', 'crypto', 'real_estate', 'other']:
        errors.append('Please select a valid asset type.')

    if not validate_amount(value):
        errors.append('Value must be a positive number.')

    try:
        qty = int(quantity)
        if qty <= 0:
            errors.append('Quantity must be a positive whole number.')
    except ValueError:
        errors.append('Please enter a numeric quantity.')

    return errors

def validate_budget(budget_amount):
    """Validate budget amount."""
    if not validate_amount(budget_amount):
        return ['Please enter a positive number for the budget.']
    return []

def validate_event(name, date, budget=None):
    """Validate event data."""
    errors = []

    if not name or len(name.strip()) == 0:
        errors.append('Please provide an event name.')

    if not validate_date(date):
        errors.append('Please provide a valid date (cannot be in the past).')

    if budget is not None and budget != '' and not validate_amount(budget):
        errors.append('Budget must be a positive number.')

    return errors
