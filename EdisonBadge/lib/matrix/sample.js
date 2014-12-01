var JSLEDMatrix8x8  = require('./JSLEDMatrix8x8.js');
var matrix          = new JSLEDMatrix8x8(0, 0x50);
matrix.startDrawing();
// matrix.setRotation(matrix.RotationType.Right);

matrix.drawStringWithCursor("インテル(R)エジソン開発ボード ", 0, 0);
matrix.startScroll(100);
