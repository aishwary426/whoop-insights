#!/usr/bin/env python3
"""
Script to add an email to the admin list.
Usage: python add_admin.py <email>

This script will:
1. Add the email to the ADMIN_EMAILS environment variable in .env file (if it exists)
2. Or show you the command to set it manually
"""
import sys
import os
import re
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core_config import get_settings


from typing import Tuple

def update_env_file(email: str, env_file: Path) -> Tuple[bool, list]:
    """Update .env file with new admin email. Returns (success, updated_admin_list)."""
    email = email.strip().lower()
    
    # Read current .env file
    env_content = ""
    if env_file.exists():
        env_content = env_file.read_text()
    
    # Check if ADMIN_EMAILS already exists in .env
    admin_emails_pattern = re.compile(r'^ADMIN_EMAILS\s*=\s*(.+)$', re.MULTILINE)
    match = admin_emails_pattern.search(env_content)
    
    if match:
        # Parse existing admin emails
        existing_emails_str = match.group(1).strip().strip('"').strip("'")
        existing_emails = [e.strip().lower() for e in existing_emails_str.split(",") if e.strip()]
        
        # Check if email already exists
        if email in existing_emails:
            return True, existing_emails
        
        # Add new email
        existing_emails.append(email)
        new_value = ",".join(existing_emails)
        
        # Replace the line
        new_content = admin_emails_pattern.sub(f'ADMIN_EMAILS={new_value}', env_content)
        updated_list = existing_emails
    else:
        # ADMIN_EMAILS doesn't exist, add it
        # Get current admins from settings to preserve them
        settings = get_settings()
        current_admins = [admin.lower() for admin in settings.admin_emails]
        
        # Add new email if not already in list
        if email not in current_admins:
            current_admins.append(email)
        
        if env_content and not env_content.endswith("\n"):
            env_content += "\n"
        admin_emails_value = ",".join(current_admins)
        new_content = env_content + f"ADMIN_EMAILS={admin_emails_value}\n"
        updated_list = current_admins
    
    # Write back to file
    env_file.write_text(new_content)
    return True, updated_list


def add_admin_email(email: str):
    """Add an email to the admin list via environment variable."""
    email = email.strip().lower()
    
    if not email or "@" not in email:
        print(f"❌ Invalid email address: {email}")
        return False
    
    # Get current admin emails from settings
    settings = get_settings()
    current_admins = settings.admin_emails.copy()
    
    # Check if already an admin
    if email in [admin.lower() for admin in current_admins]:
        print(f"✅ {email} is already an admin")
        return True
    
    # Try to update .env file
    env_file = backend_dir / ".env"
    if env_file.exists() or True:  # Try to create/update .env file
        try:
            success, updated_list = update_env_file(email, env_file)
            if success:
                print(f"✅ Added {email} to admin list in .env file")
                print(f"📝 Updated admin emails: {', '.join(updated_list)}")
                print(f"\n⚠️  Note: You'll need to restart the backend server for changes to take effect.")
                return True
        except Exception as e:
            print(f"⚠️  Could not update .env file: {e}")
            print(f"   Falling back to manual instructions...")
    
    # Fallback: show manual instructions
    current_admins.append(email)
    admin_emails_str = ",".join(current_admins)
    
    print(f"📝 Current admin emails: {', '.join(current_admins)}")
    print(f"\n✅ To add {email} as admin, set the ADMIN_EMAILS environment variable:")
    print(f"\n   export ADMIN_EMAILS=\"{admin_emails_str}\"")
    print(f"\n   Or add to your .env file:")
    print(f"   ADMIN_EMAILS={admin_emails_str}")
    print(f"\n⚠️  Note: You'll need to restart the backend server for changes to take effect.")
    
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python add_admin.py <email>")
        print("\nExample:")
        print("  python add_admin.py admin@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    success = add_admin_email(email)
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()

