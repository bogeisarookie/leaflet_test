

function drawMap(merged) {
    var marker, markers = [];
    $.each(merged, function(idx, location) {
        var coords = new L.LatLng(location.lt, location.ln);
        marker = L.marker(coords, {icon: marker_icon}).addTo(map)
            .on('click', function(e) { map.setView(e.target.getLatLng()) });
        markers.push(marker);
    });
}
function convertToGeojson(merged) {
    var geojson = {
        'type' : 'FeatureCollection',
        'features' : [
            {
                'type' : 'Feature',
                'geometry' : {
                    'type' : 'LineString',
                    'coordinates' : []
                }
            }
        ]
    };
    $.each(merged, function(idx, location) {
        var latLng = [location.ln, location.lt];
        geojson.features[0].geometry.coordinates.push(latLng);
    });
//        L.geoJson(geojson, {
//            style: {
//                className: 'polyline'
//            }
//        }).addTo(map);
    drawD3(geojson);
}
function drawD3(collection) {

    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide polyline");

    var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);
    
    var path1 = d3.svg.line()
        .interpolate("cardinal")
        .x(function(d) { return map.latLngToLayerPoint(new L.LatLng(d[1], d[0])).x; })
        .y(function(d) { return map.latLngToLayerPoint(new L.LatLng(d[1], d[0])).y; });

    var feature = g.selectAll("path")
        .data(collection.features)
        .enter().append("path");

    map.on("viewreset", reset);
    reset();

    function reset() {

        var bounds = path.bounds(collection),
            topLeft = bounds[0],
            bottomRight = bounds[1];

        svg .attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px")
            .attr("class", "d3_svg");

        g   .attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        feature.attr("d", function(d) { return path1(d.geometry.coordinates); });
    }

    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }
}

var big_array = [], merged = [];
$.each(locations, function(idx, obj) {
    $.each(obj, function(k){
        obj[k].cy = idx;
    });
    big_array.push(obj);
});
merged = merged.concat.apply(merged, big_array);

convertToGeojson(merged);
drawMap(merged);