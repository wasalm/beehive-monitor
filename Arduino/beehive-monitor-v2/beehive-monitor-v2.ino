/*
   Libaries
*/

#include "libs/TinyLora/TinyLora.cpp"
#include "libs/DHTNEW/dhtnew.cpp"
#include "libs/HX711/Hx711.cpp"
#include <EEPROM.h>
#include <SPI.h>

/*
   Constants
*/
//#define DEBUG_MEASUREMENTS

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
// At SF10, We are allowed to send 80 messages per day.
// We will send 1 message every 20 minutes, hence 3 messages per hour or 72 messages per day. Nice below the limit.
// We need to do 265 measurements per 1200 seconds, i.e every ~4,5 second we need to take a measurement

const unsigned long measureInterval = 17500;
const unsigned int numPowMeasures = 8; // 2^Pow measures
const unsigned int saveCounterEEPROM = 10;

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
unsigned long lastMeasure = - 4 * measureInterval;

TinyLoRa lora = TinyLoRa(RFM95W_PIN_DIO0, RFM95W_PIN_NSS, RFM95W_PIN_RST);
DHTNEW dht11(DHT11_PIN_DAT);
HX711 scale;

/*
   Measurements
*/

unsigned int n = 0;
unsigned long sum_ntc = 0;
double sum_temp = 0;
double sum_hum = 0;
long long sum_weight = 0;

void measure() {
  if (dht11.read() == DHTLIB_OK && scale.is_ready()) {
    // num measurements
    n++;

    // ntc
    int ntcVal = analogRead(NTC_PIN_DAT);
    sum_ntc += ntcVal;

    // temp
    sum_temp += dht11.getTemperature();

    // hum
    sum_hum += dht11.getHumidity();

    // weight
    long val_weight = scale.read();
    sum_weight += val_weight;

    // time
    lastMeasure = millis();

#ifdef DEBUG_MEASUREMENTS
    //Debug
    Serial.print("Measurement");
    Serial.print("\tt_i: ");
    Serial.print(ntcVal, DEC);
    Serial.print("\tt: ");
    Serial.print(dht11.getTemperature());
    Serial.print("\th: ");
    Serial.print(dht11.getHumidity());
    Serial.print("\tw_v: ");
    Serial.print(val_weight, DEC);
    Serial.print("\n");
#endif
  }
}

void emptyMeasurements() {
  n = 0;
  sum_ntc = 0;
  sum_temp = 0;
  sum_hum = 0;
  sum_weight = 1 << 32;
}


/*
   Init functions
*/

void setupRFM95W() {
  // define multi-channel sending
  lora.setChannel(MULTI);
  // set datarate
  lora.setDatarate(SF12BW125); //Choose right one for our situation
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

  EEPROM.get(0, lora.frameCounter );
  lora.frameCounter += saveCounterEEPROM +1;

  if (lora.frameCounter == 65535) {
    //Framecounter is not set or is overflown. Hence reset to start
    lora.frameCounter = 0;
    EEPROM.put(0, lora.frameCounter);
  }

  lora.sendData(message, sizeof(message), lora.frameCounter);
  lora.frameCounter++;
}

void loop()
{
  if (millis() - lastMeasure > measureInterval ) {
    measure();
    if (n >= 1 << numPowMeasures) {
      //Take average and send data

#ifdef DEBUG_MEASUREMENTS
      Serial.print("Summation ");
      Serial.print("\tt_i: ");
      Serial.print(sum_ntc, DEC);
      Serial.print("\tt: ");
      Serial.print(sum_temp);
      Serial.print("\th: ");
      Serial.print(sum_hum);
      Serial.print("\tw_v: ");
      Serial.print((long) (sum_weight >> 32), DEC);
      Serial.print(" ");
      Serial.print((long) (sum_weight), DEC);
      Serial.print("\n");
#endif
      int ave_ntc = sum_ntc >> numPowMeasures;
      double ave_temp = sum_temp / (1 << numPowMeasures);
      double ave_hum = sum_hum / (1 << numPowMeasures);
      long ave_weight = sum_weight >> numPowMeasures;

#ifdef DEBUG_MEASUREMENTS
      Serial.print("Average ");
      Serial.print("\tt_i: ");
      Serial.print(ave_ntc, DEC);
      Serial.print("\tt: ");
      Serial.print(ave_temp);
      Serial.print("\th: ");
      Serial.print(ave_hum);
      Serial.print("\tw_v: ");
      Serial.print(ave_weight);
      Serial.print("\n");
#endif

      emptyMeasurements();

      /*
         Construct message
      */

      //dht11
      int buf = round(10 * ave_hum);
      message[0] = floor(buf / 10);
      message[1] = buf % 10;

      buf = round(10 * ave_temp);
      message[2] = floor(buf / 10);
      message[3] = buf % 10;

      //Hx711
      char *b = (char *)&ave_weight;
      uint8_t b0 = *(b + 0); // = 87
      uint8_t b1 = *(b + 1); // = 173
      uint8_t b2 = *(b + 2); // = 173
      message[4] = b0;
      message[5] = b1;
      message[6] = b2;

      // NTC
      char *c = (char *)&ave_ntc;
      uint8_t c0 = *(c + 0); // = 87
      uint8_t c1 = *(c + 1); // = 173
      message[7] = c0;
      message[8] = c1;

#ifdef DEBUG_MEASUREMENTS
      Serial.print("Sending Message #");
      Serial.print(lora.frameCounter, DEC);
      Serial.print(":");
      for (int i = 0; i < 9; i++) {
        Serial.print(" ");
        Serial.print(message[i], HEX);
      }
      Serial.print("\n");
      Serial.print("\n");
#endif

      lora.sendData(message, sizeof(message), lora.frameCounter);
      lora.frameCounter++;

      if (lora.frameCounter % saveCounterEEPROM == 0) {
        EEPROM.put(0, lora.frameCounter);
      }
    }
  }

}
