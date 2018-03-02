/*
 * @Author: mikey.zhaopeng 
 * @Date: 2018-01-17 10:29:35 
 * @Last Modified by:   mikey.zhaopeng 
 * @Last Modified time: 2018-01-17 10:29:35 
 */
//加载地图
var map = L.map('map');
var baseLayers = {
    "高德地图": L.tileLayer('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
        subdomains: "1234"
    }),
    '高德影像': L.layerGroup([L.tileLayer('http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
        subdomains: "1234"
    }), L.tileLayer('http://t{s}.tianditu.cn/DataServer?T=cta_w&X={x}&Y={y}&L={z}', {
        subdomains: "1234"
    })]),
    'GeoQ灰色底图': L.tileLayer('http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}').addTo(map)
};
L.tileLayer('https://a.tiles.mapbox.com/v3/foursquare.map-0y1jh28j/{z}/{x}/{y}.png', {
    attribution: 'Map &copy; Pacific Rim Coordination Center (PRCC).  Certain data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    key: 'BC9A493B41014CAABB98F0471D759707',
    styleId: 22677
});
var layercontrol = L.control.layers(baseLayers,{}, {
    position: "topleft"
}).addTo(map);
//合肥工业大学
map.setView(L.latLng(31.8423836382,117.2966909409), 13);
