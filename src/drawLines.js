//绘制所有变电站的线路。
'use strict'
var data_source;
var data_tree;
var link;
var node;
var svg;
var nodes_paths = [];
//准备线生成器
var line = d3.line()
    .x(function (d) { return d[0]; })
    .y(function (d) { return d[1]; })
    .curve(d3.curveBundle.beta(1));


$.getJSON("./data/data_source.json", function (data) {
    console.log(data);
    data_source = data;
    data_tree = d3.hierarchy(data_source);
    console.log("数据 after hierarchy");
    console.log(data_tree);
    //  drawLineByName(data_tree, detailmap);
});


//every 碰到false就停止循环。true则继续循环
function drawLine(name, detailmap) {
    drawLineByName(data_tree, detailmap);
}


//准备数据
function drawLineByName(data_tree, detailmap) {
    // svg = d3.select(detailmap.getPanes().overlayPane)
    //     .append("svg")
    //     .attr("width", 900)
    //     .attr("height", 900)
    //     .attr("left", 0 + "px")
    //     .attr("top", 0 + "px");
    for (let layerDepth = 0; layerDepth <= data_tree.height; layerDepth++) {
        //某一层次的节点
        let layerClusters = getLayerClusters(data_tree, layerDepth);
        layerClusters.forEach(function (cluster) {
            nodes_paths.push(drawLineByNode(cluster));
        });
    }
    draw(nodes_paths);
}
//将每个点的path路径加上去
function drawLineByNode(node) {
    var latlng = [];
    let upNode;
    let lineNode;
    let leafNode;
    let parentNodeName;
    let nodeColor;
    //寻找上层级里面节点类型为node的节点坐标作为起点
    if (node.parent) {
        if (node.parent.data.coor instanceof Array) {
            //取最后一个coor 此coor为上个节点的分叉点
            upNode = node.parent.data.coor[node.parent.data.coor.length - 1];
        }
        else {
            upNode = node.parent.data.coor;
        }
        latlng.push([upNode.lx, upNode.ly]);
    }
    //在寻找自己节点内的线节点和node节点
    if (node.currentNode.data.coor instanceof Array) {
        let coorArray = node.currentNode.data.coor;
        lineNode = coorArray.slice(0, coorArray.length - 1);
        leafNode = coorArray[coorArray.length - 1];
       
    }
    else {
        leafNode = node.currentNode.data.coor;
    
    }

    if (lineNode) {
        lineNode.forEach(function (coor) {
            latlng.push([coor.lx, coor.ly]);
        })

    }

    latlng.push([leafNode.lx, leafNode.ly]);

    if (!node.parent) {
        parentNodeName = "包河万达";
    }
    else {
        parentNodeName = node.parent.data.name;
    }
    if (node.currentNode.data.value) {
        let a = "rgb(0, 255, 0)";//绿色
        var b = "rgb(255, 0, 0)";//红色
        let interpolator = d3.interpolateRgb(a, b);
        nodeColor = interpolator(node.currentNode.data.value * 0.01);
    }
    node.latlng_path = latlng;
    node.slefcoor = [leafNode.lx,leafNode.ly];
    return node;

}

function draw(nodes) {
    //drawLineByAllNode(nodes);
    drawLineByD3(nodes);
}



function drawLineByAllNode(nodes) {
    nodes.forEach(function (node) {
        let polyline = L.polyline(node.latlng_path, { color: 'red' }).bindPopup(node.currentNode.data.name).addTo(detailmap);
        let layer = polyline;
        layer.on('click', function () {
            console.log(this);
            console.log(this.options.attribute);
        }).addTo(detailmap);
    })

}




function drawLineByD3(nodes) {
  
    var data = [];
    //先将节点坐标全都转换成像素点坐标，在pix_point属性里面
    nodes.forEach(function (node) {
        node.pix_point = [];
        let point = node.latlng_path.map(function (array) {
            return projectPointtoPix(array);
        })
        //{x:xxx,y:xxx}
        node.pix_point = point;
    });
    console.log(nodes);
    convertToGeojson(nodes);
    //将经纬度坐标转换成投影到地图上的像素点坐标
    //格式为数组，数据里面存的对象 属性为x,y.
    // pathsOverlay.addTo(detailmap);

    // link = svg.append("g").selectAll(".link"),
    //     node = svg.append("g").selectAll(".node");
    // link.data(data_after_project)
    //     .enter()
    //     .append("path")
    //     .attr("d", line(data_after_project))
    //     .attr("class", "link")
    //     .attr("stroke", "blue")
    //     .attr("stroke-width", 2)
    //     .attr("fill", "none");
    // node.data(data_after_project)
    //     .enter()
    //     .append("circle")
    //     .attr('cx', function (d) { return d.x; })
    //     .attr('cy', function (d) { return d.y; })
    //     .attr('r', 3.5)
    //     .attr("class", "node");
    // .attr("transform",function (d) { return "translate("+d.x+","+d.y+")";  });
}


