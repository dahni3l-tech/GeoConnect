import psycopg2

conn = psycopg2.connect(
    host="dpg-d9n8nee1egvs73fjmnn0-a.oregon-postgres.render.com",
    port="5432",
    database="geoconnect_tuas",
    user="geoconnect_tuas_user",
    password="tLC4jFxeKq1y3fSRx8nY3RWcztUzxbqI",
)
cursor = conn.cursor()

# Check all schemas
cursor.execute("SELECT schema_name FROM information_schema.schemata;")
print("SCHEMAS:")
for row in cursor.fetchall():
    print(f"  {row[0]}")

print()

# Check for token_blacklist tables in all schemas
cursor.execute("""
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name LIKE 'token_blacklist%';
""")
print("TOKEN BLACKLIST TABLES (all schemas):")
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"  schema={row[0]} table={row[1]}")
else:
    print("  NONE FOUND!")

print()

# Check django_migrations for all apps
cursor.execute("""
    SELECT app, COUNT(*) as count 
    FROM django_migrations 
    GROUP BY app 
    ORDER BY app;
""")
print("MIGRATIONS BY APP:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} migrations")

print()

# Check if there are any outstanding tokens by trying to query the table
try:
    cursor.execute('SELECT COUNT(*) FROM token_blacklist_outstandingtoken;')
    count = cursor.fetchone()[0]
    print(f"Outstanding tokens: {count}")
except Exception as e:
    print(f"Error querying outstanding tokens: {e}")

print()

# Check if there are any blacklisted tokens
try:
    cursor.execute('SELECT COUNT(*) FROM token_blacklist_blacklistedtoken;')
    count = cursor.fetchone()[0]
    print(f"Blacklisted tokens: {count}")
except Exception as e:
    print(f"Error querying blacklisted tokens: {e}")

cursor.close()
conn.close()
