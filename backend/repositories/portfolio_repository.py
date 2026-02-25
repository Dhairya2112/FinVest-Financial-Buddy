import datetime
from db import supabase_db
from encryption_utils import DataCipher

class PortfolioRepository:
    @staticmethod
    def add_asset(user_id, name, symbol, asset_type, current_price, quantity, purchase_price, purchase_date):
        """Add an asset to portfolio with full encryption."""
        total_value = current_price * quantity
        total_cost = purchase_price * quantity
        unrealized_pl = total_value - total_cost
        unrealized_pl_percent = (unrealized_pl / total_cost * 100) if total_cost > 0 else 0

        now = datetime.datetime.now().isoformat()
        data = {
            "user_id": user_id,
            "name": DataCipher.encrypt(name),
            "symbol": DataCipher.encrypt(symbol),
            "asset_type": asset_type,
            "current_price": DataCipher.encrypt(current_price),
            "quantity": DataCipher.encrypt(quantity),
            "purchase_price": DataCipher.encrypt(purchase_price),
            "purchase_date": purchase_date,
            "total_value": DataCipher.encrypt(total_value),
            "total_cost": DataCipher.encrypt(total_cost),
            "unrealized_pl": DataCipher.encrypt(unrealized_pl),
            "unrealized_pl_percent": DataCipher.encrypt(unrealized_pl_percent),
            "created_at": now,
            "updated_at": now
        }
        
        response = supabase_db.table("portfolio_assets").insert(data).execute()
        asset_id = response.data[0]['id'] if response.data else None
        
        if asset_id:
            PortfolioRepository.log_price_history(user_id, asset_id, current_price)
            
        return asset_id

    @staticmethod
    def get_portfolio(user_id, search='', asset_type='', sort_by='name', sort_order='ASC'):
        """Get and decrypt user's portfolio."""
        response = supabase_db.table("portfolio_assets").select("*").eq("user_id", user_id).execute()
        rows = response.data
        
        results = []
        for row in rows:
            row['name'] = DataCipher.decrypt(row['name'])
            row['symbol'] = DataCipher.decrypt(row['symbol'])
            row['current_price'] = DataCipher.decrypt_float(row['current_price'])
            row['quantity'] = DataCipher.decrypt_float(row['quantity'])
            row['purchase_price'] = DataCipher.decrypt_float(row['purchase_price'])
            row['total_value'] = DataCipher.decrypt_float(row['total_value'])
            row['total_cost'] = DataCipher.decrypt_float(row['total_cost'])
            row['unrealized_pl'] = DataCipher.decrypt_float(row['unrealized_pl'])
            row['unrealized_pl_percent'] = DataCipher.decrypt_float(row['unrealized_pl_percent'])
            
            if search:
                s = search.lower()
                if s not in row['name'].lower() and s not in row['symbol'].lower():
                    continue
            if asset_type and row['asset_type'] != asset_type: continue
            
            results.append(row)
            
        reverse = (sort_order == 'DESC')
        results.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)
        return results

    @staticmethod
    def log_price_history(user_id, asset_id, price):
        """Log encrypted price history."""
        data = {
            "user_id": user_id,
            "asset_id": asset_id,
            "price": DataCipher.encrypt(price),
            "date_recorded": datetime.datetime.now().isoformat()
        }
        supabase_db.table("portfolio_history").insert(data).execute()

    @staticmethod
    def get_asset_by_id(user_id, asset_id):
        response = supabase_db.table("portfolio_assets").select("*").eq("id", asset_id).eq("user_id", user_id).execute()
        if not response.data: return None
        row = response.data[0]
        row['name'] = DataCipher.decrypt(row['name'])
        row['symbol'] = DataCipher.decrypt(row['symbol'])
        row['current_price'] = DataCipher.decrypt_float(row['current_price'])
        row['quantity'] = DataCipher.decrypt_float(row['quantity'])
        row['purchase_price'] = DataCipher.decrypt_float(row['purchase_price'])
        row['total_value'] = DataCipher.decrypt_float(row['total_value'])
        row['total_cost'] = DataCipher.decrypt_float(row['total_cost'])
        return row

    @staticmethod
    def delete_asset(user_id, asset_id):
        supabase_db.table("portfolio_assets").delete().eq("id", asset_id).eq("user_id", user_id).execute()

    @staticmethod
    def get_portfolio_summary(user_id):
        assets = PortfolioRepository.get_portfolio(user_id)
        total_value = sum(a['total_value'] for a in assets)
        total_cost = sum(a['total_cost'] for a in assets)
        return {
            "total_value": total_value,
            "total_cost": total_cost,
            "unrealized_pl": total_value - total_cost
        }
