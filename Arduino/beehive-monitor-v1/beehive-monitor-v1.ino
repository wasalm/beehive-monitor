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
const unsigned long sendInterval = 600000;

/*
   Lora settings (ABP)
*/

// Network Session Key (MSB)
uint8_t NwkSkey[16] = { 0xBE, 0x69, 0xE5, 0xFD, 0x5A, 0x4B, 0x9A, 0xB0, 0x8D, 0xEA, 0x41, 0x5B, 0x0A, 0x14, 0x32, 0xD3 };

// Application Session Key (MSB)
uint8_t AppSkey[16] = { 0xD5, 0x00, 0xB1, 0x05, 0xF4, 0x7A, 0x9E, 0x25, 0xD2, 0xD0, 0xFD, 0x92, 0x05, 0x7E, 0x47, 0x6F };

// Device Address (MSB)
uint8_t DevAddr[4] = { 0x26, 0x01, 0x1A, 0x74 };

/*
   Variables
*/
uint8_t message[9];
unsigned long lastSend = - sendInterval;

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
  lora.setDatarate(SF12BW125);
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
  dht11.read();

}

void loop()
{
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
