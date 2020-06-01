/*
   Libaries
*/

#include "libs/TinyLora/TinyLora.cpp"
#include "libs/DHTNEW/dhtnew.cpp"
#include "libs/HX711/Hx711.cpp"
#include <SPI.h>

/*
   Constants
*/
#define RFM95W_PIN_DIO0 5
#define RFM95W_PIN_DIO1 6
#define RFM95W_PIN_NSS 10
#define RFM95W_PIN_RST A0

#define DHT11_PIN_VCC 4
#define DHT11_PIN_DAT 3
#define DHT11_PIN_GND 2

#define HX711_PIN_VDD 9
#define HX711_PIN_DAT 8
#define HX711_PIN_CLK 7

#define NTC_PIN_DAT A2
#define NTC_PIN_GND A3



// How many times data transfer should occur, in milliseconds
const unsigned long sendInterval =  5000;

/*
   Lora settings (ABP)
*/

// Network Session Key (MSB)
uint8_t NwkSkey[16] = { 0x5D, 0x5D, 0x1B, 0xAA, 0xA4, 0x79, 0x35, 0xF1, 0x2F, 0xF5, 0xD7, 0x22, 0x13, 0xAF, 0xE2, 0x9B };

// Application Session Key (MSB)
uint8_t AppSkey[16] = { 0x55, 0x9E, 0x98, 0xE0, 0xDB, 0x0B, 0xA5, 0x9D, 0x98, 0x70, 0xF7, 0xAA, 0x61, 0xB8, 0xEC, 0xE1 };

// Device Address (MSB)
uint8_t DevAddr[4] = { 0x26, 0x01, 0x18, 0x24 };

/*
   Variables
*/
uint8_t message[9];
unsigned long lastSend = 0;

TinyLoRa lora = TinyLoRa(RFM95W_PIN_DIO0, RFM95W_PIN_NSS, RFM95W_PIN_RST);
DHTNEW dht11(DHT11_PIN_DAT);
HX711 scale;

/*
   Init functions
*/

void setupRFM95W() {
  // define multi-channel sending
  lora.setChannel(MULTI);
  // set datarate
  lora.setDatarate(SF7BW125);
  if (!lora.begin())
  {
    Serial.println("Lora Failed");
    Serial.println("Check your radio");
    while (true);
  }

  lora.setPower(20);
}

void setupDHT11() {
  pinMode(DHT11_PIN_VCC, OUTPUT);
  pinMode(DHT11_PIN_GND, OUTPUT);

  digitalWrite(DHT11_PIN_VCC, HIGH);
  digitalWrite(DHT11_PIN_GND, LOW);

  dht11.setHumOffset(0);
  dht11.setTempOffset(0);
}

void setupHX711() {
  pinMode(HX711_PIN_VDD, OUTPUT);
  digitalWrite(HX711_PIN_VDD, HIGH);

  scale.begin(HX711_PIN_DAT, HX711_PIN_CLK);
}

void setupNTC() {
  pinMode(NTC_PIN_DAT, INPUT_PULLUP);
  pinMode(NTC_PIN_GND, OUTPUT);

  digitalWrite(NTC_PIN_GND, LOW);
}

void setup()
{
  Serial.begin(115200);

  setupRFM95W();
  setupDHT11();
  setupHX711();
  setupNTC();

  Serial.println("Finished setup. Wait a second before continuing.");
  delay(1000);

}

void loop()
{
  Serial.println(millis() - lastSend);
  if (millis() - lastSend > sendInterval ) {
    lastSend = millis();

    Serial.println("Sending Data...");

    /*
       DHT11
    */
    if(dht11.read() == DHTLIB_OK) {
      message[0] = dht11._bits[0];
      message[1] = dht11._bits[1];
      message[2] = dht11._bits[2];
      message[3] = dht11._bits[3];
    }

    /*
       HX711
    */
    if (scale.is_ready()) {
      scale.read();
      message[4] = scale.data[0];
      message[5] = scale.data[1];
      message[6] = scale.data[2];
    }

    /*
       NTC
    */
    uint32_t t_i = analogRead(NTC_PIN_DAT);

    char *b = (char *)&t_i;
    uint8_t b0 = *(b + 0); // = 87
    uint8_t b1 = *(b + 1); // = 173
    message[7] = b0;
    message[8] = b1;

    /*
       Lora
    */
    Serial.print("Sending Message #");
    Serial.print(lora.frameCounter, DEC);
    Serial.print(":");
    for (int i = 0; i < 10; i++) {
      Serial.print(" ");
      Serial.print(message[i], HEX);
    }
    Serial.print("\n");

    lora.sendData(message, sizeof(message), lora.frameCounter);
    lora.frameCounter++;
  }

}
