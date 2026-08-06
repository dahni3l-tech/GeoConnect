import psycopg2

conn = psycopg2.connect(
    host="dpg-d9n8nee1egvs73fjmnn0-a.oregon-postgres.render.com",
    port="5432",
    database="geoconnect_tuas",
    user="geoconnect_tuas_user",
    password="tLC4jFxeKq1y3fSRx8nY3RWcztUzxbqI",
)
cursor = conn.cursor()

# Check accounts_user columns
cursor.execute("""
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'accounts_user' 
    ORDER BY ordinal_position;
""")
print("ACCOUNTS_USER COLUMNS:")
for row in cursor.fetchall():
    print(f"  {row[0]}: type={row[1]} nullable={row[2]} default={row[3]}")

print()

# Check if email column has unique constraint
cursor.execute("""
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'accounts_user' AND indexdef LIKE '%email%';
""")
print("EMAIL INDEXES:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

print()

# Check if first_name and last_name columns exist (from AbstractUser)
cursor.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'accounts_user' 
    AND column_name IN ('first_name', 'last_name', 'username', 'email', 'is_staff', 'is_active', 'is_superuser', 'last_login', 'date_joined');
""")
print("ABSTRACTUSER COLUMNS:")
rows = cursor.fetchall()
for row in rows:
    print(f"  {row[0]}")

print()

# Check if custom columns exist
cursor.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'accounts_user' 
    AND column_name NOT IN ('id', 'password', 'last_login', 'is_superuser', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_active', 'date_joined', 'bio', 'profile_picture', 'latitude', 'longitude', 'ip_address', 'is_email_verified', 'is_online', 'last_seen', 'is_guardian');
""")
print("UNEXPECTED COLUMNS:")
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"  {row[0]}")
else:
    print("  None")

cursor.close()
conn.close()
