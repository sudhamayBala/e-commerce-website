from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from API.home.core.config import settings
from API.home.DB.session import async_session, engine


                             
async def get_db():
    async with async_session() as session:
        yield session


                   
async def create_db_and_tables():
    async with engine.begin() as connection:
        await connection.run_sync(SQLModel.metadata.create_all)