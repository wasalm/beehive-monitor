//
//    FILE: dhtnew_minimum.ino
//  AUTHOR: Rob Tillaart
// VERSION: 0.1.1
// PURPOSE: DHTNEW library test sketch for Arduino
//     URL: https://github.com/RobTillaart/DHTNew
// HISTORY:
// 0.1.0    2018-01-08 initial version
// 0.1.1    2020-04-30 replaced humidity and temperature with functions
//
// FRONT left 2 right
// pin 1 : VCC
// pin 2 : DATA
// pin 3 : NC
// PIN 4 : GND

#include "libs/DHTNEW/dhtnew.cpp"

#define DHT11_PIN_VCC 4
#define DHT11_PIN_DATA 3
#define DHT11_PIN_GND 2

DHTNEW mySensor(DHT11_PIN_DATA);

unsigned long lastRead = 0;

void enableDHT11() {
  pinMode(DHT11_PIN_VCC, OUTPUT);
  pinMode(DHT11_PIN_GND, OUTPUT);

  digitalWrite(DHT11_PIN_VCC, HIGH);
  digitalWrite(DHT11_PIN_GND, LOW);
}

void setup()
{
  Serial.begin(115200);
  Serial.println(__FILE__);
  Serial.println();

  enableDHT11();
  delay(500);

  mySensor.setHumOffset(0);
  mySensor.setTempOffset(0);
}

void loop()
{
  if (millis() - lastRead > 2000)
  {
    lastRead = millis();
    
    mySensor.read();

    
    Serial.print(mySensor._bits[0], HEX);
    Serial.print("\t");
    Serial.print(mySensor._bits[1], HEX);
    Serial.print("\t");
    Serial.print(mySensor._bits[2], HEX);
    Serial.print("\t");
    Serial.print(mySensor._bits[3], HEX);
    Serial.print("\t");
    Serial.print(mySensor._bits[4], HEX);
    Serial.print("\n");
  }
}

// END OF FILE
