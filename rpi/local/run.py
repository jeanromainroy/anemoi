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


def readSerial():

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
			break
		except serial.serialutil.SerialException:
			pass

	while True:

		# connect check
		connectFailed = False

		try:
			# read line and decode
			received = ser.readline().decode('utf-8').strip()

		except serial.serialutil.SerialException:
			print("ERROR: Serial Link Disconnected")
			connectFailed = True

		# if failed
		if(connectFailed):

			# wait
			time.sleep(3)	

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
					break
				except serial.serialutil.SerialException:
					pass

			# skip
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

			if(key == "flow1"):
				val = int(val)
				flowTable.attach()
				flowTable.create(val)
				flowTable.detach()

			elif(key == "flow2"):
				val = int(val)
				flowTable.attach()
				flowTable.create(val)
				flowTable.detach()

			elif(key == "pressure"):
				val = val
				pressureTable.attach()
				pressureTable.create(val)
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
