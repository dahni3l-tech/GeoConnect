import psycopg2

conn = psycopg2.connect(
    host="dpg-d9n8nee1egvs73fjmnn0-a.oregon-postgres.render.com",
    port="5432",
    database="geoconnect_tuas",
    user="geoconnect_tuas_user",
    password="tLC4jFxeKq1y3fSRx8nY3RWcztUzxbqI",
)
cursor = conn.cursor()

# Check Notification records
cursor.execute("SELECT id, recipient_id, notification_type, title, data FROM notifications_notification;")
print("NOTIFICATIONS:")
for row in cursor.fetchall():
    print(f"  id={row[0]} recipient_id={row[1]} type={row[2]} title={row[3]} data={row[4]}")

print()

# Check PushSubscription records
cursor.execute("SELECT id, user_id, endpoint FROM notifications_pushsubscription;")
print("PUSH SUBSCRIPTIONS:")
for row in cursor.fetchall():
    print(f"  id={row[0]} user_id={row[1]} endpoint={row[2][:50]}...")

print()

# Check LocationRequest records
cursor.execute("SELECT id, sender_id, receiver_id, status FROM notifications_locationrequest;")
print("LOCATION REQUESTS:")
for row in cursor.fetchall():
    print(f"  id={row[0]} sender_id={row[1]} receiver_id={row[2]} status={row[3]}")

print()

# Check FriendRequest records
cursor.execute("SELECT id, sender_id, receiver_id, status FROM accounts_friendrequest;")
print("FRIEND REQUESTS:")
for row in cursor.fetchall():
    print(f"  id={row[0]} sender_id={row[1]} receiver_id={row[2]} status={row[3]}")

cursor.close()
conn.close()
