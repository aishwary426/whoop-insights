from datetime import datetime

now = datetime.utcnow()
print(f"Original: {now}")
print(f"ISO format + Z: {now.isoformat() + 'Z'}")

now_no_micro = now.replace(microsecond=0)
print(f"Fixed (No micro): {now_no_micro}")
print(f"Fixed ISO format + Z: {now_no_micro.isoformat() + 'Z'}")
