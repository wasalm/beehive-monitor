#include <SPI.h>
#include <LoRa.h>

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

  Serial.println("LoRa Receiver Callback");

  LoRa.setPins(15, 5, 4); //ss = D8 = GPIO15 , reset = D1=GPIO5, dio0 = D2 = GPIO4
  if (!LoRa.begin(868100000))
  {
    Serial.println("Starting LoRa failed!");
    while (1)
      ;
  }

  LoRa.setSyncWord(0x34); // ranges from 0-0xFF, default 0x34 = PUBLIC 0x12=P2P, see API docs
  LoRa.setSpreadingFactor(9);
  LoRa.setCodingRate4(5);

  // register the receive callback
  LoRa.onReceive(onReceive);

  // put the radio into receive mode
  LoRa.receive();
}

void loop()
{
  // do nothing
}