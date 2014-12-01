var table  = require('./font_table.js');
var font   = require('./font_bmp_8x8.js');
var child_process = require('child_process');
var path = require('path');

function JSLEDMatrix8x8(bus, devAddr){
    this.RotationType = {
        'Up'     : 1,
        'Right'  : 2,
        'Down'   : 3,
        'Left'   : 4
    };

    this.devAddr    = devAddr;
    this.bus        = bus;
    this.rotation   = this.RotationType.Up;
    this.cursorX    = 0;
    this.cursorY    = 0;
    this.string     = '';
    this.timer      = null;
    this.drawer     = child_process.fork(path.resolve(__dirname, 'JSLEDMatrix8x8Drawer.js'));
    this.drawer.send({ command : 'init', params : {bus : this.bus, devAddr : this.devAddr}});
    this._ready     = false;

    var self = this;
    this.drawer.on("message", function (arg) {
        switch(arg.command) {
            case 'ready' :
                self._ready = true;
            default :
                break;
        }
    });

    this.drawBmp = function(bmp){
        if(bmp.length != 8) return false;
        bmp = this._rotateBuffer(bmp);
        this.drawer.send({ command : 'refreshBuffer', params : { buffer : bmp }});
        return true;
    };

    this.drawChar = function(character){
        return this.drawBmp(character);
    };

    this.clear        = function(){
        this.drawer.send({ command : 'clear' });
    };

    this.setBrightness = function(brightness){
        this.drawer.send({ command : 'setBrightness', params : { brightness : brightness }});
    };

    this.setDot = function(x, y, value){
        this.drawer.send({ command : 'setDot', params : { x : x, y : y, value : value}});
    };

    this.drawStringWithCursor    = function(string, x, y){
        this.clear();
        if(string.length == 0) return false;
        this.cursorX = x;
        this.cursorY = y;
        this.string  = string;

        var index     = Math.floor(x / 8);
        // if(index > string.length - 1) index = string.length;
        var character = this._getCharBmp(string[index]);
        this.clear();

        var buffer = [0, 0, 0, 0, 0, 0, 0, 0];
        var mod = x % 8;
        for(var i = 0;i < 8 - y;i++){
            buffer[i + y] = character[i] << mod;
        }
        if(mod != 0) {
            index = (index == string.length - 1) ? 0 : index + 1;
            character = this._getCharBmp(string[index]);
            for(var i = 0;i < 8 - y;i++){
                buffer[i + y] |= character[i] >> 8 - mod;
            }
        }
        return this.drawBmp(buffer);
    };

    this._getCharBmp  = function(character){
        if(character.search(/[A-Za-z0-9]/g) != -1)
            character = String.fromCharCode(character.charCodeAt(0) + 0xFEE0);
        else if(character.search(/[!-~]/g) != -1)
            character = String.fromCharCode(character.charCodeAt(0) + 0xFEE0);
        var id = character.charCodeAt(0);
        if(typeof table[id]  === "undefined" || typeof font[table[id]]  === "undefined") return font[0];
        return font[table[id]];
    };

    this._rotateBuffer = function(currentBuffer){
        if(this.rotation == this.RotationType.Up){
            return currentBuffer;
        }
        var buffer = [0, 0, 0, 0, 0, 0, 0, 0];
        switch(this.rotation) {
            case this.RotationType.Right :
                for(var i = 0;i < 8;i++){
                    buffer[i] = ((currentBuffer[0] >> i) & 0x01) << 7
                                    | ((currentBuffer[1] >> i) & 0x01) << 6
                                    | ((currentBuffer[2] >> i) & 0x01) << 5
                                    | ((currentBuffer[3] >> i) & 0x01) << 4
                                    | ((currentBuffer[4] >> i) & 0x01) << 3
                                    | ((currentBuffer[5] >> i) & 0x01) << 2
                                    | ((currentBuffer[6] >> i) & 0x01) << 1
                                    | ((currentBuffer[7] >> i) & 0x01) << 0
                }
                break;
            case this.RotationType.Down  :
                for(var i = 0;i < 8;i++){
                    buffer[i] = ((currentBuffer[7 - i] >> 0) & 0x01) << 7
                                    | ((currentBuffer[7 - i] >> 1) & 0x01) << 6
                                    | ((currentBuffer[7 - i] >> 2) & 0x01) << 5
                                    | ((currentBuffer[7 - i] >> 3) & 0x01) << 4
                                    | ((currentBuffer[7 - i] >> 4) & 0x01) << 3
                                    | ((currentBuffer[7 - i] >> 5) & 0x01) << 2
                                    | ((currentBuffer[7 - i] >> 6) & 0x01) << 1
                                    | ((currentBuffer[7 - i] >> 7) & 0x01) << 0
                }
                break;
            case this.RotationType.Left  :
                for(var i = 0;i < 8;i++){
                    buffer[i] = ((currentBuffer[7] >> (7 - i)) & 0x01) << 7
                                    | ((currentBuffer[6] >> (7 - i)) & 0x01) << 6
                                    | ((currentBuffer[5] >> (7 - i)) & 0x01) << 5
                                    | ((currentBuffer[4] >> (7 - i)) & 0x01) << 4
                                    | ((currentBuffer[3] >> (7 - i)) & 0x01) << 3
                                    | ((currentBuffer[2] >> (7 - i)) & 0x01) << 2
                                    | ((currentBuffer[1] >> (7 - i)) & 0x01) << 1
                                    | ((currentBuffer[0] >> (7 - i)) & 0x01) << 0
                }
                break;
            default :
                buffer = currentBuffer;
                break;
        }
        return buffer;
    }

    this.startScroll = function(interval){
        this.stopScroll();
        var self = this;
        this.timer = setInterval(function(){
            if(self._ready == false) return ;
            self.cursorX++;
            if(self.cursorX >= self.string.length * 8)
                self.cursorX = 0;
            self.drawStringWithCursor(self.string, self.cursorX, self.cursorY);
        }, interval);
    };

    this.stopScroll = function(){
        if(typeof this.timer != "undefned") clearInterval(this.timer);
    };

    this.startDrawing = function(){
        this.drawer.send({ command : 'startDrawing' });
    };

    this.stopDrawing = function(){
        this._ready = false;
        this.drawer.send({ command : 'stopDrawing' });
    };

    this.setRotation = function(rotation){
        if(rotation >= this.RotationType.Up && rotation <= this.RotationType.Left)
            this.rotation = rotation;
        else
            this.rotation = this.RotationType.Up;
    };
}

module.exports = JSLEDMatrix8x8;
