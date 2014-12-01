#include "LEDMatrix8x8.h"

int main(void){
    LEDMatrix8x8 *matrix = new LEDMatrix8x8(0, 0x50);
    matrix->init();
    matrix->displayBuffer[0] = 0x55;
    matrix->displayBuffer[1] = 0xAA;
    matrix->displayBuffer[2] = 0x55;
    matrix->displayBuffer[3] = 0xAA;
    matrix->displayBuffer[4] = 0x55;
    matrix->displayBuffer[5] = 0xAA;
    matrix->displayBuffer[6] = 0x55;
    matrix->displayBuffer[7] = 0xAA;
    while(1){
        matrix->writeDisplay();
    }
}