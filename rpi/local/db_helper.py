# Librairies
import mysql.connector
from mysql.connector import Error
from mysql.connector import errorcode

# Credentials
hostname = "localhost"
db_name = "anemoi"
username = "jroy"
password = "31415926"


# Connection Getter
def getConnection():

	try:
		# Init a connection to the DB
		conn = mysql.connector.connect(host=str(hostname),database=str(db_name),user=str(username),password=str(password))
			
		return conn

	except mysql.connector.Error as error :

		conn.rollback()
		print("Failed to connect to MySQL table {}".format(error))


# --- Tables ---
class Session:

	def __init__(self):
		self.conn = None
		self.table_name = "session"	


	def attach(self):
		if(self.conn is None):
			self.conn = getConnection()
		elif(self.conn.is_connected()):
			print("INFO: DB already attached")
		else:
			self.conn = getConnection()


	def detach(self):
		if(self.conn.is_connected()):
			self.conn.close()
		else:
			print("INFO: DB already detached")


	def read(self):

		if(self.conn.is_connected()):

			# init a cursor
			cursor = self.conn.cursor()

			# build query
			query = "SELECT id, patient_id, vac_pc, vac_vc, cpap, bipap, peep, delta_p, respiration_rate, inspiration_expiration_ratio, fio2, trigger_level, tidal_volume, max_pressure, updated_at, created_at FROM " + self.table_name

			# Execute the query
			cursor.execute(query)

			# Get the returned records
			records = cursor.fetchall()

			# Go through records
			results = []
			for row in records:

				# Split the row
				id, patient_id, vac_pc, vac_vc, cpap, bipap, peep, delta_p, respiration_rate, inspiration_expiration_ratio, fio2, trigger_level, tidal_volume, max_pressure, updated_at, created_at = row

				# Append to array
				results.append({
					"id": id,
					"patient_id": patient_id,
					"vac_pc": vac_pc,
					"vac_vc": vac_vc,
					"cpap": cpap,
					"bipap": bipap,
					"peep": peep,
					"delta_p": delta_p,
					"respiration_rate": respiration_rate,
					"inspiration_expiration_ratio": inspiration_expiration_ratio,
					"fio2": fio2,
					"trigger_level": trigger_level,
					"tidal_volume": tidal_volume,
					"max_pressure": max_pressure,
					"created_at": created_at,
					"updated_at": updated_at
				})

			# Close cursor
			cursor.close()

			# Return results
			return results
		
		else:
			print("ERROR: DB is not connected")


	def readLast(self):

		if(self.conn.is_connected()):

			# init a cursor
			cursor = self.conn.cursor()

			# build query
			query = "SELECT id, patient_id, vac_pc, vac_vc, cpap, bipap, peep, delta_p, respiration_rate, inspiration_expiration_ratio, fio2, trigger_level, tidal_volume, max_pressure, updated_at, created_at FROM " + self.table_name + " ORDER BY id DESC LIMIT 1"

			# Execute the query
			cursor.execute(query)

			# Get the returned records
			records = cursor.fetchall()

			# Go through records
			results = []
			for row in records:

				# Split the row
				id, patient_id, vac_pc, vac_vc, cpap, bipap, peep, delta_p, respiration_rate, inspiration_expiration_ratio, fio2, trigger_level, tidal_volume, max_pressure, updated_at, created_at = row

				# Append to array
				results.append({
					"id": id,
					"patient_id": patient_id,
					"vac_pc": vac_pc,
					"vac_vc": vac_vc,
					"cpap": cpap,
					"bipap": bipap,
					"peep": peep,
					"delta_p": delta_p,
					"respiration_rate": respiration_rate,
					"inspiration_expiration_ratio": inspiration_expiration_ratio,
					"fio2": fio2,
					"trigger_level": trigger_level,
					"tidal_volume": tidal_volume,
					"max_pressure": max_pressure,
					"created_at": created_at,
					"updated_at": updated_at
				})

			# Close cursor
			cursor.close()

			# Return results
			return results
		
		else:
			print("ERROR: DB is not connected")

	
	def create(self, patient_id=None,  vac_pc=None,  vac_vc=None,  cpap=None,  bipap=None,  peep=None,  delta_p=None,  respiration_rate=None,  inspiration_expiration_ratio=None,  fio2=None,  trigger_level=None,  tidal_volume=None,  max_pressure=None):

		if(self.conn.is_connected()):

			# init a cursor
			cursor = self.conn.cursor()

			# build query
			query = "INSERT INTO " + self.table_name + " (patient_id, vac_pc, vac_vc, cpap, bipap, peep, delta_p, respiration_rate, inspiration_expiration_ratio, fio2, trigger_level, tidal_volume, max_pressure) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"

			# Execute the query
			cursor.execute(query, (patient_id, vac_pc, vac_vc, cpap, bipap, peep, delta_p, respiration_rate, inspiration_expiration_ratio, fio2, trigger_level, tidal_volume, max_pressure))

			# Commit the changes to the DB
			self.conn.commit()

			# Close cursor
			cursor.close()
		
		else:
			print("ERROR: DB is not connected")


	def delete(self,id):

		if(self.conn.is_connected()):

			# init a cursor
			cursor = self.conn.cursor()

			# build query
			query = "DELETE FROM " + self.table_name + " WHERE id = '" + str(id) + "'"

			# Execute the query
			cursor.execute(query)

			# Commit the changes to the DB
			self.conn.commit()

			# Close cursor
			cursor.close()
		
		else:
			print("ERROR: DB is not connected")


	def update(self, id, patient_id=None,  vac_pc=None,  vac_vc=None,  cpap=None,  bipap=None,  peep=None,  delta_p=None,  respiration_rate=None,  inspiration_expiration_ratio=None,  fio2=None,  trigger_level=None,  tidal_volume=None,  max_pressure=None):

		if(self.conn.is_connected()):

			# init a cursor
			cursor = self.conn.cursor()

			# build query
			query = "UPDATE " + self.table_name + " SET	"
			if(patient_id is not None):
				query = query + "patient_id=" + str(patient_id) + ","
			if(vac_pc is not None):
				query = query + "vac_pc=" + str(vac_pc) + ","
			if(vac_vc is not None):
				query = query + "vac_vc=" + str(vac_vc) + ","
			if(cpap is not None):
				query = query + "cpap=" + str(cpap) + ","
			if(bipap is not None):
				query = query + "bipap=" + str(bipap) + ","
			if(peep is not None):
				query = query + "peep=" + str(peep) + ","
			if(delta_p is not None):
				query = query + "delta_p=" + str(delta_p) + ","
			if(respiration_rate is not None):
				query = query + "respiration_rate=" + str(respiration_rate) + ","
			if(inspiration_expiration_ratio is not None):
				query = query + "inspiration_expiration_ratio=" + str(inspiration_expiration_ratio) + ","
			if(fio2 is not None):
				query = query + "fio2=" + str(fio2) + ","
			if(trigger_level is not None):
				query = query + "trigger_level=" + str(trigger_level) + ","
			if(tidal_volume is not None):
				query = query + "tidal_volume=" + str(tidal_volume) + ","
			if(max_pressure is not None):
				query = query + "max_pressure=" + str(max_pressure) + ","

			# remove comma
			if(query[-1] == ","):
				query = query[:-1]

			if('=' not in query):
				print("ERROR: No arguments")
				return
				
			# add where
			query = query + " WHERE id = '" + str(id) + "'"

			# Execute the query
			cursor.execute(query)

			# Commit the changes to the DB
			self.conn.commit()

			# Close cursor
			cursor.close()
		
		else:
			print("ERROR: DB is not connected")



