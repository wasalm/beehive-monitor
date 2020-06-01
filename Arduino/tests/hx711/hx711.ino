
#include "libs/HX711/Hx711.cpp"

#define HX711_PIN_VDD 9
#define HX711_PIN_DAT 8
#define HX711_PIN_CLK 7

unsigned long lastRead = 0;

HX711 scale;

void enableHX711() {
  pinMode(HX711_PIN_VDD, OUTPUT);
  digitalWrite(HX711_PIN_VDD, HIGH);

  scale.begin(HX711_PIN_DAT, HX711_PIN_CLK);
}

void setup()
{
  Serial.begin(115200);
  Serial.println(__FILE__);
  Serial.println();

  enableHX711();
  delay(500);
}

void loop()
{
  if (millis() - lastRead > 500)
  {
    lastRead = millis();

    
    if (scale.is_ready()) {
      long reading = scale.read();
      Serial.print("HX711 reading:\t");
      Serial.print(reading);
      Serial.print("\t");
      Serial.print(scale.data[0], HEX);
      Serial.print("\t");
      Serial.print(scale.data[1], HEX);
      Serial.print("\t");
      Serial.print(scale.data[2], HEX);
      Serial.print("\n");
      
    } else {
      Serial.println("HX711 not found.");
    }


    //    uint32_t t_i = analogRead(NTC_PIN_DATA);
    //
    //    t_i = 1020;
    //
    //    char *b = (char *)&t_i;
    //    uint8_t b2 = *(b+0); // = 87
    //    uint8_t b3 = *(b+1); // = 173
    //
    //    Serial.print(t_i, DEC);
    //    Serial.print("\t");
    //    Serial.print(b2, HEX);
    //    Serial.print("\t");
    //    Serial.print(b3, HEX);
    //    Serial.print("\n");
  }
}

// END OF FILE
