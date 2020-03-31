// Libs
#include <Wire.h>
#include <EEPROM.h>
#include "SparkFunBME280.h"

// Allow unsigned char to be written as uchar
typedef unsigned char uchar;

// GENERAL
int LOOP_DELAY = 10; // in ms
int SENSOR_SAMPLE_RATE = 100; // in ms
int counter = 0;

// Get I2C instances of pressure/temp sensors
BME280 bmp_in; //Uses default I2C address 0x77
BME280 bmp_out; //Uses I2C address 0x76 (jumper closed)
float pressure_calib_a = 1.14;
float pressure_calib_b = 0.0;

// The Venturi ADC Pins
#define ADC_CLK 13
#define ADC_CS  12
#define ADC_DI 11
#define ADC_DO 10
float sensor1_calib_b = 8;
float sensor2_calib_b = 11;
float flow_calib_a = 510.96;


// Pump pins
#define PUMP_OUT 3
int inspiration_addr = 0;
int expiration_addr = 1;
int inspirationTime = -1;
int expirationTime = -1;
int DEFAULT_INSPIRATION_TIME = 2; // in s
int DEFAULT_EXPIRATION_TIME = 3;  // in s


void setup() {
  
  Serial.begin(9600);
  Serial.println("Initialization Sequence...");

  // BMP
  Wire.begin();
  bmp_out.setI2CAddress(0x77); //The default for the SparkFun Environmental Combo board is 0x77 (jumper open).
  if(bmp_out.beginI2C() == false){
    Serial.println("BMP280 Out connect failed");
    return;  
  }
  bmp_in.setI2CAddress(0x76); //Connect to a second sensor
  if(bmp_in.beginI2C() == false){
    Serial.println("BMP280 In connect failed");
    return;  
  }

  // Set the ADC Pins
  pinMode(ADC_CS, OUTPUT);
  pinMode(ADC_CLK, OUTPUT);
  pinMode(ADC_DI, OUTPUT);
  pinMode(ADC_DO, INPUT); 

  // Set the Pump Pin
  pinMode(PUMP_OUT, OUTPUT);  
  readPumpParams();
  if(inspirationTime <= 0 || expirationTime <= 0){
    updateInspirationTime(DEFAULT_INSPIRATION_TIME);
    updateExpirationTime(DEFAULT_EXPIRATION_TIME);
  }
  readPumpParams();
  digitalWrite(PUMP_OUT, 0);
  Serial.print("inspiration:");
  Serial.println(inspirationTime);
  Serial.print("expiration:");
  Serial.println(expirationTime);
}


int getADC(short channel){
  // Chip ADC0832

  if(channel != 0 && channel != 1){
    return 0;
  }
  
  pinMode(ADC_DO, OUTPUT); 

  // Bring CS Low
  digitalWrite(ADC_CS, 1); delayMicroseconds(2);
  digitalWrite(ADC_CS, 0);

  // Start Clock
  digitalWrite(ADC_CLK, 0); delayMicroseconds(2);

  // Input MUX Addr
  digitalWrite(ADC_DI, 1); delayMicroseconds(2);
  digitalWrite(ADC_CLK, 1); delayMicroseconds(2);
  digitalWrite(ADC_CLK, 0); delayMicroseconds(2);
  
  digitalWrite(ADC_DI, 1); delayMicroseconds(2);
  digitalWrite(ADC_CLK, 1); delayMicroseconds(2);
  digitalWrite(ADC_CLK, 0); delayMicroseconds(2);
  
  digitalWrite(ADC_DI, channel); delayMicroseconds(2);
  digitalWrite(ADC_CLK, 1); delayMicroseconds(2);
  digitalWrite(ADC_CLK, 0); delayMicroseconds(2);

  // Read 8 bit ADC
  uchar dat=0;
  for(short i=0; i<8; i++){
    digitalWrite(ADC_CLK, 1); delayMicroseconds(2);
    digitalWrite(ADC_CLK, 0); delayMicroseconds(2);
    
    pinMode(ADC_DO, INPUT);
    dat=dat<<1 | digitalRead(ADC_DO);
  }

  // Convert to int
  int value = 0;
  for(unsigned int i=0; i<8; i++) {
    if(bitRead(dat,i) == 1){
      value += pow(2,i);
    }    
  }

  return value;  
}


