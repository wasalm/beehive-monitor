/*
 * Libaries
 */

#include "libs/TinyLora/TinyLora.cpp"
#include <SPI.h>

/*
 * Configuration
 */
// Network Session Key (MSB)
uint8_t NwkSkey[16] = { 0x5D, 0x5D, 0x1B, 0xAA, 0xA4, 0x79, 0x35, 0xF1, 0x2F, 0xF5, 0xD7, 0x22, 0x13, 0xAF, 0xE2, 0x9B };

// Application Session Key (MSB)
uint8_t AppSkey[16] = { 0x55, 0x9E, 0x98, 0xE0, 0xDB, 0x0B, 0xA5, 0x9D, 0x98, 0x70, 0xF7, 0xAA, 0x61, 0xB8, 0xEC, 0xE1 };

// Device Address (MSB)
uint8_t DevAddr[4] = { 0x26, 0x01, 0x18, 0x24 };

/************************** Example Begins Here ***********************************/
// Data Packet to Send to TTN
unsigned char loraData[11] = {"hello LoRa"};

// How many times data transfer should occur, in seconds
const unsigned int sendInterval = 5;

// Pinout for Adafruit Feather 32u4 LoRa
TinyLoRa lora = TinyLoRa(A1, 10, A0);

void setup()
{
  delay(2000);
  Serial.begin(115200);
  while (! Serial);
  
  // Initialize pin LED_BUILTIN as an output
  pinMode(LED_BUILTIN, OUTPUT);
  
  // Initialize LoRa
  Serial.print("Starting LoRa...");
  // define multi-channel sending
  lora.setChannel(MULTI);
  // set datarate
  lora.setDatarate(SF7BW125);
  if(!lora.begin())
  {
    Serial.println("Failed");
    Serial.println("Check your radio");
    while(true);
  }

  // Optional set transmit power. If not set default is +17 dBm.
  // Valid options are: -80, 1 to 17, 20 (dBm).
  // For safe operation in 20dBm: your antenna must be 3:1 VWSR or better
  // and respect the 1% duty cycle.

  // lora.setPower(17);

  Serial.println("OK");
}

void loop()
{
  Serial.println("Sending LoRa Data...");
  lora.sendData(loraData, sizeof(loraData), lora.frameCounter);
  // Optionally set the Frame Port (1 to 255)
  // uint8_t framePort = 1;
  // lora.sendData(loraData, sizeof(loraData), lora.frameCounter, framePort);
  Serial.print("Frame Counter: ");Serial.println(lora.frameCounter);
  lora.frameCounter++;

  // blink LED to indicate packet sent
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  
  Serial.println("delaying...");
  delay(sendInterval * 1000);
}
