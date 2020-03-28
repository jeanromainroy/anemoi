# --- Libraries ---
import time
import db_helper as db_helper

import threading


# Get instance of the tables
sessionTable = db_helper.Session()
pressureTable = db_helper.Pressure()
flowTable = db_helper.Flow()


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

		# Thread 3
		p = threading.Thread(target=readFlowCenter)
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





