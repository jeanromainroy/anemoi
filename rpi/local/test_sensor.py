import serial
import argparse
import time

# Serial Port
serialPorts = ["/dev/ttyACM0","/dev/ttyACM1"]

# Check if string represents a integer
def isNumeric(s):

	try: 
		float(s)
		return True
	except ValueError:
		return False


class serialWrapper:

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

	def safeRead(self):

		if(self.s is not None):
			try:
				return self.readBytes().decode('utf-8').strip()

			except serial.serialutil.SerialException:
				print("ERROR: Serial Linked Broken")
			
			except UnicodeDecodeError:
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

	def write(self, payload):
		self.s.write(bytes(payload))



def readSensor(sensorID, offset):

    # get an instance of the read class
    serWrapper = serialWrapper()

    # init vars
    volumeTotal = 0.0
    zeroCount = 0
    samplingTime = 0.05

    while True:

        # read
        received = serWrapper.safeRead()
        if(received is None or len(received) == 0):
            continue

        # split (key:value)
        args = received.split(":")
        if(len(args) != 2):
            print("INFO: received (" + str(received) + ")")
            continue

        # get args
        key = str(args[0]).strip()
        val = str(args[1]).strip()

        # if val is numeric 
        if(isNumeric(val)):

            if(key == "volume_expi" and sensorID == 1):

                # convert to float
                val = float(val) + offset
                if(val <= 1 and val >= -1):
                    val = 0

                volumeTotal += val*samplingTime
                if(val <= 0.0):
                        zeroCount += 1
                else:
                        zeroCount = 0

                if(zeroCount > 200):
                        volumeTotal = 0.0
                        zeroCount = 0

                print("Volume Inspi (L/min) = " + str(val) + ", total = " + str(volumeTotal))

            elif(key == "volume_inspi" and sensorID == 2):
                
                # convert to float
                val = float(val) + offset
                if(val <= 1 and val >= -1):
                    val = 0
                    
                volumeTotal += val*samplingTime
                if(val <= 0.0):
                        zeroCount += 1
                else:
                        zeroCount = 0

                if(zeroCount > 200):
                        volumeTotal = 0.0
                        zeroCount = 0

                print("Volume Expi (L/min) = " + str(val) + ", total = " + str(volumeTotal))


            elif(key == "volume" and sensorID == 3):
                
                # convert to float
                val = float(val) + offset
                if(val <= 1 and val >= -1):
                    val = 0

                volumeTotal += val*samplingTime
                if(val <= 0.0):
                        zeroCount += 1
                else:
                        zeroCount = 0

                if(zeroCount > 200):
                        volumeTotal = 0.0
                        zeroCount = 0

                print("Volume (L/min) = " + str(val) + ", total = " + str(volumeTotal))


            elif(key == "pressure"):
                
                # convert to float
                val = float(val)
                if(sensorID == 4):
                    val = val + offset

                if(val <= 1 and val >= -1):
                    val = 0

                print("Pressure (cmH2O) = " + str(val))
            

if __name__ == "__main__":

    # We create an argument parser
    parser = argparse.ArgumentParser(description='Reads the sensor data')

    # Arguments
    parser.add_argument("sensorID",help="1: Volume, 2: Pressure")
    parser.add_argument("offset", help="y = ax+b, this is the b")
    args = parser.parse_args()

    # Check if source path exists
    if(not isNumeric(args.sensorID)):
        print("ERROR: Invalid Input")
        assert ValueError

    # get id
    sensorID = int(args.sensorID)
    if(sensorID > 4):
        print("ERROR: Not an option")
        assert ValueError

        # init
    readSensor(sensorID, float(args.offset))


