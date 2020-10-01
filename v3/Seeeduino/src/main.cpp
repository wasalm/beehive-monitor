#include <Arduino.h>
#include <avr/wdt.h>

// Calc free memory
#ifdef __arm__
// should use uinstd.h to define sbrk but Due causes a conflict
extern "C" char *sbrk(int incr);
#else  // __ARM__
extern char *__brkval;
#endif // __arm__

int freeMemory()
{
  char top;
#ifdef __arm__
  return &top - reinterpret_cast<char *>(sbrk(0));
#elif defined(CORE_TEENSY) || (ARDUINO > 103 && ARDUINO != 151)
  return &top - __brkval;
#else  // __arm__
  return __brkval ? &top - __brkval : &top - __malloc_heap_start;
#endif // __arm__
}

// BME280
#include <Wire.h>
#include <SparkFunBME280.h>

//SSD1306
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

enum device
{
  NONE_DEV,
  BME280_DEV,
  SSD1306_DEV,
  HX711_DEV,
  DS18B20_DEV,
  SWITCH_DEV,
};

#define MAX_DEVICES (20)

void *devPointer[MAX_DEVICES];
device devType[MAX_DEVICES];
bool pinTaken[30];

void setup()
{
  Serial.begin(115200);
  Serial.println('R'); // Device is reset

  //Setup device list
  for (size_t i = 0; i < MAX_DEVICES; i++)
  {
    devPointer[i] = nullptr;
    devType[i] = NONE_DEV;
  }

  for (size_t i = 0; i < 30; i++)
  {
    pinTaken[i] = false;
  }
}

void softwareReset()
{
  wdt_enable(WDTO_15MS); // Enable watchdog
  while (1)
  {
  };
}

uint8_t getPrimaryAddress(bool checkTaken)
{
  int result = -1;
  switch (buffer[ADDRESSSTART + 0])
  {
  case 'I':
    //Must be i2c
    result = SCL;
    break;

  case 'D':
    if (buffer[ADDRESSSTART + 1] - '0' > 13)
    {
      Serial.println(F("EInvalid pinmapping"));
      break;
    }
    result = buffer[ADDRESSSTART + 1] - '0';
    break;

  case 'A':
    if (buffer[ADDRESSSTART + 1] - '0' > 7)
    {
      Serial.println(F("EInvalid pinmapping"));
      break;
    }
    result = buffer[ADDRESSSTART + 1] - '0' + A0;
    break;
  }

  if (result != -1 && checkTaken && buffer[ADDRESSSTART + 0] != 'I')
  {
    if (pinTaken[result])
    {
      Serial.println(F("EOverlapping pins"));
      result = -1;
    }
  }
  return result;
}

int getSecondaryAddress(bool checkTaken)
{
  int result = -1;
  switch (buffer[ADDRESSSTART + 0])
  {
  case 'I':
    //Must be i2c
    result = SDA;
    break;

  case 'D':
    if (buffer[ADDRESSSTART + 1] - '0' > 12)
    {
      Serial.println(F("EInvalid pinmapping"));
      break;
    }
    result = buffer[ADDRESSSTART + 1] - '0' + 1;
    break;

  case 'A':
    if (buffer[ADDRESSSTART + 1] - '0' > 6)
    {
      Serial.println(F("EInvalid pinmapping"));
      break;
    }
    result = buffer[ADDRESSSTART + 1] - '0' + A0 + 1;
    break;
  }

  if (result != -1 && checkTaken && buffer[ADDRESSSTART + 0] != 'I')
  {
    if (pinTaken[result])
    {
      Serial.println(F("EOverlapping pins"));
      result = -1;
    }
  }
  return result;
}

