import asyncio
import sqlalchemy
from API.home.DB.session import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(
            sqlalchemy.text("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position")
        )
        print(result.fetchall())

asyncio.run(main())
