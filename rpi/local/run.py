# --- Libraries ---
import time
import threading
import serial

# Get instance of the tables
import db_helper as db_helper
sessionTable = db_helper.Session()
pressureTable = db_helper.Pressure()
volumeTable = db_helper.Volume()

# Constants
DEFAULT_WAIT_TIME = 5
DEFAULT_INSPIRATION_TIME = 4
DEFAULT_EXPIRATION_TIME = 12
DEFAULT_TRIGGER = 5

NEW_INPIRATION_TIME = -1
NEW_EXPIRATION_TIME = -1
NEW_TRIGGER = -1
NEW_SESSION_ID = -1


# Serial Port
serialPorts = ["/dev/ttyACM0","/dev/ttyACM1"]

# Check if string represents a integer
def isNumeric(s):

	try: 
		float(s)
		return True
	except ValueError:
		return False


class serialWrapper:

	def __init__(self):
		self.buf = bytearray()
		self.s = self.attach()

	def attach(self):

		# Setup the serial connection
		for port in serialPorts:
			try:
				ser = serial.Serial(
						port=port,
						baudrate = 9600,
						parity=serial.PARITY_NONE,
						stopbits=serial.STOPBITS_ONE,
						bytesize=serial.EIGHTBITS,
						timeout=1
					)

				return ser

			except serial.serialutil.SerialException:
				pass

		return None

	def readBytes(self):
		i = self.buf.find(b"\n")
		if(i >= 0):
			r = self.buf[:i+1]
			self.buf = self.buf[i+1:]
			return r
		while(True):
			i = max(1, min(2048, self.s.in_waiting))
			data = self.s.read(i)
			i = data.find(b"\n")
			if(i >= 0):
				r = self.buf + data[:i+1]
				self.buf[0:] = data[i+1:]
				return r
			else:
				self.buf.extend(data)

	def safeRead(self):

		if(self.s is not None):
			try:
				return self.readBytes().decode('utf-8').strip()

			except serial.serialutil.SerialException:
				print("ERROR: Serial Linked Broken")
			
			except UnicodeDecodeError:
				print("ERROR: Invalid byte")
				time.sleep(1)
				return None

		while(True):

			# retry to connect
			time.sleep(5)
			self.s = self.attach()
			if(self.s is None):
				print("ERROR: Could not reconnect")
			else:
				break

	def write(self, payload):
		self.s.write(bytes(payload))



def serialProcess():
	global NEW_INPIRATION_TIME
	global NEW_EXPIRATION_TIME
	global NEW_SESSION_ID

	# get an instance of the read class
	serWrapper = serialWrapper()

	# attach db
	volumeTable.attach()
	pressureTable.attach()

	while True:

		# read
		received = serWrapper.safeRead()
		if(received is None or len(received) == 0):
			continue

		# split (key:value)
		args = received.split(":")
		if(len(args) != 2):
			print("INFO: received (" + str(received) + ")")
			continue

		# get args
		key = str(args[0]).strip()
		val = str(args[1]).strip()

		# if val is numeric 
		if(isNumeric(val)):

			try:
				if(key == "volume"):
					volumeTable.create(val)

				elif(key == "pressure"):
					pressureTable.create(val)
			
			except:
				print("ERROR: Could not push to DB")
				volumeTable.detach()
				pressureTable.detach()

		# Check if we need to write
		if(NEW_INPIRATION_TIME > 0):
			payload = 'inspiration_time:' + str(NEW_INPIRATION_TIME) + ";"
			payload = payload.encode('utf-8')
			serWrapper.write(payload)
			NEW_INPIRATION_TIME = -1

		if(NEW_EXPIRATION_TIME > 0):
			payload = 'expiration_time:' + str(NEW_EXPIRATION_TIME) + ";"
			payload = payload.encode('utf-8')
			serWrapper.write(payload)
			NEW_EXPIRATION_TIME = -1

		if(NEW_TRIGGER > 0):
			payload = 'trigger:' + str(NEW_TRIGGER) + ";"
			payload = payload.encode('utf-8')
			serWrapper.write(payload)
			NEW_TRIGGER = -1



def readSessions():
	global NEW_INPIRATION_TIME
	global NEW_EXPIRATION_TIME
	global NEW_SESSION_ID

	while(True):

		# init to default values
		inspiration_time = DEFAULT_INSPIRATION_TIME
		expiration_time = DEFAULT_EXPIRATION_TIME
		trigger_level = DEFAULT_TRIGGER
		
		# fetch DB for last session
		sessionTable.attach()
		lastSession = sessionTable.readLast()
		sessionTable.detach()

		# if doesnt exist
		if(lastSession is None or len(lastSession) != 1):
			print("ERROR: No last session")
		else:

			# get info
			lastSession = lastSession[0]
			lastSession_id = lastSession['id']
			respiration_rate = lastSession['respiration_rate']
			inspiration_expiration_ratio = lastSession['inspiration_expiration_ratio']
			trigger_level = lastSession['trigger_level']

			if(respiration_rate is None or inspiration_expiration_ratio is None):
				print("ERROR: Inspiration/Expiration values are invalid")

			else:
				# convert to wait times
				period = 60.0/float(respiration_rate)
				inspiration_time = period*inspiration_expiration_ratio
				expiration_time = period*(1.0-inspiration_expiration_ratio)

				# update
				if(NEW_SESSION_ID != lastSession_id):
					NEW_INPIRATION_TIME = inspiration_time
					NEW_EXPIRATION_TIME = expiration_time
					NEW_TRIGGER = trigger_level
					NEW_SESSION_ID = lastSession_id


		# sleep
		time.sleep(DEFAULT_WAIT_TIME)


if __name__ == "__main__":
		
	# init
	threads = []

	# Thread 1
	p = threading.Thread(target=serialProcess)
	threads.append(p)
	p.start()

	# Thread 2
	p = threading.Thread(target=readSessions)
	threads.append(p)
	p.start()

	# Start the Threads
	for index, thread in enumerate(threads):
		thread.join()
