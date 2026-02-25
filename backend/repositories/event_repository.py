import datetime
from db import supabase_db
from encryption_utils import DataCipher

class EventRepository:
    @staticmethod
    def add_event(user_id, name, exclude_from_main_budget, budget=None, start_date=None, end_date=None):
        """Add an event with date range for isolated budgeting."""
        enc_name = DataCipher.encrypt(name)
        enc_budget = DataCipher.encrypt(budget) if budget else None
        
        data = {
            "user_id": user_id,
            "name": enc_name,
            "exclude_from_main_budget": exclude_from_main_budget,
            "budget": enc_budget,
            "start_date": start_date,
            "end_date": end_date,
            "created_at": datetime.datetime.now().isoformat()
        }
        response = supabase_db.table("events").insert(data).execute()
        return response.data

    @staticmethod
    def get_events(user_id):
        """Get user's events."""
        response = supabase_db.table("events").select("*").eq("user_id", user_id).order("start_date").execute()
        rows = response.data
        
        for row in rows:
            row['name'] = DataCipher.decrypt(row['name'])
            row['budget'] = DataCipher.decrypt_float(row['budget']) if row.get('budget') else 0
        return rows

    @staticmethod
    def delete_event(user_id, event_id):
        """Delete an event."""
        supabase_db.table("events").delete().eq("id", event_id).eq("user_id", user_id).execute()

    @staticmethod
    def get_event_by_id(user_id, event_id):
        """Get a specific event by ID."""
        response = supabase_db.table("events").select("*").eq("id", event_id).eq("user_id", user_id).execute()
        if response.data:
            row = response.data[0]
            row['name'] = DataCipher.decrypt(row['name'])
            row['budget'] = DataCipher.decrypt_float(row['budget']) if row.get('budget') else 0
            return row
        return None

    @staticmethod
    def add_event_transaction(user_id, event_id, amount, transaction_type, date, category, description=''):
        """Add a transaction specifically tied to an event."""
        data = {
            "user_id": user_id,
            "event_id": event_id,
            "amount": DataCipher.encrypt(amount),
            "type": transaction_type,
            "date": date,
            "category": DataCipher.encrypt(category),
            "description": DataCipher.encrypt(description),
            "created_at": datetime.datetime.now().isoformat()
        }
        response = supabase_db.table("event_transactions").insert(data).execute()
        return response.data

    @staticmethod
    def get_event_transactions(user_id, event_id):
        """Get all transactions for a specific event."""
        response = supabase_db.table("event_transactions").select("*").eq("event_id", event_id).eq("user_id", user_id).order("date", desc=True).execute()
        rows = response.data
        
        for row in rows:
            row['amount'] = DataCipher.decrypt_float(row['amount'])
            row['category'] = DataCipher.decrypt(row['category'])
            row['description'] = DataCipher.decrypt(row['description']) if row.get('description') else ""
        return rows

    @staticmethod
    def delete_event_transaction(user_id, transaction_id):
        """Delete a transaction tied to an event."""
        supabase_db.table("event_transactions").delete().eq("id", transaction_id).eq("user_id", user_id).execute()
