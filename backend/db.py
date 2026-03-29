import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """
    Initialize and return the Supabase client.
    This completely replaces the old raw MySQL connection.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("Supabase URL and Key must be defined in the .env file")
        
    supabase: Client = create_client(url, key)
    return supabase

# Global instance for new repositories to import
supabase_db = get_supabase_client()

# --- Legacy Compatibility Layer ---
# This prevents the app from crashing while we migrate the 1,200 lines of raw MySQL 
# in models.py over to the new Supabase Python Client syntax.
def execute_query(query, params=None, fetch=False):
    print(f"LEGACY SQL WARNING: Query intercepted. Please migrate to Supabase client: {query}")
    return [] if fetch else 0

def execute_many(query, params_list):
    print(f"LEGACY SQL WARNING: execute_many intercepted: {query}")
    return 0
