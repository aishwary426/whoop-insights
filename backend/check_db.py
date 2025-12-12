from app.db_session import SessionLocal
from app.models.database import DailyMetrics, User

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"Users found: {len(users)}")
    for u in users:
        print(f"User: {u.id}, Name: {u.name}")
        
    metrics_count = db.query(DailyMetrics).count()
    print(f"Total DailyMetrics rows: {metrics_count}")
    
    if metrics_count > 0:
        first = db.query(DailyMetrics).first()
        print(f"Sample metric: Date={first.date}, Recovery={first.recovery_score}")
finally:
    db.close()
