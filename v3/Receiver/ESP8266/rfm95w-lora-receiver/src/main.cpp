/*
 * at+reset
 * at+frequency=868100000
 * at+spreadingfactor=9
 * at+syncword=34
 * at+receive
 */

#include <SPI.h>
#include <LoRa.h>

char buffer[256]; // Serial buffer
uint8_t bufPtr = 0;
bool running = false;

void onReceive(int packetSize)
{
  // received a packet
  Serial.print("at+recv_raw=");

  // read packet
  for (int i = 0; i < packetSize; i++)
  {
    char c = LoRa.read();
    if (c < 16)
    {
      Serial.write('0');
    }
    Serial.print(c, HEX);
  }

  // print RSSI of packet
  Serial.print(",");
  Serial.print(LoRa.packetRssi()); //packetSnr
  Serial.print(",");
  Serial.println(LoRa.packetSnr()); //packetSnr
}

void setup()
{
  Serial.begin(115200);
  while (!Serial)
    ;

  Serial.println(F("LoRa Single Channel Receiver"));
  LoRa.setPins(15, 5, 4); //ss = D8 = GPIO15 , reset = D1=GPIO5, dio0 = D2 = GPIO4

  if (!LoRa.begin(866E6))
  {
    Serial.println("Starting LoRa failed!");
    while (1)
      ;
  }
}

void softwareReset()
{
  wdt_enable(WDTO_15MS); // Enable watchdog
  while (1)
  {
  };
}

int hexToDec(char c) {
  if(c >= '0' && c <= '9') {
    return c - '0';
  }

  if(c >= 'a' && c <= 'f') {
    return c - 'a' + 10;
  }

  if(c >= 'A' && c <= 'F') {
    return c - 'A' + 10;
  }

  Serial.println("Invalid hexadecimal number");
  return -1;
}

void parseMessage()
{
  if (strcmp_P(&buffer[0], PSTR("at+reset")) == 0)
  {
    softwareReset();
    return;
  }

  if (running)
  {
    Serial.println("Lora already running");
    return;
  }

  if (strcmp_P(&buffer[0], PSTR("at+receive")) == 0)
  {
    // register the receive callback
    LoRa.onReceive(onReceive);

    // put the radio into receive mode
    LoRa.receive();
    running = true;
    Serial.println("ok");
    return;
  }

  if (strncmp_P(&buffer[0], PSTR("at+frequency="), 13) == 0)
  {
    int val = atoi(&buffer[13]);
    if(val == 0) {
      Serial.println("error:invalid value");
      return;
    }

    LoRa.setFrequency(val);
    Serial.println("ok");
    return;
  }

  if (strncmp_P(&buffer[0], PSTR("at+spreadingfactor="), 19) == 0)
  {
    int val = atoi(&buffer[19]);
    if(val == 0) {
      Serial.println("error:invalid value");
      return;
    }
    LoRa.setSpreadingFactor(val);

    Serial.println("ok");
    return;
  }

  if (strncmp_P(&buffer[0], PSTR("at+bandwidth="), 13) == 0)
  {
    int val = atoi(&buffer[13]);
    if(val == 0) {
      Serial.println("error:invalid value");
      return;
    }
    LoRa.setSignalBandwidth(val);

    Serial.println("ok");
    return;
  }

  if (strncmp_P(&buffer[0], PSTR("at+codingrate=4/"), 16) == 0)
  {
    int val = atoi(&buffer[16]);
    if(val == 0) {
      Serial.println("error:invalid value");
      return;
    }
    LoRa.setCodingRate4(val);

    Serial.println("ok");
    return;
  }

  if (strncmp_P(&buffer[0], PSTR("at+preamblelength="), 18) == 0)
  {
    int val = atoi(&buffer[18]);
    if(val == 0) {
      Serial.println("error:invalid value");
      return;
    }

    LoRa.setPreambleLength(val);

    Serial.println("ok");
    return;
  }

  if (strncmp_P(&buffer[0], PSTR("at+syncword="), 12) == 0)
  {
    //TODO hexToDec
    int msb = hexToDec(buffer[12]);
    int lsb = hexToDec(buffer[13]);
    if(msb >= 0 && lsb >= 0) {
      int byte = msb * 16 + lsb;
      LoRa.setSyncWord(byte);

      Serial.println("ok");
      return;
    }
  }

  Serial.println("error-1");
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