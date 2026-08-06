import psycopg2

conn = psycopg2.connect(
    host="dpg-d9n8nee1egvs73fjmnn0-a.oregon-postgres.render.com",
    port="5432",
    database="geoconnect_tuas",
    user="geoconnect_tuas_user",
    password="tLC4jFxeKq1y3fSRx8nY3RWcztUzxbqI",
)
cursor = conn.cursor()

# Check indexes on accounts_user
cursor.execute("""
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'accounts_user' AND schemaname = 'public';
""")
print("INDEXES ON accounts_user:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

print()

# Check constraints on accounts_user
cursor.execute("""
    SELECT conname, contype, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'accounts_user'::regclass AND contype = 'u';
""")
print("UNIQUE CONSTRAINTS ON accounts_user:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[2]}")

print()

# Check for duplicate emails
cursor.execute("""
    SELECT email, COUNT(*) 
    FROM accounts_user 
    GROUP BY email 
    HAVING COUNT(*) > 1;
""")
print("DUPLICATE EMAILS:")
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"  email={row[0]} count={row[1]}")
else:
    print("  None")

print()

# Check for duplicate usernames
cursor.execute("""
    SELECT username, COUNT(*) 
    FROM accounts_user 
    GROUP BY username 
    HAVING COUNT(*) > 1;
""")
print("DUPLICATE USERNAMES:")
rows = cursor.fetchall()
if rows:
    for row in rows:
        print(f"  username={row[0]} count={row[1]}")
else:
    print("  None")

print()

# Check constraints on accounts_familyinvitation
cursor.execute("""
    SELECT conname, contype, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'accounts_familyinvitation'::regclass;
""")
print("CONSTRAINTS ON accounts_familyinvitation:")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}): {row[2]}")

print()

# Check indexes on accounts_familyinvitation
cursor.execute("""
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'accounts_familyinvitation' AND schemaname = 'public';
""")
print("INDEXES ON accounts_familyinvitation:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

print()

# Check constraints on accounts_locationpermission
cursor.execute("""
    SELECT conname, contype, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'accounts_locationpermission'::regclass;
""")
print("CONSTRAINTS ON accounts_locationpermission:")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}): {row[2]}")

print()

# Check constraints on accounts_activitylog
cursor.execute("""
    SELECT conname, contype, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'accounts_activitylog'::regclass;
""")
print("CONSTRAINTS ON accounts_activitylog:")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}): {row[2]}")

print()

# Check constraints on accounts_sosalert
cursor.execute("""
    SELECT conname, contype, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'accounts_sosalert'::regclass;
""")
print("CONSTRAINTS ON accounts_sosalert:")
for row in cursor.fetchall():
    print(f"  {row[0]} ({row[1]}): {row[2]}")

print()

# Check if FamilyInvitation guardian/child foreign keys exist
cursor.execute("""
    SELECT cl.relname, a.attname 
    FROM pg_constraint con 
    JOIN pg_class cl ON con.conrelid = cl.oid 
    JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey) 
    WHERE con.conrelid = 'accounts_familyinvitation'::regclass 
    AND con.contype = 'f';
""")
print("FOREIGN KEYS ON accounts_familyinvitation:")
for row in cursor.fetchall():
    print(f"  table={row[0]} column={row[1]}")

print()

# Check if LocationPermission child/guardian foreign keys exist
cursor.execute("""
    SELECT cl.relname, a.attname 
    FROM pg_constraint con 
    JOIN pg_class cl ON con.conrelid = cl.oid 
    JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey) 
    WHERE con.conrelid = 'accounts_locationpermission'::regclass 
    AND con.contype = 'f';
""")
print("FOREIGN KEYS ON accounts_locationpermission:")
for row in cursor.fetchall():
    print(f"  table={row[0]} column={row[1]}")

print()

# Check if SOSAlert child foreign key exists
cursor.execute("""
    SELECT cl.relname, a.attname 
    FROM pg_constraint con 
    JOIN pg_class cl ON con.conrelid = cl.oid 
    JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey) 
    WHERE con.conrelid = 'accounts_sosalert'::regclass 
    AND con.contype = 'f';
""")
print("FOREIGN KEYS ON accounts_sosalert:")
for row in cursor.fetchall():
    print(f"  table={row[0]} column={row[1]}")

print()

# Check if ActivityLog user foreign key exists
cursor.execute("""
    SELECT cl.relname, a.attname 
    FROM pg_constraint con 
    JOIN pg_class cl ON con.conrelid = cl.oid 
    JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(con.conkey) 
    WHERE con.conrelid = 'accounts_activitylog'::regclass 
    AND con.contype = 'f';
""")
print("FOREIGN KEYS ON accounts_activitylog:")
for row in cursor.fetchall():
    print(f"  table={row[0]} column={row[1]}")

cursor.close()
conn.close()
