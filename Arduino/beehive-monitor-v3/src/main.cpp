#include <Arduino.h>
#include <avr/wdt.h>

// Calc free memory
#ifdef __arm__
// should use uinstd.h to define sbrk but Due causes a conflict
extern "C" char* sbrk(int incr);
#else  // __ARM__
extern char *__brkval;
#endif  // __arm__
  
int freeMemory() {
  char top;
#ifdef __arm__
  return &top - reinterpret_cast<char*>(sbrk(0));
#elif defined(CORE_TEENSY) || (ARDUINO > 103 && ARDUINO != 151)
  return &top - __brkval;
#else  // __arm__
  return __brkval ? &top - __brkval : &top - __malloc_heap_start;
#endif  // __arm__
}

// BME280
#include <Wire.h>
#include <SparkFunBME280.h>

//SSD1315
#include <U8g2lib.h>

//HX711
#include <HX711.h>

//DS18B20
#include <OneWire.h>
#include <DallasTemperature.h>

//constants for Serial protocol
#define ACTIONSTART 0 
#define IDSTART 1
#define ADDRESSSTART 3
#define MESSAGESTART 5

char buffer[256]; // Serial buffer
uint8_t bufPtr = 0;

enum device {
  NONE_DEV, BME280_DEV, SSD1315_DEV, HX711_DEV, DS18B20_DEV,
};

#define MAX_DEVICES (20)

void * devPointer[MAX_DEVICES];
device devType[MAX_DEVICES];
bool pinTaken[30];

void setup() {
  Serial.begin(115200);
  Serial.println('R'); // Device is reset

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
        Serial.println(F("EInvalid pinmapping"));
        break;
      }
      result =  buffer[ADDRESSSTART + 1] - '0';
      break;
  
    case 'A':
      if(buffer[ADDRESSSTART + 1] - '0' > 7) {
        Serial.println(F("EInvalid pinmapping"));
        break;
      }
      result = buffer[ADDRESSSTART + 1] - '0' + A0;
      break;
  } 

  if(result != -1 && checkTaken && buffer[ADDRESSSTART + 0] != 'I') {
    if(pinTaken[result]) {
      Serial.println(F("EOverlapping pins"));
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
        Serial.println(F("EInvalid pinmapping"));
        break;
      }
      result =  buffer[ADDRESSSTART + 1] - '0' + 1;
      break;
  
    case 'A':
      if(buffer[ADDRESSSTART + 1] - '0' > 6) {
        Serial.println(F("EInvalid pinmapping"));
        break;
      }
      result = buffer[ADDRESSSTART + 1] - '0' + A0 + 1;
      break;
  } 

  if(result != -1 && checkTaken && buffer[ADDRESSSTART + 0] != 'I') {
    if(pinTaken[result]) {
      Serial.println(F("EOverlapping pins"));
      result = -1;
      }
  }
  return result;
}

int getId(bool checkTaken) {
  if(buffer[IDSTART + 0] < '0' || buffer[IDSTART + 0] > '9' || buffer[IDSTART + 1] < '0' || buffer[IDSTART + 1] > '9') {
    Serial.println(F("EId must be an integer"));
    return -1;
  }

  int msb = buffer[1] - '0';
  int lsb = buffer[2] - '0';

  int id = msb * 10 + lsb;

  if(id >= MAX_DEVICES) {
    Serial.println(F("EMaximal 20 devices supported"));
    return -1;
  }

  if(checkTaken) {
    if(devType[id] != NONE_DEV) {
      Serial.println(F("EId is already used"));
      return -1;
    }
  }
  return msb * 10 + lsb;
}

bool configureSSD1315(int id, int primaryAddress, int secondaryAddress) {
  if(primaryAddress == SCL) {
    Serial.println(F("E:SSD1315 uses software i2c. please connect to different pin"));
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
    Serial.println(F("EBME280 uses hardware i2c. please connect to different pin"));
    return false;
  }

  BME280 * bme280Ptr = new BME280;
  bme280Ptr -> setI2CAddress(0x76);

  if (bme280Ptr -> beginI2C() == false) {
    Serial.println(F("EThe BME280 sensor did not respond. Please check wiring."));
    delete bme280Ptr;
    return false;
  }

  devType[id] = BME280_DEV;
  devPointer[id] = bme280Ptr;

  return true;
}

bool configureHX711(int id, int primaryAddress, int secondaryAddress) {
  if(primaryAddress == SCL) {
    Serial.println(F("EHX711 doesn't use i2c. Please select a different port."));
    return false;
  }

  HX711 * scale = new HX711;

  // Primary   = SCK
  // Secondary = DAT
  scale -> begin(secondaryAddress, primaryAddress);

  if (! scale-> wait_ready_timeout(1000)) {
    Serial.println(F("EThe HX711 sensor did not respond. Please check wiring."));
    delete scale;
    return false;
  }

  pinTaken[primaryAddress] = true;
  pinTaken[secondaryAddress] = true;
  devType[id] = HX711_DEV;
  devPointer[id] = scale;

  return true;
}

bool configureDS18B20(int id, int primaryAddress, int secondaryAddress) {
  if(primaryAddress == SCL) {
    Serial.println(F("EDS18B20 doesn't use i2c. Please select a different port."));
    return false;
  }

  OneWire * onewire = new OneWire(primaryAddress);
  DallasTemperature * sensors = new DallasTemperature(onewire);
  sensors -> begin();

  if(sensors -> getDS18Count() == 0) {
    Serial.println(F("EThe Ds18B20 sensor did not respond. Please check wiring."));
    delete sensors;
    delete onewire;
    return false;
  }

  sensors -> setResolution(12);
  
  pinTaken[primaryAddress] = true;
  devType[id] = DS18B20_DEV;
  devPointer[id] = sensors;

  return true;
}


