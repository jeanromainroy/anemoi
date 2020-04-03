# --- Libraries ---
import time
import random
import db_helper as db_helper

SAMPLING_RATE = 0.01    # in s

if __name__ == "__main__":

    # get instance of the tables
    pressureTable = db_helper.Pressure() 
    volumeTable = db_helper.Volume() 

    # Loop
    try:

        while(True):

            volumeTable.attach()
            randNumb = random.randint(0,10)
            volumeTable.create(randNumb)
            volumeTable.detach()

            pressureTable.attach()
            randNumb = random.randint(0,3)
            pressureTable.create(randNumb)
            pressureTable.detach()

            print(randNumb)

            time.sleep(SAMPLING_RATE)

    except KeyboardInterrupt:

        # Done
        print("Exiting...")





