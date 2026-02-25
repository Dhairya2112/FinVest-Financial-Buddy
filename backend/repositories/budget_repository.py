import datetime
from db import supabase_db
from encryption_utils import DataCipher
from repositories.transaction_repository import TransactionRepository

class BudgetRepository:
    @staticmethod
    def set_budget(user_id, monthly_budget=None):
        """Set or update the global monthly budget."""
        # Calculate total income
        transactions = TransactionRepository.get_transactions(user_id)
        total_income = sum(float(t['amount']) for t in transactions if t['type'] == 'income')

        if total_income == 0:
            raise ValueError("Before setting a budget, please add some income transactions.")

        if monthly_budget is None:
            monthly_budget = total_income
        elif monthly_budget > total_income:
            raise ValueError("Budget can't be larger than your total recorded income.")

        enc_budget = DataCipher.encrypt(monthly_budget)
        now = datetime.datetime.now().isoformat()
        
        # Check if exists first for upsert behavior
        existing = supabase_db.table("budgets").select("*").eq("user_id", user_id).execute()
        if existing.data:
            response = supabase_db.table("budgets").update({
                "monthly_budget": enc_budget
            }).eq("user_id", user_id).execute()
        else:
            response = supabase_db.table("budgets").insert({
                "user_id": user_id,
                "monthly_budget": enc_budget,
                "created_at": now
            }).execute()
            
        return response.data

    @staticmethod
    def get_budget(user_id):
        """Get and decrypt user's budget."""
        response = supabase_db.table("budgets").select("*").eq("user_id", user_id).execute()
        if response.data:
            row = response.data[0]
            row['monthly_budget'] = DataCipher.decrypt_float(row['monthly_budget'])
            return row
        return None
