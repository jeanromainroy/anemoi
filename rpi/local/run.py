# --- Libraries ---
import time
import threading
import serial

# Get instance of the tables
import db_helper as db_helper
sessionTable = db_helper.Session()
pressureTable = db_helper.Pressure()
flowTable = db_helper.Flow()

# Serial Port
serialPorts = ["/dev/ttyACM0","/dev/ttyACM1"]

# Check if string represents a integer
def isNumeric(s):

	try: 
		float(s)
		return True
	except ValueError:
		return False


class serialReader:

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

	def readLine(self):

		try:
			return self.readBytes().decode('utf-8').strip()

		except serial.serialutil.SerialException:
			print("ERROR: Serial Linked Broken")
		
		except: UnicodeDecodeError:
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


def readSerial():

	# get an instance of the read class
	serReader = serialReader()

	# attach db
	flowTable.attach()
	pressureTable.attach()

	while True:

		# read
		received = serReader.readLine()
		if(received is None or len(received) == 0):
			continue

		# split (key:value)
		args = received.split(":")
		if(len(args) != 2):
			continue

		# get args
		key = str(args[0]).strip()
		val = str(args[1]).strip()

		# if val is numeric 
		if(isNumeric(val)):

			try:
				if(key == "flow"):
					flowTable.create(val)

				elif(key == "pressure"):
					pressureTable.create(val)
			
			except:
				print("ERROR: Could not push to DB")
				flowTable.detach()
				pressureTable.detach()


if __name__ == "__main__":
		
	# init
	threads = []

	# Thread 1
	p = threading.Thread(target=readSerial)
	threads.append(p)
	p.start()

	# # Thread 2
	# p = threading.Thread(target=runPump)
	# threads.append(p)
	# p.start()

	# # Thread 3
	# p = threading.Thread(target=readFlowCenter)
	# threads.append(p)
	# p.start()

	# Start the Threads
	for index, thread in enumerate(threads):
		thread.join()