int getId(bool checkTaken)
{
  if (buffer[IDSTART + 0] < '0' || buffer[IDSTART + 0] > '9' || buffer[IDSTART + 1] < '0' || buffer[IDSTART + 1] > '9')
  {
    Serial.println(F("EId must be an integer"));
    return -1;
  }

  int msb = buffer[1] - '0';
  int lsb = buffer[2] - '0';

  int id = msb * 10 + lsb;

  if (id >= MAX_DEVICES)
  {
    Serial.println(F("EMaximal 20 devices supported"));
    return -1;
  }

  if (checkTaken)
  {
    if (devType[id] != NONE_DEV)
    {
      Serial.println(F("EId is already used"));
      return -1;
    }
  }
  return msb * 10 + lsb;
}

bool configureSSD1306(int id, int primaryAddress, int secondaryAddress)
{
  if (primaryAddress != SCL)
  {
    Serial.println(F("E:SSD1306 uses hardware i2c. please connect to different pin"));
    return false;
  }

  U8X8_SSD1306_128X64_NONAME_HW_I2C *u8x8 = new U8X8_SSD1306_128X64_NONAME_HW_I2C(U8X8_PIN_NONE);

  u8x8->begin();
  u8x8->setFlipMode(1);
  u8x8->clearDisplay();
  // Set a default font
  u8x8->setFont(u8x8_font_amstrad_cpc_extended_f);

  devType[id] = SSD1306_DEV;
  devPointer[id] = u8x8;

  return true;
}

bool configureBME280(int id, int primaryAddress, int secondaryAddress)
{

  if (primaryAddress != SCL)
  {
    Serial.println(F("EBME280 uses hardware i2c. please connect to different pin"));
    return false;
  }

  BME280 *bme280Ptr = new BME280;
  bme280Ptr->setI2CAddress(0x76);

  if (bme280Ptr->beginI2C() == false)
  {
    Serial.println(F("EThe BME280 sensor did not respond. Please check wiring."));
    delete bme280Ptr;
    return false;
  }

  devType[id] = BME280_DEV;
  devPointer[id] = bme280Ptr;

  return true;
}

