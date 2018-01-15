//显示变电站详细信息
function initDetailMap(currentLatLng, currentNode) {
    var normalm1 = L.tileLayer.chinaProvider('Geoq.Normal.Map', {
        maxZoom: 18,
        minZoom: 5
    });
    var normalm2 = L.tileLayer.chinaProvider('Geoq.Normal.Color', {
        maxZoom: 18,
        minZoom: 5
    });
    var normalm3 = L.tileLayer.chinaProvider('Geoq.Normal.PurplishBlue', {
        maxZoom: 18,
        minZoom: 5
    });
    var normalm4 = L.tileLayer.chinaProvider('Geoq.Normal.Gray', {
        maxZoom: 18,
        minZoom: 5
    });
    var normalm5 = L.tileLayer.chinaProvider('Geoq.Normal.Warm', {
        maxZoom: 18,
        minZoom: 5
    });
    var normalm6 = L.tileLayer.chinaProvider('Geoq.Normal.Cold', {
        maxZoom: 18,
        minZoom: 5
    });
    
    var normal = L.layerGroup([normalm1, normalm2, normalm3, normalm4, normalm5, normalm6]);
    
    var baseLayers_1 = {
        "地图": normalm1,
        "多彩": normalm2,
        "午夜蓝": normalm3,
        "灰色": normalm4,
        "暖色": normalm5,
        "冷色": normalm6
    }
    
    var detailmap = L.map("mapdetail", {
        center: currentLatLng,
        zoom: 14,
        layers: [normalm1],
        zoomControl: false
    });
    
    L.control.layers(baseLayers_1, null).addTo(detailmap);
    L.control.zoom({
        zoomInTitle: '放大',
        zoomOutTitle: '缩小'
    }).addTo(detailmap);
    // location.reload();
    //修改标题

    $("#showmapHeader>p").text(currentNode.data.name + "变电站详细信息");
    addMarker(currentLatLng, currentNode, detailmap);
}
function addMarker(currentLatLng, currentNode, detailmap) {
    var markLayer = L.marker(currentLatLng, { icon: L.AwesomeMarkers.icon({ icon: 'flash', prefix: 'fa', markerColor: 'blue' }) }).bindPopup(currentNode.data.name).openPopup().addTo(detailmap);

}
function closeDetailMap(){
    $("#showmap").hide();
    $("#map").show();
}
