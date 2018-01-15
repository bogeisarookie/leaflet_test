//leaflet_marker_cluster

var jsonData_circle = undefined;
try {
    jsonData_circle = JSON.parse(document.getElementById("jsonInputField").value);
} catch (e) { }
var root = d3.hierarchy(jsonData_circle)
    .sum(function (d) { return d.size; })//计算每个节点的值，该值包括他自己和他后代的值。
    .sort(function (a, b) { return b.size - a.size; });//从大到小排序
var leafNodes = root.descendants().filter(function (candidate) {
    return !candidate.children;
});
//增加clusterMarkers
var markers = L.markerClusterGroup();

for (var i = 0; i < leafNodes.length; i++) {
    var a = leafNodes[i];
    var title = a.data.name;
    var marker = L.marker(new L.LatLng(a.data.ly, a.data.lx), { title: title });
    marker.bindPopup(title);
    markers.addLayer(marker);
}

map.addLayer(markers);


