// 绘制泡泡图用于叠加到地图

var overlay = new L.echartsLayer3(map, echarts);
var chartsContainer = overlay.getEchartsContainer();
var myChart = overlay.initECharts(chartsContainer);


var jsonData = undefined;
try {
    jsonData = JSON.parse(document.getElementById("jsonInputField").value);
} catch (e) { }
var root = d3.hierarchy(jsonData)
    .sum(function (d) { return d.size; })//计算每个节点的值，该值包括他自己和他后代的值。
    .sort(function (a, b) { return b.size - a.size; });//从大到小排序
var leafNodes = root.descendants().filter(function (candidate) {
    return !candidate.children;
});
// 转换数据，将叶子节点转换成echarts所需要的格式
var convertData = function (data) {
    var res = [];
    for (var i = 0; i < data.length; i++) {
        var coor_value = [data[i].data.lx, data[i].data.ly];
        res.push({
            name: data[i].data.name,
            value: coor_value.concat(data[i].data.size)
        });
    }
    return res;
};

option = {
    // backgroundColor: '#404a59',
    title: {
        text: '2017合肥市电力数据',
        subtext: 'Data from PM25.in,Develop By WanderGIS',
        left: 'center',
        textStyle: {
            color: '#fff'
        }
    },
    tooltip: {
        trigger: 'item'
    },
    legend: {
        orient: 'vertical',
        y: 'bottom',
        x: 'left',
        data: ['pm2.5'],
        textStyle: {
            color: '#fff'
        }
    },
    geo: {
        map: '',
        label: {
            emphasis: {
                show: true
            }
        },
        roam: true,
        itemStyle: {
            normal: {
                areaColor: '#323c48',
                borderColor: '#111'
            },
            emphasis: {
                areaColor: '#2a333d'
            }
        }
    },
    series: [
        {
            name: 'pm2.5',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: convertData(leafNodes),
            symbolSize: function (val) {
                return val[2] / 10;
            },
            label: {
                normal: {
                    formatter: '{b}',
                    position: 'right',
                    show: true
                },
                emphasis: {
                    show: true
                }
            },
            itemStyle: {
                normal: {
                    color: '#ddb926'
                }
            }
        },
        {
            name: 'Top 5',
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: convertData(leafNodes.sort(function (a, b) {
                return b.data.size - a.data.size;
            }).slice(0, 6)),
            symbolSize: function (val) {
                return val[2] / 10;
            },
            showEffectOn: 'render',
            rippleEffect: {
                brushType: 'stroke'
            },
            hoverAnimation: true,
            label: {
                normal: {
                    formatter: '{b}',
                    position: 'right',
                    show: true
                }
            },
            itemStyle: {
                normal: {
                    color: '#f4e925',
                    shadowBlur: 10,
                    shadowColor: '#333'
                }
            },
            zlevel: 1
        }
    ]
};
// 使用刚指定的配置项和数据显示图表。
overlay.setOption(option);