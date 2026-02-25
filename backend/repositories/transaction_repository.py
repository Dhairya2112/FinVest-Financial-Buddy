import datetime
from db import supabase_db
from encryption_utils import DataCipher

class TransactionRepository:
    @staticmethod
    def add_transaction(user_id, amount, transaction_type, date, category, description=''):
        """Add a new transaction to Supabase with AES-256 encryption."""
        data = {
            "user_id": user_id,
            "amount": DataCipher.encrypt(amount),
            "type": transaction_type,
            "date": date,
            "category": DataCipher.encrypt(category),
            "description": DataCipher.encrypt(description),
            "created_at": datetime.datetime.now().isoformat()
        }
        
        response = supabase_db.table("transactions").insert(data).execute()
        return response.data

    @staticmethod
    def get_transactions(user_id, search='', amount_min=None, amount_max=None, date_from=None, date_to=None, category=None, sort_by='date', sort_order='DESC'):
        """Fetch transactions from Supabase, decrypt them, and apply Python-side filtering."""
        response = supabase_db.table("transactions").select("*").eq("user_id", user_id).execute()
        rows = response.data
        
        results = []
        for row in rows:
            # Decrypt fields securely
            row['amount'] = DataCipher.decrypt_float(row['amount'])
            row['category'] = DataCipher.decrypt(row['category'])
            row['description'] = DataCipher.decrypt(row['description'])
            
            # Apply filters dynamically (Since data is encrypted at rest, DB-side WHERE clauses on these fields are impossible)
            if search:
                s = search.lower()
                if s not in row['description'].lower() and s not in row['category'].lower():
                    continue
            if amount_min is not None and row['amount'] < amount_min: continue
            if amount_max is not None and row['amount'] > amount_max: continue
            if date_from and str(row['date']) < str(date_from): continue
            if date_to and str(row['date']) > str(date_to): continue
            if category and row['category'] != category: continue
            
            results.append(row)
            
        # Sorting
        reverse = (sort_order == 'DESC')
        # Handle cases where sort_by key might be slightly different in Python dict
        results.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)
        return results

    @staticmethod
    def delete_transaction(user_id, transaction_id):
        """Delete a transaction securely from Supabase."""
        response = supabase_db.table("transactions").delete().match({
            "id": transaction_id, 
            "user_id": user_id
        }).execute()
        return response.data
