# --- Libraries ---
import time
import random
import db_helper as db_helper

SAMPLING_RATE = 0.2    # in s

if __name__ == "__main__":

    # get instance of the tables
    pressureTable = db_helper.Pressure() 
    volumeTable = db_helper.Volume() 

    try:

        # Loop
        while(True):
            
            volumeTable.attach()
            randNumb = random.randint(0,1000)
            volumeTable.create(randNumb)
            volumeTable.detach()

            pressureTable.attach()
            randNumb = random.randint(0,40)
            pressureTable.create(randNumb)
            pressureTable.detach()

            print(randNumb)

            time.sleep(SAMPLING_RATE)

    except KeyboardInterrupt:

        # Done
        print("Exiting...")





