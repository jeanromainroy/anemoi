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

// The Venturi ADC Pins
#define ADC_CLK 13
#define ADC_CS  12
#define ADC_DI 11
#define ADC_DO 10
float VENTURI_A1 = 15;
float VENTURI_A2 = 7.5;
float FLUID_DENSITY = 1.225; // kg/m3
float VENTURI_CONST = VENTURI_A1*sqrt((2.0/FLUID_DENSITY)*(1.0/(pow((VENTURI_A1/VENTURI_A2),2)-1.0)));
float sensor1_calib_a = 1.0;
float sensor1_calib_b = 8;
float sensor2_calib_a = 1.0;
float sensor2_calib_b = 11;


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
  int diffPressure1 = sensor1_calib_a*getADC(0) - sensor1_calib_b;    // expiration
  int diffPressure2 = sensor2_calib_a*getADC(1) - sensor2_calib_b;    // inspiration

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
    flow = -VENTURI_CONST*sqrt(diffPressure1);
  }else{   
    flow = VENTURI_CONST*sqrt(diffPressure2);
  }
  
  // Print
  Serial.print("flow:");
  Serial.println(flow,2);  
}

void updateInspirationTime(short inspirTime){
  EEPROM.write(inspiration_addr, inspirTime);
}

void updateExpirationTime(short expirTime){
  EEPROM.write(expiration_addr, expirTime);  
}

void readPumpParams(){
  inspirationTime = EEPROM.read(inspiration_addr);
  expirationTime = EEPROM.read(expiration_addr);
}


void loop() {

  counter += 1;

  if(counter == (expirationTime*1000)/LOOP_DELAY){
    digitalWrite(PUMP_OUT, 1);
  }else if(counter == ((expirationTime*1000)/LOOP_DELAY) + ((inspirationTime*1000)/LOOP_DELAY)){
    digitalWrite(PUMP_OUT, 0);
    counter = 0;    
  }
  
  if(counter % (SENSOR_SAMPLE_RATE/LOOP_DELAY) == 0){
    readPressure();
    readFlow();
  }

  // wait
  delay(LOOP_DELAY);
}
