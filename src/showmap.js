//显示变电站详细信息
var detailmap;
function initDetailMap(currentLatLng) {
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
    
     detailmap = L.map("mapdetail", {
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


}
function addMarker(currentLatLng, name, detailmap) {
    var markLayer = L.marker(currentLatLng, { icon: L.AwesomeMarkers.icon({ icon: 'flash', prefix: 'fa', markerColor: 'blue' }) }).bindPopup(name).addTo(detailmap);
    markLayer.openPopup();
}

