//绘制所有变电站的线路。
var jsonData_lines ;
try {
    jsonData_lines = JSON.parse(data);
} catch (e) { }
var lines_data = jsonData_lines.data;
console.log(jsonData_lines);
//全局变量，存储在地图上的线段。
var lines_onMap=[];



//every 碰到false就停止循环。true则继续循环
function drawLine(name, detailmap) {
    lines_data.every(function (element) {
        if (element.name == name) {
            drawLineByName(element, detailmap);
            return false;
        }
        return true;
    });
}
function drawLineByName(lines, detailmap) {
    lines.lines.forEach(function (element) {
        var latlng = [];
        element.coor.forEach(function (element) {
            var latlng_list = [element.lx, element.ly];
            latlng.push(latlng_list);

        })
        var polyline = L.polyline(latlng, { color: 'red', attribute: "" + element + "" }).bindPopup("" + element.message + "").addTo(detailmap);
        var line = {
            line: polyline,
            name: element.message
        }
        var layer = polyline;
        layer.on('click', function () {
            console.log(this);
            console.log(this.options.attribute);
            drawLineDetail(this.options.attribute);
        }).addTo(detailmap);

        lines_onMap.push(line);
    });
}
function drawLineDetail(line) {

}
