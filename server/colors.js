/*
    NVG Chat
    colors.js
*/

exports.getRandomHexColor =  function (brightness) {
    brightness = brightness == undefined ? 75 : brightness;
    function randomChannel(brightness) {
        let r = 255 - brightness;
        let n = 0 | ((Math.random() * r) + brightness);
        let s = n.toString(16);
        return (s.length == 1) ? '0' + s : s;
    }
    return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}