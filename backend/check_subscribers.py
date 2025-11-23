#!/usr/bin/env python3
"""
Script to check newsletter subscribers.
Shows all subscribers, their subscription status, and signup dates.
"""

from app.db_session import SessionLocal
from app.models.database import NewsletterSubscriber
from datetime import datetime

def format_datetime(dt):
    """Format datetime for display."""
    if dt is None:
        return "N/A"
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def main():
    db = SessionLocal()
    try:
        # Get all subscribers
        all_subscribers = db.query(NewsletterSubscriber).order_by(
            NewsletterSubscriber.subscribed_at.desc()
        ).all()
        
        # Separate active and inactive
        active_subscribers = [s for s in all_subscribers if s.subscribed == 1]
        inactive_subscribers = [s for s in all_subscribers if s.subscribed == 0]
        
        print("=" * 80)
        print("NEWSLETTER SUBSCRIBERS REPORT")
        print("=" * 80)
        print()
        
        print(f"Total Subscribers: {len(all_subscribers)}")
        print(f"  ✅ Active: {len(active_subscribers)}")
        print(f"  ❌ Unsubscribed: {len(inactive_subscribers)}")
        print()
        
        if active_subscribers:
            print("=" * 80)
            print("ACTIVE SUBSCRIBERS")
            print("=" * 80)
            print(f"{'#':<4} {'Email':<40} {'Subscribed At':<20}")
            print("-" * 80)
            
            for idx, subscriber in enumerate(active_subscribers, 1):
                email = subscriber.email
                subscribed_at = format_datetime(subscriber.subscribed_at)
                print(f"{idx:<4} {email:<40} {subscribed_at:<20}")
            print()
        
        if inactive_subscribers:
            print("=" * 80)
            print("UNSUBSCRIBED")
            print("=" * 80)
            print(f"{'#':<4} {'Email':<40} {'Subscribed At':<20} {'Unsubscribed At':<20}")
            print("-" * 80)
            
            for idx, subscriber in enumerate(inactive_subscribers, 1):
                email = subscriber.email
                subscribed_at = format_datetime(subscriber.subscribed_at)
                unsubscribed_at = format_datetime(subscriber.unsubscribed_at)
                print(f"{idx:<4} {email:<40} {subscribed_at:<20} {unsubscribed_at:<20}")
            print()
        
        if not all_subscribers:
            print("No subscribers found in the database.")
            print()
        
        # Export emails option (skip if not interactive)
        try:
            export = input("Would you like to export active subscriber emails to a file? (y/n): ").strip().lower()
            if export == 'y':
                filename = f"subscribers_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
                with open(filename, 'w') as f:
                    for subscriber in active_subscribers:
                        f.write(f"{subscriber.email}\n")
                print(f"✅ Exported {len(active_subscribers)} emails to {filename}")
        except (EOFError, KeyboardInterrupt):
            # Skip export prompt in non-interactive mode
            pass
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()

