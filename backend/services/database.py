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
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()


class DB:
    """Database query helper"""

    @staticmethod
    def execute(query, params=None, fetch_one=False, fetch_all=False, commit=False):
        """Execute a query and optionally return results"""
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

    @staticmethod
    def execute_many(query, params_list, commit=False):
        """Execute a query with multiple parameter sets"""
        with get_db_cursor(commit=commit) as cursor:
            cursor.executemany(query, params_list)
            if commit:
                return cursor.rowcount
            return None


# Global DB instance
db = DB()
