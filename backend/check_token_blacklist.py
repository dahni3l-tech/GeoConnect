import psycopg2

conn = psycopg2.connect(
    host="dpg-d9n8nee1egvs73fjmnn0-a.oregon-postgres.render.com",
    port="5432",
    database="geoconnect_tuas",
    user="geoconnect_tuas_user",
    password="tLC4jFxeKq1y3fSRx8nY3RWcztUzxbqI",
)
cursor = conn.cursor()

cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
print("ALL TABLES:")
for row in cursor.fetchall():
    print(f"  {row[0]}")

print()

# Check if token_blacklist tables exist
cursor.execute("""
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='public' AND table_name LIKE 'token_blacklist%';
""")
print("TOKEN BLACKLIST TABLES:")
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"  {row[0]}")
else:
    print("  NONE FOUND!")

print()

# Check django_migrations for token_blacklist
cursor.execute("""
    SELECT id, app, name, applied 
    FROM django_migrations 
    WHERE app = 'token_blacklist';
""")
print("TOKEN BLACKLIST MIGRATIONS:")
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"  id={row[0]} app={row[1]} name={row[2]} applied={row[3]}")
else:
    print("  NONE FOUND!")

cursor.close()
conn.close()
