// Libs
#include <Adafruit_BMP280.h>
#include <EEPROM.h>

// Allow unsigned char to be written as uchar
typedef unsigned char uchar;

// GENERAL
int LOOP_DELAY = 10; // in ms
int SENSOR_SAMPLE_RATE = 100; // in ms
int counter = 0;

// Get I2C instances of pressure/temp sensors
Adafruit_BMP280 bmp_in;
Adafruit_BMP280 bmp_out; 

// Set the ADC pins
#define ADC_CLK 13
#define ADC_CS  12
#define ADC_DI 11
#define ADC_DO 10

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
  
  if (!bmp_in.begin(0x76)) {
    Serial.println(F("Could not find a valid BMP280_1 sensor, check wiring!"));
    while (1);
  }

  if(!bmp_out.begin(0x77)){
    Serial.println(F("Could not find a valid BMP280_2 sensor, check wiring!"));
    while (1);    
  }

  /* Default settings from datasheet. */
  bmp_in.setSampling(Adafruit_BMP280::MODE_NORMAL,     /* Operating Mode. */
                  Adafruit_BMP280::SAMPLING_X2,     /* Temp. oversampling */
                  Adafruit_BMP280::SAMPLING_X16,    /* Pressure oversampling */
                  Adafruit_BMP280::FILTER_X16,      /* Filtering. */
                  Adafruit_BMP280::STANDBY_MS_500); /* Standby time. */

  bmp_out.setSampling(Adafruit_BMP280::MODE_NORMAL,     /* Operating Mode. */
                  Adafruit_BMP280::SAMPLING_X2,     /* Temp. oversampling */
                  Adafruit_BMP280::SAMPLING_X16,    /* Pressure oversampling */
                  Adafruit_BMP280::FILTER_X16,      /* Filtering. */
                  Adafruit_BMP280::STANDBY_MS_500); /* Standby time. */

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
  Serial.print("inspiration:");
  Serial.println(inspirationTime);
  Serial.print("expiration:");
  Serial.println(expirationTime);
}


uchar getADC(short channel){
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
  
  return dat;  
}

void readPressure(){

  // Get the pressure diff between the two sensors in hPa
  float pressureDiff = (bmp_in.readPressure() - bmp_out.readPressure())*0.01;

  // Convert to cm h2o
  pressureDiff = pressureDiff*1.0197;

  // Print
  Serial.print("pressure:");
  Serial.println(pressureDiff, 2);  // 2 decimals
}

void readTemp(){

  // Read in *C
  float temp = bmp_in.readTemperature();
  
  // Print
  Serial.print("temperature:");
  Serial.println(temp, 2);  // 2 decimals  
}

void readFlow(){

  uchar flow1 = getADC(0);
  uchar flow2 = getADC(1);
  
  // Print
  Serial.print("flow1:");
  Serial.println(flow1);  
  Serial.print("flow2:");
  Serial.println(flow2);  
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

  if(counter < (expirationTime*1000)/LOOP_DELAY){
    digitalWrite(PUMP_OUT, 0);
  }else if(counter >= (expirationTime*1000)/LOOP_DELAY && counter < ((expirationTime*1000)/LOOP_DELAY) + ((inspirationTime*1000)/LOOP_DELAY)){
    digitalWrite(PUMP_OUT, 1);
  }else if(counter >= ((expirationTime*1000)/LOOP_DELAY) + ((inspirationTime*1000)/LOOP_DELAY)){
    counter = 0;    
  }
  
  if(counter % (SENSOR_SAMPLE_RATE/LOOP_DELAY) == 0){
    readPressure();
    readFlow();
  }

  // wait
  delay(LOOP_DELAY);
}
