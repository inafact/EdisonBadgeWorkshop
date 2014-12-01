var Matrix = require('./build/Release/LEDMatrix8x8');
var matrix;
var flag = false;

process.on('message', function (arg) {
    switch(arg.command) {
        case 'init' : 
            matrix = new Matrix.LEDMatrix8x8(arg.params.bus, arg.params.devAddr);
            matrix.init();
            writeDisplay();
            break;

        case 'refreshBuffer' :
            for(var i = 0;i < 8;i++){
                matrix.setDisplayBuffer(arg.params.buffer[i] & 0xFF, i);
            }
            break;

        case 'clear' :
            matrix.clear();
            break;

        case 'setBrightness' :
            matrix.setBrightness(arg.params.brightness);
            break;

        case 'setDot' :
            if(arg.params.value != 0)
                arg.params.value = 0x01;
            matrix.setDot(arg.params.x, arg.params.y, arg.params.value);
            break;

        case 'startDrawing' :
            flag = true;
            setTimeout(writeDisplay, 2);
            process.send({ command : "ready" });
            break;

        case 'stopDrawing' : 
            flag = false;
            break;

        default :
            break;
    }
});

function writeDisplay(){
    matrix.writeDisplay();
    if(flag == true)
        setImmediate(writeDisplay);
}