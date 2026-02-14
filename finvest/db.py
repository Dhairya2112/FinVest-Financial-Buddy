import mysql.connector

def get_db_connection():
    """Get MySQL database connection"""
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="finvest"
    )

def execute_query(query, params=None, fetch=False):
    """
    Execute a single query
    Returns result set if fetch=True, otherwise rowcount
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or ())

        if fetch:
            result = cursor.fetchall()
            conn.commit()
            return result
        else:
            # For non-fetch queries, consume any results to avoid "unread result" error
            try:
                cursor.fetchall()  # Consume any remaining results
            except:
                pass  # Ignore if no results to fetch
            conn.commit()
            return cursor.lastrowid if cursor.lastrowid else cursor.rowcount
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def execute_many(query, params_list):
    """
    Execute a query multiple times with different parameters
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.executemany(query, params_list)
        conn.commit()
        return cursor.rowcount
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

