#!/usr/bin/env python3
"""
Script to add blog posts to the database.
Usage: python add_blog_post.py
"""

import sys
import os
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db_session import SessionLocal
from app.models.database import BlogPost
import re


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title."""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


def add_blog_post(
    title: str,
    category: str,
    preview: str,
    reading_time: str = None,
    content: str = None,
    slug: str = None,
    published: int = 1
):
    """Add a blog post to the database."""
    db: Session = SessionLocal()
    
    try:
        # Generate slug if not provided
        if not slug:
            slug = generate_slug(title)
        
        # Check if slug already exists
        existing = db.query(BlogPost).filter(BlogPost.slug == slug).first()
        if existing:
            print(f"⚠️  Blog post with slug '{slug}' already exists. Updating instead...")
            # Update existing post
            existing.title = title
            existing.category = category
            existing.preview = preview
            existing.reading_time = reading_time
            existing.content = content
            existing.published = published
            existing.updated_at = datetime.utcnow()
            db.commit()
            print(f"✅ Updated blog post: {title} (ID: {existing.id})")
            return existing.id
        
        # Create new post
        post = BlogPost(
            title=title,
            category=category,
            reading_time=reading_time,
            preview=preview,
            content=content,
            slug=slug,
            published=published
        )
        
        db.add(post)
        db.commit()
        db.refresh(post)
        
        print(f"✅ Created blog post: {title} (ID: {post.id}, Slug: {slug})")
        return post.id
    
    except Exception as e:
        db.rollback()
        print(f"❌ Error adding blog post: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("📝 Add Blog Post")
    print("=" * 50)
    
    # Example blog posts (the ones that were hardcoded)
    posts = [
        {
            "title": 'Why Your "Optimal Bedtime" Is Probably Wrong (And How to Find Your Real One)',
            "category": "Recovery Science",
            "reading_time": "6 min",
            "preview": 'Generic sleep advice tells you to go to bed at 10 PM. But when we analyzed 50,000 sleep sessions, we found that optimal bedtimes vary by over 3 hours between individuals — and most people are sleeping at the wrong time for their body...'
        },
        {
            "title": "The Strain Threshold Most Athletes Get Wrong",
            "category": "Training Insights",
            "reading_time": "5 min",
            "preview": "You've probably heard that a strain score of 14+ is \"optimal.\" But our data shows that personal strain thresholds vary from 10 to 18 depending on the individual. Here's how to find yours — and why exceeding it tanks your recovery..."
        },
        {
            "title": "How One Marathoner Improved Recovery by 23% in 6 Weeks",
            "category": "Case Studies",
            "reading_time": "8 min",
            "preview": "Sarah had been training for Boston for 18 months. Her recovery scores averaged 52%. After using Whoop Insights to optimize her sleep timing and identify her strain threshold, she hit 64% average recovery — and a PR..."
        },
        {
            "title": "New Feature: Multi-Day Recovery Forecasting",
            "category": "Product Updates",
            "reading_time": "3 min",
            "preview": "Today we're launching 7-day recovery forecasting for Pro users. Now you can plan your entire training week with confidence, knowing when you'll be ready to push and when you'll need to rest..."
        }
    ]
    
    print(f"\nAdding {len(posts)} example blog posts...\n")
    
    for post in posts:
        try:
            add_blog_post(**post)
        except Exception as e:
            print(f"Failed to add post: {post['title']}")
            print(f"Error: {e}\n")
    
    print("\n" + "=" * 50)
    print("✨ Done!")
    print("\nTo add more blog posts, you can:")
    print("1. Use this script and modify the 'posts' list")
    print("2. Use the API endpoint: POST /api/v1/blog")
    print("3. Use a REST client like Postman or curl")
    print("\nExample curl command:")
    print('curl -X POST "http://localhost:8000/api/v1/blog" \\')
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{"title":"Your Title","category":"Recovery Science","preview":"Your preview text...","slug":"your-title-slug","published":1}\'')























