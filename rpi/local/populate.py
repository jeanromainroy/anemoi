# --- Libraries ---
import time
import random
import db_helper as db_helper

SAMPLING_RATE = 0.2    # in s

if __name__ == "__main__":

    # get instance of the tables
    pressureTable = db_helper.Pressure() 
    flowTable = db_helper.Flow() 

    try:

        # Loop
        while(True):
            
            flowTable.attach()
            randNumb = random.randint(-20,80)
            flowTable.create(randNumb)
            flowTable.detach()

            pressureTable.attach()
            randNumb = random.randint(15,500)
            pressureTable.create(randNumb)
            pressureTable.detach()

            print(randNumb)

            time.sleep(SAMPLING_RATE)

    except KeyboardInterrupt:

        # Done
        print("Exiting...")





