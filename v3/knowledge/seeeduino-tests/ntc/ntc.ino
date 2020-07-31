
#define NTC_PIN_DATA A2
#define NTC_PIN_GND A3

unsigned long lastRead = 0;

void enableNTC() {
  pinMode(NTC_PIN_DATA, INPUT_PULLUP);
  pinMode(NTC_PIN_GND, OUTPUT);

  digitalWrite(NTC_PIN_GND, LOW);
}

void setup()
{
  Serial.begin(115200);
  Serial.println(__FILE__);
  Serial.println();

  enableNTC();
  delay(500);
}

void loop()
{
  if (millis() - lastRead > 500)
  {
    lastRead = millis();

    uint32_t t_i = analogRead(NTC_PIN_DATA);

    t_i = 1020;
    
    char *b = (char *)&t_i;
    uint8_t b2 = *(b+0); // = 87
    uint8_t b3 = *(b+1); // = 173
    
    Serial.print(t_i, DEC);
    Serial.print("\t");
    Serial.print(b2, HEX);
    Serial.print("\t");
    Serial.print(b3, HEX);
    Serial.print("\n");

    /*
     *  When t_i = 1020, then t_i = 3FC in HEX.
     *  Note LSB system, hence b2 = FC and B3 = 03;
     */
  }
}

// END OF FILE