function drawLineByLeaflet(latlng) {

}


//将经纬度坐标映射成屏幕像素点
function projectPointtoPix(data) {

    let point = {
        x: detailmap.latLngToLayerPoint(new L.LatLng(data[0], data[1])).x,
        y: detailmap.latLngToLayerPoint(new L.LatLng(data[0], data[1])).y
    }
    return [point.x, point.y];

}


//获取所有层级的图集
function getLayerClusters(hierarchyRoot, layerDepth) {
    var clusters = [];
    //当前层级的所有节点
    let layerNodes = hierarchyRoot.descendants().filter(function (candidate) {
        return candidate.depth === layerDepth;
    });
    //遍历当前层级的所有节点
    layerNodes.forEach(function (node) {

        //叶子节点
        let clusterNodes = node.descendants().filter(function (candidate) {
            return !candidate.children;
        });

        //父节点
        let clusterParent = node.ancestors().filter(function (ancestor) {
            return ancestor.depth === layerDepth - 1;
        })[0];


        clusterNodes.forEach(function (node) {
        });
        let clustersNextNodes = node.descendants().filter(function (condidate) {
            return condidate.depth === layerDepth + 1;
        });
        clusters.push({
            //当前层级的某一个节点的下一个节点
            currentNode: node,
            nextNodes: clustersNextNodes,
            //当前层级的某一个节点的父节点
            parent: clusterParent
        });
    });

    return clusters;
};
//计算能包含所有path的范围
function calcu_paths_bounds(paths) {
    //paths是HTMLcollection
    var left = [], right = [], bottom = [], top = [];
    var arr = Array.from(paths);
    arr.forEach(function (path) {
        left.push(path.getBoundingClientRect().left);
        right.push(path.getBoundingClientRect().right);
        bottom.push(path.getBoundingClientRect().bottom);
        top.push(path.getBoundingClientRect().top);
    });
    var left_value = Math.min.apply(null, left);
    var bottom_value = Math.min.apply(null, bottom);
    var right_value = Math.max.apply(null, right);
    var top_value = Math.max.apply(null, top);
    return {
        left: left_value,
        bottom: bottom_value,
        right: right_value,
        top: top_value
    };
}
function convertToGeojson(nodes) {
    var geojson = {
        'type': 'FeatureCollection',
        'features': [
            // {
            //     'type' : 'Feature',
            //     'geometry' : {
            //         'type' : 'LineString',
            //         'coordinates' : []
            //     }
            // }
        ]
    };
    nodes.forEach(function (node, index) {
        let obj = {
            type: "LineString",
            coordinates: []
        };
        node.latlng_path.forEach(function (path) {
            var latLng = path;
            obj.coordinates.push(latLng);
        });
        geojson.features.push({
            type: "Feature",
            geometry: obj
        });

    });
    console.log("geojson");
    console.log(geojson);
    drawD3(geojson, nodes);
}

function drawD3(geojson, nodes) {

    svg = d3.select(detailmap.getPanes().overlayPane).append("svg");
    var g_line = svg.append("g").attr("class", "leaflet-zoom-hide");
    var g_node = svg.append("g").attr("class", "leaflet-zoom-hide");
    var transform = d3.geoTransform({ point: projectPoint }),
        path = d3.geoPath().projection(transform);

    var path1 = d3.line()
        .x(function (d) { return detailmap.latLngToLayerPoint(new L.LatLng(d[0], d[1])).x; })
        .y(function (d) { return detailmap.latLngToLayerPoint(new L.LatLng(d[0], d[1])).y; })
        .curve(d3.curveBundle.beta(1));


    var feature = g_line.selectAll("path")
        .data(geojson.features)
        .enter().append("path");
    var ndoes_feature = g_node.selectAll("circle")
        .data(nodes)
        .enter().append("circle");

    detailmap.on("moveend", reset);
    reset();

    function reset() {
        console.log("重新绘制啦");

        var bounds = path.bounds(geojson),
            topLeft = bounds[0],
            bottomRight = bounds[1];
        // console.log("bounds");
        // console.log(bounds);

        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px")
            .attr("class", "d3_svg");

        g_line.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
      

        feature.attr("d", function (d) { return path1(d.geometry.coordinates); })
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("fill", "none");
        ndoes_feature
            .attr('cx', function (d) { 
                return projectPointtoPix(d.slefcoor)[0];
            })
            .attr('cy', function (d) { 
                return projectPointtoPix(d.slefcoor)[1];
            })
            .attr('r', 3.5)
            .attr("class", "node")
            .attr("fill",function (d) { 
                if(d.currentNode.children) {
                    return "yellow";
                }
                else{
                    return "blue";
                }
               
             })
            // .attr("transform", function (d) { return "translate(" + d.pix_point[0][0] + "," + d.pix_point[0][1] + ")"; });
            g_node.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
    }
    function projectPoint(x, y) {
        var point = detailmap.latLngToLayerPoint(new L.LatLng(x, y));
        this.stream.point(point.x, point.y);
    }
}
