# --- Libraries ---
import time
import db_helper as db_helper

import threading


# RPI Librairies
import RPi.GPIO as GPIO


# --- Sensors ---
from bmp280 import BMP280
try:
    from smbus2 import SMBus
except ImportError:
    from smbus import SMBus


# set warning 
GPIO.setwarnings(False)

# Constants
DEFAULT_WAIT_TIME = 5
DEFAULT_INSPIRATION_TIME = 4
DEFAULT_EXPIRATION_TIME = 12

# RPI Constants
PUMP_PIN = 18

# GPIO Setup
GPIO.setmode(GPIO.BOARD)
GPIO.setup(PUMP_PIN,GPIO.OUT)

# Get instance of the tables
sessionTable = db_helper.Session()
pressureTable = db_helper.Pressure()


def readPressure():

	# Initialise the BMP280
	bus = SMBus(1)
	bmp280_in = BMP280(i2c_addr=0x76,i2c_dev=bus)
	bmp280_out = BMP280(i2c_addr=0x77,i2c_dev=bus)

	while(True):

		# connect check
		connectFailed = False

		# get pressure value
		try:
			pressure_in = bmp280_in.get_pressure()
			pressure_out = bmp280_out.get_pressure()

		except OSError:
			print("ERROR: I2C Disconnected")
			connectFailed = True

		except RuntimeError:
			print("ERROR: I2C Disconnected")
			connectFailed = True

		# if failed
		if(connectFailed):

			# wait
			time.sleep(5)	

			try:
				# try to reinitialize sensors
				bus = SMBus(1)
				bmp280_in = BMP280(i2c_addr=0x76,i2c_dev=bus)
				bmp280_out = BMP280(i2c_addr=0x77,i2c_dev=bus)

			except:
				print("ERROR: I2C Disconnected and Failed to reconnect")

			# skip
			continue


		# get differential
		pressure_diff = pressure_in - pressure_out

		# convert pascal to cmh2o
		pressure_cmh2o = pressure_diff * 1.01974428892

		# fetch DB for last session
		pressureTable.attach()
		pressureTable.create(pressure_cmh2o)
		pressureTable.detach()

		time.sleep(0.2)


def runPump():

	while(True):

		# init to default values
		inspiration_time = DEFAULT_INSPIRATION_TIME
		expiration_time = DEFAULT_EXPIRATION_TIME
		
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
			respiration_rate = lastSession['respiration_rate']
			inspiration_expiration_ratio = lastSession['inspiration_expiration_ratio']

			if(respiration_rate is None or inspiration_expiration_ratio is None):
				print("ERROR: Inspiration/Expiration values are invalid")

			else:
				# convert to wait times
				period = 60.0/float(respiration_rate)
				inspiration_time = period*inspiration_expiration_ratio
				expiration_time = period*(1.0-inspiration_expiration_ratio)

		# check
		if(inspiration_time < 0 or expiration_time < 0):
			inspiration_time = DEFAULT_INSPIRATION_TIME
			expiration_time = DEFAULT_EXPIRATION_TIME

		# Turn PUMP ON
		GPIO.output(PUMP_PIN,True)

		# Wait 1 second
		time.sleep(inspiration_time)

		# Turn PUMP OFF
		GPIO.output(PUMP_PIN,False)

		# Wait
		time.sleep(expiration_time)



if __name__ == "__main__":

	try:
		
		# init
		threads = []

		# Thread 1
		p = threading.Thread(target=readPressure)
		threads.append(p)
		p.start()

		# Thread 2
		p = threading.Thread(target=runPump)
		threads.append(p)
		p.start()

		# Start the Threads
		for index, thread in enumerate(threads):
			thread.join()

	
	except KeyboardInterrupt:
		print("Keyboard interrupt")

	finally:
		# Done
		print("Exiting...")
		GPIO.cleanup()





