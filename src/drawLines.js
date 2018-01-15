//绘制所有变电站的线路。
var jsonData_lines = undefined;
try {
    jsonData_lines = JSON.parse(document.getElementById("drawLine").value);
} catch (e) { }