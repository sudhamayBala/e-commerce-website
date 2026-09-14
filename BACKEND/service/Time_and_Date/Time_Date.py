from datetime import datetime
from zoneinfo import ZoneInfo


india_time = datetime.now(
    ZoneInfo("Asia/Kolkata")
)

notification_date = india_time.strftime(
    "%d %B %Y"
)

notification_time = india_time.strftime(
    "%I:%M %p"
)