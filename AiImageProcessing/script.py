import pyodbc
from app.model import user_model
# Connection string for Windows Authentication
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=JOHNFUZIUNE\SQLEXPRESS;"
    "DATABASE=MoleCancerDetector;"
    "Trusted_Connection=yes;"
)


try:
    conn = pyodbc.connect(connection_string)
    print("Connection successful!")
    cursor = conn.cursor()
    cursor.execute("SELECT * from users")
    row = cursor.fetchone()
    print(row)
    conn.close()
except pyodbc.Error as e:
    print(f"Connection failed: {e}")