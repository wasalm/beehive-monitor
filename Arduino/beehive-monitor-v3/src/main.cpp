#include <Arduino.h>
#include <avr/wdt.h>

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
}

void parseMessage() {
  switch (buffer[0])
  {
  case "R:":
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