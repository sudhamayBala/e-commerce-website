import asyncio
from sqlalchemy import text
from API.home.DB.session import engine

async def main():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE IF EXISTS carts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;"))
        await conn.execute(text("UPDATE carts SET created_at = NOW() WHERE created_at IS NULL;"))
        await conn.execute(text("ALTER TABLE IF EXISTS carts ALTER COLUMN created_at SET DEFAULT NOW();"))
        columns = (await conn.execute(text("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name='carts' ORDER BY ordinal_position"))).fetchall()
        users = (await conn.execute(text("SELECT id, email FROM users ORDER BY id LIMIT 5"))).fetchall()
        print('COLUMNS:', columns)
        print('USERS:', users)

asyncio.run(main())
