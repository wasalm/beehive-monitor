#include <Arduino.h>
#include <avr/wdt.h>

// BME280
#include <U8g2lib.h>
#include <Wire.h>
#include <SparkFunBME280.h>


char buffer[256]; // Serial buffer
uint8_t bufPtr = 0;

void softwareReset() {
  wdt_enable(WDTO_15MS); // Enable watchdog
  while (1)
  {};
}

void setup() {
  Serial.begin(115200);
  Serial.println("R"); // Device is reset

  //Test
  BME280 * bme280Ptr = new BME280;
  bme280Ptr -> setI2CAddress(0x76);
  if (bme280Ptr -> beginI2C() == false) {
    Serial.println("The sensor did not respond. Please check wiring.");
    while(1); //Freeze
  }

  Serial.println("AA"); 

  U8X8_SSD1306_128X64_NONAME_SW_I2C * u8x8;
  u8x8 = new U8X8_SSD1306_128X64_NONAME_SW_I2C(A2, A3, U8X8_PIN_NONE);
  //(/* clock=*/ SCL, /* data=*/ SDA, /* reset=*/ U8X8_PIN_NONE);
  

  Serial.println("AB"); 
  u8x8 -> begin();

  Serial.println("BB"); 

  u8x8 -> clearDisplay();         // clear the internal memory
  //draw some you want; such as 
  u8x8 -> setFont(u8x8_font_amstrad_cpc_extended_f);
  u8x8 -> drawString(0,10,"Hello World!");  // write something to the internal memory

  Serial.println("CC"); 


}

void parseMessage() {
  switch (buffer[0])
  {
  case 'R':
    softwareReset();
    break;
  
  default:
    Serial.println("E: Unknown command");
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