void configureDevice() {
  int primaryAddress = getPrimaryAddress(true);
  int secondaryAdddress = getSecondaryAddress(true);
  int id = getId(true);
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

     if(deviceFound == false && buffer[MESSAGESTART + 0] == 'H' 
     && buffer[MESSAGESTART + 1] == 'X' 
     && buffer[MESSAGESTART + 2] == '7'
     && buffer[MESSAGESTART + 3] == '1'
     && buffer[MESSAGESTART + 4] == '1'
     && buffer[MESSAGESTART + 5] == '\n') {
       deviceFound = true;
       succes = configureHX711(id, primaryAddress, secondaryAdddress);
     }

     if(deviceFound == false && buffer[MESSAGESTART + 0] == 'D' 
     && buffer[MESSAGESTART + 1] == 'S' 
     && buffer[MESSAGESTART + 2] == '1'
     && buffer[MESSAGESTART + 3] == '8'
     && buffer[MESSAGESTART + 4] == 'B'
     && buffer[MESSAGESTART + 5] == '2'
     && buffer[MESSAGESTART + 6] == '0'
     && buffer[MESSAGESTART + 7] == '\n') {
       deviceFound = true;
       succes = configureDS18B20(id, primaryAddress, secondaryAdddress);
     }
  }

  if(!deviceFound) {
    Serial.println(F("ENo device found"));
    succes = false;
  }

  //Response
  char response[6] = {'C', buffer[IDSTART], buffer[IDSTART + 1], (char) ('0' + succes), '\n', 0};
  Serial.print(&response[0]);
}

bool getHX711(int id) {
  HX711 * ptr = (HX711 *) devPointer[id];
  if(ptr -> is_ready()) {
    double val = ptr -> get_value();
    Serial.write('G');
    Serial.write(buffer[IDSTART + 0]);
    Serial.write(buffer[IDSTART + 1]);
    Serial.write('1');

    Serial.write('W');
    Serial.println(val,DEC);
    return true;
  }

  return false;
}

bool getBME280(int id) {
  BME280 * ptr = (BME280 *) devPointer[id];

  Serial.write('G');
  Serial.write(buffer[IDSTART + 0]);
  Serial.write(buffer[IDSTART + 1]);
  Serial.write('1');

  Serial.write('H');
  Serial.print(ptr -> readFloatHumidity(), DEC);

  Serial.write('P');
  Serial.print(ptr -> readFloatPressure(), DEC);

  Serial.write('T');
  Serial.print(ptr -> readTempC(), DEC);

  Serial.println();
  return true;
}

bool getDS18B20(int id) {
  DallasTemperature * sensors = (DallasTemperature *) devPointer[id];
  sensors -> requestTemperatures();

  float tempC = sensors -> getTempCByIndex(0);

  if(tempC != DEVICE_DISCONNECTED_C) {
    Serial.write('G');
    Serial.write(buffer[IDSTART + 0]);
    Serial.write(buffer[IDSTART + 1]);
    Serial.write('1');

    Serial.write('T');
    Serial.println(tempC,DEC);
    return true;
  } else {
    Serial.println(F("EDS18B20 Disconnected"));
    return false;
  }
  return false;
}

void getData() {
  int id = getId(false);
  bool succes = true;

  if(id == -1) {
    succes = false;
  } else {
    switch(devType[id]) {
      case BME280_DEV:
        succes = getBME280(id);
        break;
      case SSD1315_DEV:
        Serial.println(F("ESSD1315 is an output device"));
        break;
      case HX711_DEV:
        succes = getHX711(id);
        break;
      case DS18B20_DEV:
        succes = getDS18B20(id);
        break;
      default:
        Serial.println(F("ENo device is configured for this id"));
        succes = false;
    }
  }

  if(!succes) {
    //Response
    char response[6] = {'G', buffer[IDSTART], buffer[IDSTART + 1], '0', '\n', 0};
    Serial.print(&response[0]);
  }
}

void getFreeMemory() {
  Serial.print('F');
  Serial.print(freeMemory());
  Serial.println();
}

void emptyScreen() {
  int id = getId(false);
  bool succes = true;

  if(id == -1) {
    succes = false;
  } else {
    if(devType[id] != SSD1315_DEV) {
      Serial.println(F("No screen selected"));
      succes = false;
    } else {
      U8X8_SSD1306_128X64_NONAME_SW_I2C * ptr = (U8X8_SSD1306_128X64_NONAME_SW_I2C * ) devPointer[id];
      ptr -> clearDisplay();         // clear the internal memory
      succes = true;
    }
  }

  char response[6] = {'E', buffer[IDSTART], buffer[IDSTART + 1], (char) ('0' + succes), '\n', 0};
  Serial.print(&response[0]);
}

void setFont() {
  //TODO
}

void writeScreen() {
  //TODO
}

void parseMessage() {
  switch (buffer[ACTIONSTART])
  {
  /*
   * Initialisation commands
   */
  case 'R':
    softwareReset();
    break;
  
  case 'C':
    configureDevice();
    break;

  /*
   * Retreive data commands
   */
  case 'G':
    getData();
    break;
  
  /*
   * Screen commands
   */
  case 'E':
    emptyScreen();
    break;
  
  case 'F':
    setFont();
    break;

  case 'W':
    writeScreen();
    break;
  
  /*
   * Debug commands
   */
  case 'M':
    getFreeMemory();
    break;
  
  default:
    Serial.println(F("EUnknown command"));
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