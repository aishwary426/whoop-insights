#!/usr/bin/env python3
"""Clear dashboard caches"""
import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.analysis.dashboard_service import analytics_cache, summary_cache

def clear_caches():
    """Clear all dashboard caches"""
    print("Clearing dashboard caches...")
    
    # Clear analytics cache
    analytics_cache.clear()
    print(f"✅ Cleared analytics_cache (was {len(analytics_cache)} items)")
    
    # Clear summary cache
    summary_cache.clear()
    print(f"✅ Cleared summary_cache (was {len(summary_cache)} items)")
    
    print("\n🎉 All caches cleared! The dashboard will fetch fresh data on next request.")

if __name__ == "__main__":
    clear_caches()

