import sqlite3

def find_aiza(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    
    for table in tables:
        try:
            cursor.execute('SELECT * FROM ' + table)
            rows = cursor.fetchall()
            for row in rows:
                for col in row:
                    if isinstance(col, str) and 'AIza' in col:
                        print(f'Found AIza in table {table}: {col[:30]}...')
                        
                        # Let's clean the column by replacing the key
                        new_col = col.replace(col, 'REDACTED_API_KEY')
                        # We need the primary key or something, assume id is first column
                        try:
                            pk_name = cursor.execute(f"PRAGMA table_info({table})").fetchone()[1]
                            pk_val = row[0]
                            print(f"Updating table {table} where id={pk_val}")
                            
                            # find column name
                            cursor.execute(f"PRAGMA table_info({table})")
                            columns = [info[1] for info in cursor.fetchall()]
                            col_index = row.index(col)
                            col_name = columns[col_index]
                            
                            cursor.execute(f"UPDATE {table} SET {col_name} = ? WHERE {pk_name} = ?", (new_col, pk_val))
                            conn.commit()
                            print(f"Successfully redacted secret from {table}.{col_name}")
                        except Exception as e:
                            print(f"Could not update: {e}")
        except Exception as e:
            pass

find_aiza('backend/db.sqlite3')
