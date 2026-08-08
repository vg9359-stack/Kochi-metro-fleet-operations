import asyncio
import asyncpg
import ssl

# Paste the EXACT External Database URL copied from your Render Dashboard here:
DATABASE_URL = "postgresql://kochi_metro_db_user:YLlNHutJVBNmHYca62pUH3bSAIiDom8R@dpg-d9ra3rvavr4c738oshjg-a.singapore-postgres.render.com/kochi_metro_db"

async def init_schema():
    print("Connecting to Render PostgreSQL...")
    
    # Create an SSL context that bypasses certificate verification for quick setup
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        conn = await asyncpg.connect(DATABASE_URL, ssl=ssl_context)
        print("Connected successfully!")
        
        with open("schema.sql", "r") as f:
            schema_sql = f.read()
            
        print("Executing schema.sql...")
        await conn.execute(schema_sql)
        print("Database tables & PostGIS initialized successfully!")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(init_schema())