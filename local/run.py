# --- Libraries ---
import time
import db_helper as db_helper

# --- RPI ---
# RPI Librairies
import RPi.GPIO as GPIO

# set warning 
GPIO.setwarnings(False)

# RPI Constants
PUMP_PIN = 18

# Saved Constants
last_inspiration_time = -1
last_expiration_time = -1

DEFAULT_WAIT_TIME = 5


if __name__ == "__main__":

	# GPIO Setup
	GPIO.setmode(GPIO.BOARD)
	GPIO.setup(PUMP_PIN,GPIO.OUT)

	# get instance of the table
	sessionTable = db_helper.Session() 

	try:

		# Loop
		while(True):
			
			# fetch DB for last session
			sessionTable.attach()
			lastSession = sessionTable.readLast()
			sessionTable.detach()

			# if doesnt exist
			if(lastSession is None or len(lastSession) != 1):
				time.sleep(DEFAULT_WAIT_TIME)
				continue

			# get info
			lastSession = lastSession[0]
			respiration_rate = lastSession['respiration_rate']
			inspiration_expiration_ratio = lastSession['inspiration_expiration_ratio']

			if(respiration_rate is None or inspiration_expiration_ratio is None):
				# if error
				inspiration_time = last_inspiration_time
				expiration_time = last_expiration_time

			else:
				# convert to wait times
				period = 60.0/float(respiration_rate)
				inspiration_time = period*inspiration_expiration_ratio
				expiration_time = period*(1.0-inspiration_expiration_ratio)

			# update last val
			last_inspiration_time = inspiration_time
			last_expiration_time = expiration_time

			# check
			if(last_inspiration_time < 0 or last_expiration_time < 0):
				time.sleep(DEFAULT_WAIT_TIME)
				continue

			# Turn PUMP ON
			GPIO.output(PUMP_PIN,True)

			# Wait 1 second
			time.sleep(inspiration_time)

			# Turn PUMP OFF
			GPIO.output(PUMP_PIN,False)

			# Wait
			time.sleep(expiration_time)

	
	except KeyboardInterrupt:

		# Done
		print("Exiting...")
		GPIO.cleanup()





