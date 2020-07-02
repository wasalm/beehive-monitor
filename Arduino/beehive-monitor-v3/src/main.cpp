#include <Arduino.h>
#include <avr/wdt.h>

// BME280
#include <Wire.h>
#include <SparkFunBME280.h>

//SSD1315
#include <U8g2lib.h>

//constants for Serial protocol
#define ACTIONSTART 0 
#define IDSTART 1
#define ADDRESSSTART 3
#define MESSAGESTART 5

char buffer[256]; // Serial buffer
uint8_t bufPtr = 0;

enum device {
  NONE_DEV, BME280_DEV, SSD1315_DEV, HX711_DEV, DS18D20_DEV,
};

#define MAX_DEVICES (20)

void * devPointer[MAX_DEVICES];
device devType[MAX_DEVICES];
bool pinTaken[30];

void setup() {
  Serial.begin(115200);
  Serial.println("R"); // Device is reset

  //Setup device list
  for(size_t i=0; i< MAX_DEVICES; i++) {
    devPointer[i] = nullptr;
    devType[i] = NONE_DEV;
  }

  for(size_t i=0; i< 30; i++) {
    pinTaken[i] = false;
  }
}

void softwareReset() {
  wdt_enable(WDTO_15MS); // Enable watchdog
  while (1)
  {};
}

uint8_t getPrimaryAddress(bool checkTaken) {
  int result = -1;
  switch (buffer[ADDRESSSTART + 0]) {
    case 'I':
      //Must be i2c
      result = SCL;
      break;
    
    case 'D':
      if(buffer[ADDRESSSTART + 1] - '0' > 13) {
        Serial.println("EInvalid pinmapping");
        break;
      }
      result =  buffer[ADDRESSSTART + 1] - '0';
      break;
  
    case 'A':
      if(buffer[ADDRESSSTART + 1] - '0' > 7) {
        Serial.println("EInvalid pinmapping");
        break;
      }
      result = buffer[ADDRESSSTART + 1] - '0' + A0;
      break;
  } 

  if(result != -1 && checkTaken && buffer[ADDRESSSTART + 0] != 'I') {
    if(pinTaken[result]) {
      Serial.println("EOverlapping pins");
      result = -1;
      }
  }
  return result;
}

int getSecondaryAddress(bool checkTaken) {
  int result = -1;
  switch (buffer[ADDRESSSTART + 0]) {
    case 'I':
      //Must be i2c
      result = SDA;
      break;
    
    case 'D':
      if(buffer[ADDRESSSTART + 1] - '0' > 12) {
        Serial.println("EInvalid pinmapping");
        break;
      }
      result =  buffer[ADDRESSSTART + 1] - '0' + 1;
      break;
  
    case 'A':
      if(buffer[ADDRESSSTART + 1] - '0' > 6) {
        Serial.println("EInvalid pinmapping");
        break;
      }
      result = buffer[ADDRESSSTART + 1] - '0' + A0 + 1;
      break;
  } 

  if(result != -1 && checkTaken && buffer[ADDRESSSTART + 0] != 'I') {
    if(pinTaken[result]) {
      Serial.println("EOverlapping pins");
      result = -1;
      }
  }
  return result;
}

int getId() {
  if(buffer[IDSTART + 0] < '0' || buffer[IDSTART + 0] > '9' || buffer[IDSTART + 1] < '0' || buffer[IDSTART + 1] > '9') {
    Serial.println("EId must be an integer");
    return -1;
  }

  int msb = buffer[1] - '0';
  int lsb = buffer[2] - '0';

  return msb * 10 + lsb;
}

bool configureSSD1315(int id, int primaryAddress, int secondaryAddress) {
  if(primaryAddress == SCL) {
    Serial.println("E:SSD1315 uses software i2c. please connect to different pin");
    return false;
  }

  U8X8_SSD1306_128X64_NONAME_SW_I2C * u8x8;
  u8x8 = new U8X8_SSD1306_128X64_NONAME_SW_I2C(primaryAddress, secondaryAddress, U8X8_PIN_NONE);
    
  u8x8 -> begin();

  //TODO, temporary test
  u8x8 -> clearDisplay();         // clear the internal memory
  //draw some you want; such as 
  u8x8 -> setFont(u8x8_font_amstrad_cpc_extended_f);
  u8x8 -> drawString(0,10,"Hello World!");  // write something to the internal memory

  pinTaken[primaryAddress] = true;
  pinTaken[secondaryAddress] = true;
  devType[id] = SSD1315_DEV;
  devPointer[id] = u8x8;

  return true;
}

bool configureBME280(int id, int primaryAddress, int secondaryAddress) {

  if(primaryAddress != SCL) {
    Serial.println("E:BME280 uses hardware i2c. please connect to different pin");
    return false;
  }

  BME280 * bme280Ptr = new BME280;
  bme280Ptr -> setI2CAddress(0x76);

  if (bme280Ptr -> beginI2C() == false) {
    Serial.println("EThe BME280 sensor did not respond. Please check wiring.");
    delete bme280Ptr;
    return false;
  }

  devType[id] = BME280_DEV;
  devPointer[id] = bme280Ptr;

  return true;
}

void configureDevice() {
  int primaryAddress = getPrimaryAddress(true);
  int secondaryAdddress = getSecondaryAddress(true);
  int id = getId();
  bool succes = true;
  bool deviceFound = false;

  // Get requested pins
  if(primaryAddress == -1 || secondaryAdddress == -1 || id == -1) {
    succes = false;
  }
  
  if(succes) {
    //Pins are now well defined.
    // Now we iterate all devices
    if(deviceFound == false && buffer[MESSAGESTART + 0] == 'B' 
     && buffer[MESSAGESTART + 1] == 'M' 
     && buffer[MESSAGESTART + 2] == 'E'
     && buffer[MESSAGESTART + 3] == '2'
     && buffer[MESSAGESTART + 4] == '8'
     && buffer[MESSAGESTART + 5] == '0'
     && buffer[MESSAGESTART + 6] == '\n') {
       deviceFound = true;
       succes = configureBME280(id,primaryAddress, secondaryAdddress);
     }

    if(deviceFound == false && buffer[MESSAGESTART + 0] == 'S' 
     && buffer[MESSAGESTART + 1] == 'S' 
     && buffer[MESSAGESTART + 2] == 'D'
     && buffer[MESSAGESTART + 3] == '1'
     && buffer[MESSAGESTART + 4] == '3'
     && buffer[MESSAGESTART + 5] == '1'
     && buffer[MESSAGESTART + 6] == '5'
     && buffer[MESSAGESTART + 7] == '\n') {
       deviceFound = true;
       succes = configureSSD1315(id, primaryAddress, secondaryAdddress);
     }
  }

  if(!deviceFound) {
    Serial.println("ENo device found");
    succes = false;
  }

  //Response
  char response[6] = {'C', buffer[IDSTART], buffer[IDSTART + 1], '0' + ((char) succes), '\n', 0};
  Serial.print(&response[0]);
}

void getData() {
  Serial.println("ETODO");
}

void parseMessage() {
  switch (buffer[ACTIONSTART])
  {
  case 'R':
    softwareReset();
    break;
  
  case 'C':
    configureDevice();
    break;

  case 'G':
    getData();
    break;
  
  default:
    Serial.println("EUnknown command");
    break;
  }
}

void loop() {
  if(Serial.available() > 0) {
    char byte = Serial.read();

    buffer[bufPtr] = byte;
    bufPtr ++;

    if(byte == '\n') {
      parseMessage();
      bufPtr = 0;
    }
  }
}