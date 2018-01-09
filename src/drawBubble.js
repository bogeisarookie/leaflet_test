//加载泡泡图
var leafNodes;
function init() {
    let jsonData = undefined;
    try {
        jsonData = JSON.parse(document.getElementById("jsonInputField").value);
    } catch (e) { }

    if (jsonData) {

        let svg = d3.select("#svgCircles");
        svg.selectAll("*").remove();

        // let padding = Number(document.getElementById("paddingSlider").value);
        // let curvature = Number(document.getElementById("curvatureSlider").value);
        let padding = 10;
        let curvature = 10;

        drawChart(jsonData, svg, padding, (curvature === 100 ? 100000 : curvature));

    }
}
function drawChart(data, svg, padding, curvature) {
    let root = d3.hierarchy(data)
        .sum(function (d) { return d.size / 2; })//计算每个节点的值，该值包括他自己和他后代的值。
        .sort(function (a, b) { return b.value - a.value; });//从大到小排序
    let renderedSVGSize = svg.node().getBoundingClientRect();//用于获取某个元素相对于视窗的位置集合。集合中有top, right, bottom, left等属性。

    // Create bubbletreemap.
    let bubbletreemap = d3.bubbletreemap()
        .padding(padding)
        .curvature(curvature)
        .hierarchyRoot(root)
        .width(renderedSVGSize.width)
        .height(renderedSVGSize.height)
        // .colormap(["rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)"]);
        .colormap(["#D2691E", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"]); // Color brewer: 12-class Paired

    // Do layout and coloring.
    let hierarchyRoot = bubbletreemap.doLayout().doColoring().hierarchyRoot();
     leafNodes = hierarchyRoot.descendants().filter(function (candidate) {
        return !candidate.children;
    });
    // Draw contour.
    //<g>  用于把相关元素进行组合的容器元素  id="该组的名称"
    // fill="该组填充颜色"
    // opacity="该组不透明度" + 显现属性: All            
    let contourGroup = svg.append("g")
        .attr("class", "contour");
    //<path>  定义一个路径     d="定义路径指令"pathLength="如果存在，路径将进行缩放，以便计算各点相当于此值的路径长度"transform="转换列表"+ 显现属性:Color, FillStroke, Graphics,Markers
    contourGroup.selectAll("path")
        .data(bubbletreemap.getContour())
        .enter().append("path")
        .attr("d", function (arc) {
            return arc.d;
        })
        .style("stroke", "black")
        .style("stroke-width", function (arc) { return arc.strokeWidth; })
        .attr("transform", function (arc) { return arc.transform; });
    // console.log("contourGroup的path");
    // console.log(contourGroup);

    // Draw circles.  给每个叶子节点加g   为了包含  path 和 circle 和 text   然后我是想在circle的位置实现水球图
    let circleGroup = svg.append("g")
        .attr("class", "circlesAfterPlanck");
    //每个子节点添加a标签
    let circleGroup_a = circleGroup.selectAll("a")
        .data(leafNodes)
        .enter().append("a").attr("href", "javascript:void(0)")
        .style("text-decoration", "none")
        .style("cursor","pointer")
        .attr("onclick", function(d){return "clickBubble("+d.data.name+")";});

    //在每个a标签里面添加g 标签
    circleGroup_a.append("g").attr("class", "circle_single");
    //再在g标签里面添加circle
    circleGroup_a.append("circle")
        .attr("class", "circle")
        .attr("r", function (d) { return d.r; })
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("id", function (d) { return d.data.name; })
        .attr("size", function (d) { return d.data.size; })
        .style("title", function (d) { return d.data.name })
        .style("fill", "#FFFFFF")
        .style("stroke", "black")
        .style("height", function (d) { return 2 * d.r; })
        .style("width", function (d) { return 2 * d.r; })
        .style("stroke-width", "2");

    //添加title
    circleGroup_a.append("title")
        .text(function (d) { return d.data.name; });
    //添加水球图样式
    circleGroup_a.attr("id", function (d) { return d.data.name + '_g'; })
        .each(function (d, i) {
            var config = liquidFillGaugeDefaultSettings();
            config.circleColor = d.color;
            config.textColor = "#553300";
            config.waveTextColor = "#805615";
            config.waveColor = d.color;
            config.circleThickness = 0.03;
            // config.textVertPosition = 0.8;//波形中显示百分比文本的高度。 0 =底部，1 =顶部。
            config.waveAnimateTime = 1000;//全波进入波浪的时间量（以毫秒为单位）。
            config.waveHeight = 0.10;//波高作为波浪半径的百分比。
            // config.waveAnimate = false;//控制波形是滚动还是静止。
            // config.waveOffset = 0.25;//最初抵消波浪的金额。 0 =没有偏移。 1 =一个全波的偏移。
            config.valueCountUp = false;//如果为true，则显示的值从0加载到加载时的最终值。 如果为false，则显示最终值。
            // config.displayPercent = false;//如果为true，则在该值之后显示％符号。
            loadLiquidFillGauge(d.data.name + '_g', d.data.green_power, d, config);

        });
    //光伏数据弧线
    circleGroup_a.append("path")
        .attr("d", function (arc) {
            let arc_obj = new Object();
            let endAngle = (arc.data.green_power / arc.data.size) * Math.PI;
            let arcGen = d3.arc();
            arc_obj = {
                d: arcGen({
                    innerRadius: arc.r * (5 / 6),
                    outerRadius: arc.r,
                    startAngle: 0,
                    endAngle: endAngle
                })
            }
            return arc_obj.d;
        })
        .attr("transform", function (arc) { return "translate(" + arc.x + "," + arc.y + ")"; })
        .attr("fill", "rgb(152, 223, 138)");


    //每个叶子节点再添加text
    // circleGroup_g.append("text")
    //     .attr("x", function (d) { return d.x; })
    //     .attr("y", function (d) { return d.y; })
    //     .text(function (d) { return d.data.name; });
}

function clickBubble(d){
    //alert(d.id);
    let jsonData = undefined;
    let currentNode;
    try {
        jsonData = JSON.parse(document.getElementById("jsonInputField").value);
    } catch (e) { }

    if (jsonData) {
        for(var i=0;i<leafNodes.length;i++){
            if(leafNodes[i].data.name==d.id)
            currentNode=leafNodes[i];
        }
    }
    //node.data...
    var currentLatLng=L.latLng(currentNode.data.ly,currentNode.data.lx);

    map.setView(currentLatLng,16);

}

init();

