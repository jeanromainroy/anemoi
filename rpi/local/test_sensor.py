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



def readSensor(sensorID):

    # get an instance of the read class
    serWrapper = serialWrapper()

    # init vars
    flowTotal = 0.0
    zeroCount = 0

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

            # convert to float
            val = float(val)

            if(key == "flow_expi" and sensorID == 1):
                flowTotal += val*0.05
                if(val <= 0.0):
                        zeroCount += 1
                else:
                        zeroCount = 0

                if(zeroCount > 200):
                        flowTotal = 0.0
                        zeroCount = 0

                print("Flow Inspi (L/min) = " + str(val) + ", total = " + str(flowTotal))

            elif(key == "flow_inspi" and sensorID == 2):
                flowTotal += val*0.05
                if(val <= 0.0):
                        zeroCount += 1
                else:
                        zeroCount = 0

                if(zeroCount > 200):
                        flowTotal = 0.0
                        zeroCount = 0

                print("Flow Expi (L/min) = " + str(val) + ", total = " + str(flowTotal))


            elif(key == "flow" and sensorID == 3):
                flowTotal += val*0.05
                if(val <= 0.0):
                        zeroCount += 1
                else:
                        zeroCount = 0

                if(zeroCount > 200):
                        flowTotal = 0.0
                        zeroCount = 0

                print("Flow (L/min) = " + str(val) + ", total = " + str(flowTotal))


            elif(key == "pressure" and sensorID == 4):
                print("Pressure (cmH2O) = " + str(val))
            

if __name__ == "__main__":

    # We create an argument parser
    parser = argparse.ArgumentParser(description='Reads the sensor data')

    # Arguments
    parser.add_argument("sensorID",help="1: Flow, 2: Pressure")
    args = parser.parse_args()

    # Check if source path exists
    if(not isNumeric(args.sensorID)):
        print("ERROR: Invalid Input")
        assert ValueError

    # get id
    sensorID = int(args.sensorID)
    if(sensorID > 2):
        print("ERROR: Not an option")
        assert ValueError

	# init
    readSensor(sensorID)