class Pressure:

	def __init__(self):
		self.conn = None
		self.table_name = "pressure"	


	def attach(self):
		if(self.conn is None):
			self.conn = getConnection()
		elif(self.conn.is_connected()):
			print("INFO: DB already attached")
		else:
			self.conn = getConnection()


	def detach(self):
		if(self.conn.is_connected()):
			self.conn.close()
		else:
			print("INFO: DB already detached")


	def create(self, value):

		if(self.conn.is_connected()):

			# init a cursor
			cursor = self.conn.cursor()

			# build query
			query = "INSERT INTO " + self.table_name + " (value) VALUES (" + str(value) + ")"

			# Execute the query
			cursor.execute(query)

			# Commit the changes to the DB
			self.conn.commit()

			# Close cursor
			cursor.close()
		
		else:
			print("ERROR: DB is not connected")


	def read(self):

		if(self.conn.is_connected()):

			# init a cursor
			cursor = self.conn.cursor()

			# build query
			query = "SELECT value, created_at FROM " + self.table_name + " ORDER BY created_at ASC"

			# Execute the query
			cursor.execute(query)

			# Get the returned records
			records = cursor.fetchall()

			# Go through records
			results = []
			for row in records:

				# Split the row
				value, created_at = row

				# Append to array
				results.append({
					"value": value,
					"created_at": created_at
				})

			# Close cursor
			cursor.close()

			# Return results
			return results
		
		else:
			print("ERROR: DB is not connected")


	def delete(self,id):

		if(self.conn.is_connected()):

			# init a cursor
			cursor = self.conn.cursor()

			# build query
			query = "DELETE FROM " + self.table_name

			# Execute the query
			cursor.execute(query)

			# Commit the changes to the DB
			self.conn.commit()

			# Close cursor
			cursor.close()
		
		else:
			print("ERROR: DB is not connected")