// Check existence HX711 with primary and secondary adress interchanged
bool configureHX711_Alternative(int id, int primaryAddress, int secondaryAddress)
{
  if (primaryAddress == SCL)
  {
    Serial.println(F("EHX711 doesn't use i2c. Please select a different port."));
    return false;
  }

  HX711 *scale = new HX711;

  scale->begin(primaryAddress, secondaryAddress);
  scale->power_down();
  scale->power_up();

  if (!scale->wait_ready_timeout(1000))
  {
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

bool configureHX711(int id, int primaryAddress, int secondaryAddress)
{
  if (primaryAddress == SCL)
  {
    Serial.println(F("EHX711 doesn't use i2c. Please select a different port."));
    return false;
  }

  HX711 *scale = new HX711;

  // Primary   = SCK
  // Secondary = DAT
  scale->begin(secondaryAddress, primaryAddress);

  if (!scale->wait_ready_timeout(1000))
  {
    delete scale;
    return configureHX711_Alternative(id, primaryAddress, secondaryAddress);
  }

  pinTaken[primaryAddress] = true;
  pinTaken[secondaryAddress] = true;
  devType[id] = HX711_DEV;
  devPointer[id] = scale;

  return true;
}

bool configureDS18B20(int id, int primaryAddress, int secondaryAddress)
{
  if (primaryAddress == SCL)
  {
    Serial.println(F("EDS18B20 doesn't use i2c. Please select a different port."));
    return false;
  }

  OneWire *onewire = new OneWire(primaryAddress);
  DallasTemperature *sensors = new DallasTemperature(onewire);
  sensors->begin();

  if (sensors->getDS18Count() == 0)
  {
    Serial.println(F("EThe Ds18B20 sensor did not respond. Please check wiring."));
    delete sensors;
    delete onewire;
    return false;
  }

  sensors->setResolution(12);

  pinTaken[primaryAddress] = true;
  devType[id] = DS18B20_DEV;
  devPointer[id] = sensors;

  return true;
}

bool configureSwitch(int id, int primaryAddress, int secondaryAddress)
{
  if (primaryAddress == SCL)
  {
    Serial.println(F("EThe switch doesn't use i2c. Please select a different port."));
    return false;
  }

  pinMode(primaryAddress, INPUT);

  int *addr = new int;
  *addr = primaryAddress;

  pinTaken[primaryAddress] = true;
  devType[id] = SWITCH_DEV;
  devPointer[id] = addr;

  return true;
}

void configureDevice()
{
  int primaryAddress = getPrimaryAddress(true);
  int secondaryAdddress = getSecondaryAddress(true);
  int id = getId(true);
  bool succes = true;
  bool deviceFound = false;

  // Get requested pins
  if (primaryAddress == -1 || secondaryAdddress == -1 || id == -1)
  {
    succes = false;
  }

  if (succes)
  {
    // Pins are now well defined.
    // Now we iterate all devices

    if (!deviceFound && strcmp_P(&buffer[MESSAGESTART], PSTR("BME280")) == 0)
    {
      deviceFound = true;
      succes = configureBME280(id, primaryAddress, secondaryAdddress);
    }

    if (!deviceFound && strcmp_P(&buffer[MESSAGESTART], PSTR("SSD1306")) == 0)
    {
      deviceFound = true;
      succes = configureSSD1306(id, primaryAddress, secondaryAdddress);
    }

    if (!deviceFound && strcmp_P(&buffer[MESSAGESTART], PSTR("HX711")) == 0)
    {
      deviceFound = true;
      succes = configureHX711(id, primaryAddress, secondaryAdddress);
    }

    if (!deviceFound && strcmp_P(&buffer[MESSAGESTART], PSTR("DS18B20")) == 0)
    {
      deviceFound = true;
      succes = configureDS18B20(id, primaryAddress, secondaryAdddress);
    }

    if (!deviceFound && strcmp_P(&buffer[MESSAGESTART], PSTR("SWITCH")) == 0)
    {
      deviceFound = true;
      succes = configureSwitch(id, primaryAddress, secondaryAdddress);
    }
  }

  if (!deviceFound)
  {
    Serial.println(F("ENo device found"));
    succes = false;
  }

  //Response
  char response[6] = {'C', buffer[IDSTART], buffer[IDSTART + 1], (char)('0' + succes), '\n', 0};
  Serial.print(&response[0]);
}

bool getHX711(int id)
{
  HX711 *ptr = (HX711 *)devPointer[id];
  if (ptr->wait_ready_timeout(1000))
  {
    double val = ptr->get_value();
    Serial.write('G');
    Serial.write(buffer[IDSTART + 0]);
    Serial.write(buffer[IDSTART + 1]);
    Serial.write('1');

    Serial.write('W');
    Serial.println(val, DEC);
    return true;
  }

  return false;
}

bool getBME280(int id)
{
  BME280 *ptr = (BME280 *)devPointer[id];

  Serial.write('G');
  Serial.write(buffer[IDSTART + 0]);
  Serial.write(buffer[IDSTART + 1]);
  Serial.write('1');

  Serial.write('H');
  Serial.print(ptr->readFloatHumidity(), DEC);

  Serial.write('P');
  Serial.print(ptr->readFloatPressure(), DEC);

  Serial.write('T');
  Serial.print(ptr->readTempC(), DEC);

  Serial.println();
  return true;
}

bool getDS18B20(int id)
{
  DallasTemperature *sensors = (DallasTemperature *)devPointer[id];
  sensors->requestTemperatures();

  float tempC = sensors->getTempCByIndex(0);

  if (tempC != DEVICE_DISCONNECTED_C)
  {
    Serial.write('G');
    Serial.write(buffer[IDSTART + 0]);
    Serial.write(buffer[IDSTART + 1]);
    Serial.write('1');

    Serial.write('T');
    Serial.println(tempC, DEC);
    return true;
  }
  else
  {
    Serial.println(F("EDS18B20 Disconnected"));
    return false;
  }
  return false;
}

bool getSwitch(int id)
{
  int *ptr = (int *)devPointer[id];
  int addr = *ptr;
  bool val = false;

  if (addr >= A0 && addr <= A7)
  {
    val = analogRead(addr) >= 512;
  }
  else
  {
    val = digitalRead(addr) == HIGH;
  }

  Serial.write('G');
  Serial.write(buffer[IDSTART + 0]);
  Serial.write(buffer[IDSTART + 1]);
  Serial.write('1');

  Serial.write('V');
  Serial.println(val, DEC);
  return true;
}

void getData()
{
  int id = getId(false);
  bool succes = true;

  if (id == -1)
  {
    succes = false;
  }
  else
  {
    switch (devType[id])
    {
    case BME280_DEV:
      succes = getBME280(id);
      break;
    case SSD1306_DEV:
      Serial.println(F("ESSD1306 is an output device"));
      break;
    case HX711_DEV:
      succes = getHX711(id);
      break;
    case DS18B20_DEV:
      succes = getDS18B20(id);
      break;
    case SWITCH_DEV:
      succes = getSwitch(id);
      break;
    default:
      Serial.println(F("ENo device is configured for this id"));
      succes = false;
    }
  }

  if (!succes)
  {
    //Response
    char response[6] = {'G', buffer[IDSTART], buffer[IDSTART + 1], '0', '\n', 0};
    Serial.print(&response[0]);
  }
}

void getFreeMemory()
{
  Serial.print('M');
  Serial.print(freeMemory());
  Serial.println();
}

void emptyScreen()
{
  int id = getId(false);
  bool succes = true;

  if (id == -1)
  {
    succes = false;
  }
  else
  {
    if (devType[id] != SSD1306_DEV)
    {
      Serial.println(F("No screen selected"));
      succes = false;
    }
    else
    {
      U8X8_SSD1306_128X64_NONAME_HW_I2C *ptr = (U8X8_SSD1306_128X64_NONAME_HW_I2C *)devPointer[id];
      ptr->clearDisplay(); // clear the internal memory
      succes = true;
    }
  }

  char response[6] = {'E', buffer[IDSTART], buffer[IDSTART + 1], (char)('0' + succes), '\n', 0};
  Serial.print(&response[0]);
}

int hexToDec(char c)
{
  if (c >= '0' && c <= '9')
  {
    return c - '0';
  }

  if (c >= 'a' && c <= 'f')
  {
    return c - 'a' + 10;
  }

  if (c >= 'A' && c <= 'F')
  {
    return c - 'A' + 10;
  }

  Serial.println("EInvalid hexadecimal number");
  return -1;
}

void writeScreen()
{
  int id = getId(false);
  bool succes = true;
  if (id == -1)
  {
    succes = false;
  }
  else
  {
    if (devType[id] != SSD1306_DEV)
    {
      Serial.println(F("No screen selected"));
      succes = false;
    }
    else
    {
      int x = hexToDec(buffer[IDSTART + 2]);
      int y = hexToDec(buffer[IDSTART + 3]);

      if (x == -1 || y == -1)
      {
        succes = false;
      }
      else
      {
        U8X8_SSD1306_128X64_NONAME_HW_I2C *ptr = (U8X8_SSD1306_128X64_NONAME_HW_I2C *)devPointer[id];
        ptr->drawUTF8(x, y, &buffer[IDSTART + 4]);
      }
    }
  }

  char response[6] = {'W', buffer[IDSTART], buffer[IDSTART + 1], (char)('0' + succes), '\n', 0};
  Serial.print(&response[0]);
}

void parseMessage()
{
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

void loop()
{
  if (Serial.available() > 0)
  {
    char byte = Serial.read();

    buffer[bufPtr] = byte;
    bufPtr++;

    if (byte == '\n')
    {
      buffer[bufPtr - 1] = 0; // change last symbol to zero character. Use this to parse messages
      parseMessage();
      bufPtr = 0;
    }
  }
}