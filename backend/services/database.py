"""Database connection and query utilities"""

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
import os
from contextlib import contextmanager

# Database connection pool
pool = None


def init_db_pool():
    """Initialize database connection pool"""
    global pool
    if pool is None:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")

        pool = SimpleConnectionPool(
            minconn=1,
            maxconn=20,
            dsn=database_url
        )
    return pool


@contextmanager
def get_db_connection():
    """Get a database connection from the pool"""
    if pool is None:
        init_db_pool()

    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)


@contextmanager
def get_db_cursor(commit=False):
    """Get a database cursor with automatic connection management"""
    if pool is None:
        init_db_pool()

    conn = pool.getconn()
    needs_new_conn = False

    # Check if connection is still alive
    try:
        conn.isolation_level
    except (psycopg2.OperationalError, psycopg2.InterfaceError):
        # Connection is dead, mark it for closure
        needs_new_conn = True

    if needs_new_conn:
        # Close the dead connection and get a fresh one
        try:
            pool.putconn(conn, close=True)
        except:
            pass
        conn = pool.getconn()

    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        if commit:
            conn.commit()
    except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
        # Connection error during query - close and discard this connection
        try:
            if cursor:
                cursor.close()
        except:
            pass
        try:
            conn.rollback()
        except:
            pass
        try:
            pool.putconn(conn, close=True)
        except:
            pass
        raise e
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        raise e
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        # Return connection to pool if no error
        try:
            pool.putconn(conn)
        except Exception:
            # If we can't return it, just close it
            try:
                conn.close()
            except:
                pass


class DB:
    """Database query helper"""

    @staticmethod
    def execute(query, params=None, fetch_one=False, fetch_all=False, commit=False):
        """Execute a query and optionally return results with automatic retry on connection errors"""
        max_retries = 2
        last_error = None

        for attempt in range(max_retries):
            try:
                with get_db_cursor(commit=commit) as cursor:
                    cursor.execute(query, params or [])

                    if fetch_one:
                        return cursor.fetchone()
                    elif fetch_all:
                        return cursor.fetchall()
                    else:
                        # For INSERT/UPDATE with RETURNING
                        try:
                            return cursor.fetchone()
                        except:
                            return None
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                last_error = e
                if attempt < max_retries - 1:
                    # Retry on connection error (get_db_cursor already closed the bad connection)
                    continue
                else:
                    # Final attempt failed, raise the error
                    raise e

    @staticmethod
    def execute_many(query, params_list, commit=False):
        """Execute a query with multiple parameter sets with automatic retry on connection errors"""
        max_retries = 2
        last_error = None

        for attempt in range(max_retries):
            try:
                with get_db_cursor(commit=commit) as cursor:
                    cursor.executemany(query, params_list)
                    if commit:
                        return cursor.rowcount
                    return None
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                last_error = e
                if attempt < max_retries - 1:
                    # Retry on connection error
                    continue
                else:
                    # Final attempt failed, raise the error
                    raise e


# Global DB instance
db = DB()
