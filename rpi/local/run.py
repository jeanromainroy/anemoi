# --- Libraries ---
import time
import threading
import serial

# Get instance of the tables
import db_helper as db_helper
sessionTable = db_helper.Session()
pressureTable = db_helper.Pressure()
flowTable = db_helper.Flow()

# Setup the serial connection
ser = serial.Serial(
        port='/dev/ttyACM0',
        baudrate = 9600,
        parity=serial.PARITY_NONE,
        stopbits=serial.STOPBITS_ONE,
        bytesize=serial.EIGHTBITS,
        timeout=1
	)

def readSerial():

	while True:

		# read line and decode
		received = ser.readline().decode('utf-8')

		# split (key:value)
		args = received.split(":")
		if(len(args) != 2):
			continue

		# get args
		key = str(args[0]).strip()
		val = str(args[1]).strip()

		# if val is numeric 
		if(isinstance(val, (int, float)) and not isinstance(x, bool)):

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

	try:
		
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

	
	except KeyboardInterrupt:
		print("Keyboard interrupt")

	finally:
		# Done
		print("Exiting...")





