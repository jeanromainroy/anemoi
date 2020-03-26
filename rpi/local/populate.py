# --- Libraries ---
import time
import random
import db_helper as db_helper


if __name__ == "__main__":

    # get instance of the table
    pressureTable = db_helper.Pressure() 
    pressureTable.attach()

    try:

        # Loop
        while(True):
            
            randNumb = random.randint(-20,80)
            print(randNumb)
            pressureTable.create(randNumb)
            time.sleep(0.1)

    except KeyboardInterrupt:

        # Done
        print("Exiting...")
        pressureTable.detach()