void readPressure(){

  // Get the pressure diff between the two sensors in hPa
  float pressure_in = bmp_in.readFloatPressure();
  float pressure_out = bmp_out.readFloatPressure();
  
  float pressureDiff = (pressure_in - pressure_out)*0.01;

  // Convert to cm h2o
  pressureDiff = pressureDiff*1.0197;

  // Use calibration
  pressureDiff = pressure_calib_a*pressureDiff + pressure_calib_b;

  // Print
  Serial.print("pressure:");
  Serial.println(pressureDiff, 2);  // 2 decimals
}

void readTemp(){

  // Read in *C
  float temp = bmp_in.readTempC();
  
  // Print
  Serial.print("temperature:");
  Serial.println(temp, 2);  // 2 decimals  
}

void readFlow(){

  // Read differential pressures
  int diffPressure1 = int(getADC(0)) - sensor1_calib_b;    // expiration
  int diffPressure2 = int(getADC(1)) - sensor2_calib_b;    // inspiration

  // We are going to take the sqrt, make sure its positive
  if(diffPressure1 < 0){
    diffPressure1 = 0;
  }
  if(diffPressure2 < 0){
    diffPressure2 = 0;  
  }

  // Convert to Flow with Venturi Equation
  float flow = 0.0;
  if(diffPressure1 > diffPressure2){
    flow = -flow_calib_a*sqrt(diffPressure1);
  }else{   
    flow = flow_calib_a*sqrt(diffPressure2);
  }
  
  // Print
  Serial.print("flow_expi:");
  Serial.println(diffPressure1);  
  Serial.print("flow_inspi:");
  Serial.println(diffPressure2);
  Serial.print("flow:");
  Serial.println(flow,2);  
}

void updateInspirationTime(short inspirTime){
  EEPROM.update(inspiration_addr, inspirTime);
  inspirationTime = inspirTime;
  Serial.print("Updated Inspiration Time to ");
  Serial.print(inspirationTime);
  Serial.println("s");
}

void updateExpirationTime(short expirTime){
  EEPROM.update(expiration_addr, expirTime);
  expirationTime = expirTime;
  Serial.println("Updated Expiration Time to ");
  Serial.print(expirationTime);
  Serial.println("s");
}

void readPumpParams(){
  inspirationTime = EEPROM.read(inspiration_addr);
  expirationTime = EEPROM.read(expiration_addr);
}


String splitString(String data, char separator, int index){
  int found = 0;
  int strIndex[] = { 0, -1 };
  int maxIndex = data.length() - 1;
  
  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i+1 : i;
    }
  }
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}


boolean isValidNumber(String str){
  boolean isNum=false;
  for(byte i=0;i<str.length();i++){
    isNum = isDigit(str.charAt(i)) || str.charAt(i) == '+' || str.charAt(i) == '.' || str.charAt(i) == '-';
    if(!isNum) return false;
  }
  return isNum;
}

void loop() {

  // Increment Counter
  counter += 1;

  // Run Pump
  if(counter == (expirationTime*1000)/LOOP_DELAY){
    digitalWrite(PUMP_OUT, 0);
  }else if(counter == ((expirationTime*1000)/LOOP_DELAY) + ((inspirationTime*1000)/LOOP_DELAY)){
    digitalWrite(PUMP_OUT, 1);
    counter = 0;    
  }

  // Read Sensors
  if(counter % (SENSOR_SAMPLE_RATE/LOOP_DELAY) == 0){
    readPressure();
    readFlow();
  }

  // Read Serial
  while(Serial.available()) {
    
    // read the incoming data as string
    String received = Serial.readStringUntil(';');

    // check
    if(received == NULL || received.length() == 0){
      continue;
    }

    // prompt master
    Serial.print("Arduino received : ");
    Serial.println(received);
    
    // Convert to char array
    String key = splitString(received, ':', 0);
    String val = splitString(received, ':', 1);

    // check
    if(key != NULL && val != NULL && key.length() > 0 && val.length() > 0){

      // remove leading & trailing whitespaces
      key.trim();
      val.trim();

      // check if val is numeric
      if(!isValidNumber(val)){
        continue;
      }

      // convert to int
      int intVal = val.toInt();
      
      if(key.equals("inspiration_time")){
        updateInspirationTime(intVal);
        
      }else if(key.equals("expiration_time")){
        updateExpirationTime(intVal);
      }
    }
  }

  // wait
  delay(LOOP_DELAY);
}
