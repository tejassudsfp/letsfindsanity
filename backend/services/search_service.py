"""Search service with vector embeddings and semantic search"""

import openai
import os
from .database import db

openai.api_key = os.environ.get("OPENAI_API_KEY")


def get_embedding(text):
    """Generate embedding for text using OpenAI"""
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


def search_posts(query, user_id, topics=None, limit=20):
    """
    Hybrid search: semantic (vector) + keyword + filters
    """

    # Generate embedding for query
    query_embedding = get_embedding(query)

    # Build SQL query
    sql = """
        WITH vector_search AS (
            SELECT
                p.id, p.three_word_id, p.title, p.anonymized_content, p.clear_ask,
                p.intent, p.topics, p.reaction_count, p.comment_count, p.created_at,
                1 - (p.embedding <=> %s::vector) as similarity_score
            FROM posts p
            WHERE p.is_published = TRUE
            ORDER BY p.embedding <=> %s::vector
            LIMIT 50
        ),
        keyword_search AS (
            SELECT
                p.id, p.three_word_id, p.title, p.anonymized_content, p.clear_ask,
                p.intent, p.topics, p.reaction_count, p.comment_count, p.created_at,
                ts_rank(
                    to_tsvector('english', p.anonymized_content),
                    plainto_tsquery('english', %s)
                ) as keyword_score
            FROM posts p
            WHERE p.is_published = TRUE
            AND to_tsvector('english', p.anonymized_content) @@
                plainto_tsquery('english', %s)
            LIMIT 50
        ),
        combined AS (
            SELECT
                id, three_word_id, title, anonymized_content, clear_ask,
                intent, topics, reaction_count, comment_count, created_at,
                similarity_score
            FROM vector_search
            UNION
            SELECT
                id, three_word_id, title, anonymized_content, clear_ask,
                intent, topics, reaction_count, comment_count, created_at,
                0.5 as similarity_score
            FROM keyword_search
        )
        SELECT DISTINCT ON (c.id)
            c.id, c.three_word_id, c.title, c.anonymized_content, c.clear_ask,
            c.intent, c.topics, c.reaction_count, c.comment_count,
            c.created_at, c.similarity_score
        FROM combined c
    """

    params = [query_embedding, query_embedding, query, query]

    # Add topic filter if provided
    if topics:
        sql += " WHERE topics && %s"
        params.append(topics)

    sql += """
        ORDER BY id, similarity_score DESC
        LIMIT %s
    """
    params.append(limit)

    results = db.execute(sql, params, fetch_all=True)

    return [dict(row) for row in results] if results else []


def store_post_with_embedding(post_data):
    """Store post with vector embedding"""

    content = post_data['anonymized_content']
    embedding = get_embedding(content)

    result = db.execute("""
        INSERT INTO posts (
            user_id, session_id, three_word_id, original_content,
            anonymized_content, clear_ask, title, intent, topics, embedding
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, [
        post_data['user_id'],
        post_data.get('session_id'),
        post_data['three_word_id'],
        post_data['original_content'],
        post_data['anonymized_content'],
        post_data['clear_ask'],
        post_data.get('title', ''),
        post_data['intent'],
        post_data['topics'],
        embedding
    ], commit=True)

    return result['id'] if result else None
