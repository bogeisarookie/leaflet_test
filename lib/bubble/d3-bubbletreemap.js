(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('planck-js')) :
    typeof define === 'function' && define.amd ? define(['exports', 'planck-js'], factory) :
    (factory((global.d3 = global.d3 || {}),global.planck));
}(this, function (exports,planck) { 'use strict';

	//获取所有层级的图集
    function getLayerClusters(hierarchyRoot, layerDepth, padding) {
        var clusters = [];

        let layerNodes = hierarchyRoot.descendants().filter(function(candidate) {
            return candidate.depth === layerDepth;
        });

        layerNodes.forEach(function(node) {
        	//叶子节点
            let clusterNodes = node.descendants().filter(function(candidate){
                return !candidate.children;	
            });
             // console.log("叶子节点");
             // console.log(clusterNodes);
            //父节点
            let clusterParent = node.ancestors().filter(function(ancestor) {
                return ancestor.depth === layerDepth;
            })[0];
             // console.log("父节点,其实就是当前节点啊");
             // console.log(clusterParent);

            clusterNodes.forEach(function(node) {
            	//node.path(x)返回当前节点离目标节点最短路径。返回形式为包含路径所经过节点组成的数组。
            	// console.log(node);
                let path = node.path(clusterParent).slice(1,-1);//从第一个数开始到最后一个数
                // console.log(layerDepth);

                // console.log(path);
                // console.log("当前节点到达父亲的path");
                // console.log(path);
                let uncertaintySum = path.reduce(function(acc, pathnode){
                	// console.log("准备计算pathnode的不确定性");
                    return acc + pathnode.uncertainty;
                }, 0);

                // console.log(uncertaintySum);
                
                

                let contourClusterParentUncertainty = clusterParent.uncertainty/2;                                // 填充轮廓（轮廓位于父节点之外50％）。
                let planckClusterParentUncertainty = node !== clusterParent ? clusterParent.uncertainty : 0;      // 基于力的布局的填充（轮廓不应该相互切割，即应考虑完整的父轮廓）。

                let interClusterSpacing = clusterNodes.length === 1 ? 0 : padding / 2.0; // 对于单圈：没有填充，因为它没有轮廓。

                node.contourPadding = (node.depth - clusterParent.depth) * padding + uncertaintySum + contourClusterParentUncertainty;
                node.planckPadding = (node.depth - clusterParent.depth) * padding + uncertaintySum + planckClusterParentUncertainty + interClusterSpacing;
            });

            clusters.push({
                nodes: clusterNodes,
                parent: clusterParent
            });
        });

        return clusters;
    };

    // Extend array prototype by unique function.
    Array.prototype.contains = function(v) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === v) return true;
        }
        return false;
    };

    Array.prototype.unique = function() {
        var arr = [];
        for(var i = 0; i < this.length; i++) {
            if(!arr.contains(this[i])) {
                arr.push(this[i]);
            }
        }

        return arr;
    };


    function lp(hierarchyRoot, padding, width, height) {

        // Circle pack by d3.
        let pack = d3.pack()
            .radius(function(d) { return d.r; })
            .size([width, height]);
            
            //此处给所有node赋值x,y!!!!!!
        pack(hierarchyRoot); // 使用包装在最深层上排列圆圈。

        for(let layerDepth = hierarchyRoot.height - 1; layerDepth >= 0; layerDepth--) {
            //在此图层上获取圆形的群集。比如第二层是marc janine Luck  parent 是他们本身，nodes是他们的往下的叶子节点
            let layerClusters = getLayerClusters(hierarchyRoot, layerDepth, padding);

            // 由家长父母排序，为身体设置正确的吸引中心。
            // pps即当前遍历的层次图集layerClusters的父亲
            let pps = [];
            layerClusters.forEach(function(cluster) {
                pps.push(cluster.parent.parent);
            });
            pps = pps.unique();
            // console.log("pps");
            // console.log(pps);

            // Do the layout.
            pps.forEach(function(pp) {
            	//currentPPClusters细分同一层级的图集的某个节点
                let currentPPClusters = layerClusters.filter(function(cluster) {
                    return cluster.parent.parent === pp;
                });

                let circleList = [];
                currentPPClusters.forEach(function(cluster) {
                	//concat 链接两个数组
                    circleList = circleList.concat(cluster.nodes);
                });
                //获取所有统一层级的圆的质心
                let centroid = getCircleCentroid(circleList);

                layoutClusters(currentPPClusters, centroid);
            });
        }
    }

    function layoutClusters(layerClusters, centroid) {
        // Create world with zero gravity.
        let world = planck.World({
            gravity: planck.Vec2(0,0)
        });

        // Create bodies for groups.
        let layerClusterBodies = [];
        layerClusters.forEach(function(layerCluster) {
            layerClusterBodies.push(createClusterBody(layerCluster, world));
        });

        // Create attractor.
        let attractorBody = world.createBody(planck.Vec2(centroid.x, centroid.y));

        // Create joints between layerClusterBodies and attractor.
        layerClusterBodies.forEach(function(layerClusterBody) {
            let distanceJoint = planck.DistanceJoint( {
                    //frequencyHz : 0.9, // TODO: Try to avoid overlapping in large datasets!
                    frequencyHz : 0.9,
                    dampingRatio : 0.001 // TODO: ''
                },
                attractorBody,
                attractorBody.getPosition(),
                layerClusterBody,
                layerClusterBody.getPosition()
            );
            distanceJoint.m_length = 0; // 将长度设置为零，因为它是以锚点之间的距离计算的。 TODO: PR on planck-js repo to fix bug.

            world.createJoint(distanceJoint);
        });

        // 准备模拟。 通常我们使用1/60的时间步长
        // 秒（60Hz）和10次迭代。 这提供了高质量的模拟
        // 在大多数游戏场景中。
        let timestep = 1.0 / 60.0;
        let velocityIterations = 6;
        let positionIterations = 2;

        // 仿真循环。
        for (let i = 0; i < 1000; ++i) {
            // 指导世界进行一个单一的模拟。
            // 通常最好保持固定的时间步长和迭代次数。
            world.step(timestep, velocityIterations, positionIterations);
        }

        // 将结果写回层次结构。
        for (let body = world.getBodyList(); body; body = body.getNext()) {
            for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
                if(fixture.getShape().getType() === planck.Circle.TYPE) {
                    let center = body.getWorldPoint(fixture.getShape().getCenter());

                    let rawCircle = fixture.getUserData();
                    rawCircle.x = center.x;
                    rawCircle.y = center.y;
                }
            }
        }
    }

    function createClusterBody(layerCluster, world) {
        // Get centroid of all circles.
        let bodyCentroid = getCircleCentroid(layerCluster.nodes);

        // Create body.
        let body = world.createDynamicBody(bodyCentroid);

        // 添加圆作为固定装置。
        let circleFD = {
            density: 1.0,
            friction: 0.00001
        };

        layerCluster.nodes.forEach(function(circle) {
            let centerGlobal = planck.Vec2(circle.x, circle.y);
            let centerLocal = centerGlobal.sub(bodyCentroid);
            let fixture = body.createFixture(planck.Circle(centerLocal, circle.r + circle.planckPadding), circleFD);
            fixture.setUserData(circle);
        });

        // Return completed body.
        return body;
    }

    function getCircleCentroid(circles) {
        //计算圆组的质心。
        let circleMassSum = 0;
        let centroid = planck.Vec2.zero();


        circles.forEach(function(circle) {
            let circleMass = circle.r * circle.r * Math.PI;
            circleMassSum += circleMass;
            centroid.x += circle.x * circleMass;
            centroid.y += circle.y * circleMass;
        });

        centroid.mul(1.0/circleMassSum);
        //质心：所有点关于每个坐标的以质量为权重的加权平均
        // console.log("圆组之心");
        // console.log(centroid);
        return centroid;
    }

    function colorHierarchy(hierarchyRoot, colormap) {
        let colorIndex = 0;
        hierarchyRoot.children.forEach(function(child) {
            child.descendants().forEach(function(desc){
                desc.color = colormap[colorIndex % colormap.length];
            });
            colorIndex++;
        });
    }

    function Vec2(x, y) {
        this.x = x;
        this.y = y;

        this.distance = function (vec) {
            var deltaX = this.x - vec.x;
            var deltaY = this.y - vec.y;
            return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
        };

        this.
        sub = function (vec) {
            return new Vec2(this.x - vec.x, this.y - vec.y);
        };

        this.add = function (vec) {
            return new Vec2(this.x + vec.x, this.y + vec.y);
        };

        this.scale = function (scale) {
            return new Vec2(this.x * scale, this.y * scale);
        };

        this.angle = function (vec) {
            var result = Math.atan2(vec.y, vec.x) - Math.atan2(this.y, this.x);
            if (result < 0)
                result += 2 * Math.PI;
            return result;
        }

        this.magnitude = function () {
            return Math.sqrt((this.x * this.x) + (this.y * this.y));
        }

        this.toUnitVector = function () {
            return this.scale(1.0/this.magnitude());
        }
    }

    function Arc(x, y, startAngle, endAngle, radius) {
        this.center = new Vec2(x, y);
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.radius = radius;
    }

    function Circle(x, y, radius) {
        this.center = new Vec2(x, y);
        this.radius = radius;

        // See: http://paulbourke.net/geometry/circlesphere/
        this.intersects = function (circle) {
            var distance = this.center.distance(circle.center);

            // Circles are to far from each other.
            if (distance > this.radius + circle.radius)
                return false;
            // One circle is contained in the other.
            if (distance < Math.abs(this.radius - circle.radius))
                return false;
            // Circles intersect.
            return true;
        };

        // See: http://paulbourke.net/geometry/circlesphere/
        this.intersectionPoints = function (circle) {
            var P0 = this.center;
            var P1 = circle.center;

            var d = this.center.distance(circle.center);
            var a = (this.radius * this.radius - circle.radius * circle.radius + d * d) / (2 * d);
            var h = Math.sqrt(this.radius * this.radius - a * a);

            var P2 = P1.sub(P0).scale(a / d).add(P0);

            var x3 = P2.x + h * (P1.y - P0.y) / d;
            var y3 = P2.y - h * (P1.x - P0.x) / d;
            var x4 = P2.x - h * (P1.y - P0.y) / d;
            var y4 = P2.y + h * (P1.x - P0.x) / d;

            return [new Vec2(x3, y3), new Vec2(x4, y4)];
        };
    }

    function contour(nodes, curvature) {
        let circles = [];
        nodes.forEach(function (node) {
            // 添加填充半径增加的圆。 这会生成圆和轮廓之间的间距。
            circles.push(new Circle(node.x, node.y, node.r + node.contourPadding));
        });

        let outerCircleRing = getOuterCircleRing(circles, curvature);

        let arcs = [];

        arcs = arcs.concat(generateCircleArcs(outerCircleRing));
        arcs = arcs.concat(generateTangentArcs(outerCircleRing, curvature));

        return arcsToPaths(arcs);
    }

    let FLOATINGPOINT_EPSILON = 0.00001;

		//获取边界上下一个圆的索引和交点，逆时针方向。
     	//参数'direction'指向找到与当前圆的第一个交点的方向。
    function getNextClockwiseIntersection(currentCircleIndex, circleArray, direction) {
        let currentCircle = circleArray[currentCircleIndex];
        let allIntersections = [];

        for (let i = 0; i < circleArray.length; i++) {
            if (!(i === currentCircleIndex)) {
                if (circleArray[i].intersects(circleArray[currentCircleIndex])) {
                    let intersectionPoints = circleArray[i].intersectionPoints(circleArray[currentCircleIndex]);
                    // Store intersection points and index of corresponding circle
                    allIntersections.push({
                        'intersectionPoint': intersectionPoints[0],
                        'circleIndex': i
                    });
                    allIntersections.push({
                        'intersectionPoint': intersectionPoints[1],
                        'circleIndex': i
                    });
                }
            }
        }

        let smallestAngle = 7; // Init with max angle (> 2*PI).
        let intersectionWithSmallestAngle = undefined; // Init as undefined.
        allIntersections.forEach(function (intersection) {
            let angle = direction.angle(intersection.intersectionPoint.sub(currentCircle.center));


            if (angle > FLOATINGPOINT_EPSILON && angle < smallestAngle) {
                smallestAngle = angle;
                intersectionWithSmallestAngle = intersection;
            }
        });

        return intersectionWithSmallestAngle;
    }

    // 获取定义外边界的圆环，以及相应的交点。
    function getOuterCircleRing(circles, curvature) {
        // 创建圆圈的深层副本，因为它们在接下来的步骤中被修改。
        //let circlesEnlarged = circles.map(a = > Object.assign({}, a));
        let circlesEnlarged = circles.map(function (a) {
            return Object.assign({}, a)
        });

        // 添加相切圆的半径以避免自相交。
        circlesEnlarged.forEach(function (circle) {
            circle.radius += curvature;
        });

        // 查找最左边的圆圈的索引。
        let leftmostCircleIndex = 0;
        for (let i = 1; i < circlesEnlarged.length; i++) {
            if (circlesEnlarged[i].center.x - circlesEnlarged[i].radius < circlesEnlarged[leftmostCircleIndex].center.x - circlesEnlarged[leftmostCircleIndex].radius) {
                leftmostCircleIndex = i;
            }
        }

        // 获得圈的外圈。
        let outerCircleRing = [];
        let index = leftmostCircleIndex;
        let referenceDirection = new Vec2(-1, 0);
        while (true) {
            let intersection = getNextClockwiseIntersection(index, circlesEnlarged, referenceDirection);
            if (intersection === undefined)
                break;

            index = intersection.circleIndex;
            let circle = circles[index];
            referenceDirection = intersection.intersectionPoint.sub(circle.center);

            if (outerCircleRing[0] && index === outerCircleRing[0].circleIndex && intersection.intersectionPoint.distance(outerCircleRing[0].intersectionPoint) < FLOATINGPOINT_EPSILON) {
                break;
            }

            outerCircleRing.push({
                'circle': circle,
                'intersectionPoint': intersection.intersectionPoint,
                'circleIndex': index
            });
        }

        return outerCircleRing;
    }

    // Generate arcs that describe the outer border of circles.
    function generateCircleArcs(outerCircleRing) {
        let arcs = [];

        for (let i = 0; i < outerCircleRing.length; i++) {
            let circle = outerCircleRing[i].circle;
            let firstIntersection = outerCircleRing[i].intersectionPoint;
            let secondIntersection = outerCircleRing[(i + 1) % outerCircleRing.length].intersectionPoint;

            let centerToFirstIntersection = firstIntersection.sub(circle.center);
            let centerToSecondIntersection = secondIntersection.sub(circle.center);
            let arcStartAngle = new Vec2(0, -1).angle(centerToFirstIntersection);
            let arcEndAngle = new Vec2(0, -1).angle(centerToSecondIntersection);

            arcs.push(new Arc(circle.center.x, circle.center.y, arcStartAngle, arcEndAngle, circle.radius));
        }

        return arcs;
    }

    // Generate tangent arcs that fill the space between circle arcs.
    function generateTangentArcs(outerCircleRing, curvature) {
        let arcs = [];

        for (let i = 0; i < outerCircleRing.length; i++) {
            let intersection = outerCircleRing[i].intersectionPoint;
            let firstCircle = outerCircleRing[(i > 0) ? i - 1 : outerCircleRing.length - 1].circle;
            let secondCircle = outerCircleRing[i].circle;

            let intersectionToFirstCenter = firstCircle.center.sub(intersection);
            let intersectionToSecondCenter = secondCircle.center.sub(intersection);
            let arcEndAngle = new Vec2(0, -1).angle(intersectionToFirstCenter);
            let arcStartAngle = new Vec2(0, -1).angle(intersectionToSecondCenter);

            arcs.push(new Arc(intersection.x, intersection.y, arcStartAngle, arcEndAngle, curvature));
        }

        return arcs;
    }

    function arcsToPaths(arcs) {
        let paths = [];
        let arcGen = d3.arc();

        arcs.forEach(function (arc) {
            let startAngleTemp = arc.startAngle;

            if (startAngleTemp > arc.endAngle) {
                startAngleTemp -= 2 * Math.PI;
            }

            paths.push({
                d: arcGen({
                    innerRadius: arc.radius,
                    outerRadius: arc.radius,
                    startAngle: startAngleTemp,
                    endAngle: arc.endAngle
                }),
                transform: "translate(" + arc.center.x + "," + arc.center.y + ")"
            });
        });

        return paths;
    }

    function contourHierarchy(hierarchyRoot, padding, curvature) {
        let contours = [];
        for(let layerDepth = hierarchyRoot.height - 1; layerDepth >= 0; layerDepth--) {
            // 在此图层上获取圆形的群集。
            let layerClusters = getLayerClusters(hierarchyRoot, layerDepth, padding);

            // 为每个群集创建轮廓。
            layerClusters.forEach(function(cluster) {
                let generatedContour = contour(cluster.nodes, curvature);

                // 分配颜色到轮廓。
                generatedContour.forEach(function(segment) {
                    segment.strokeWidth = cluster.parent.uncertainty;
                });

                contours = contours.concat(generatedContour);
            });
        }

        return contours;
    }

    /*
     * Implanckementation.
     */
    function bubbletreemap() {
        let bubbletreemap,
            padding = 10,
            curvature = 10,
            colormap = [],
            width = 800,
            height = 800,
            hierarchyRoot = [];

        return bubbletreemap = {
            doColoring: function() {
                // 着色与纸张相似。 调整./algorithm/color hierarchy.js来改变颜色。
                colorHierarchy(hierarchyRoot, colormap);
                return bubbletreemap;
            },
            //初始化每个层级的集合，从下到上。每个层级的节点以及他们的父亲以及他们的不确定性。
            doLayout: function() {
                lp(hierarchyRoot, padding, width, height);
                return bubbletreemap;
            },

            getContour: function() {
                // Compute contours.
                return contourHierarchy(hierarchyRoot, padding, curvature);
            },

            hierarchyRoot: function(_) {
                if(arguments.length) {
                    _.descendants().forEach(function(node) {
                        if(!node.r)
                            node.r = node.value; // Take value as radius if no radius is explicitly specified.

                        if(!node.uncertainty)
                            node.uncertainty = node.data.uncertainty;
                        if(!node.green_power)
                        	node.green_power=node.data.green_power;
                    });
                    return (hierarchyRoot = _, bubbletreemap);
                }
                else {
                    return hierarchyRoot;
                }
            },

            padding: function(_) {
                return arguments.length ? (padding = +_, bubbletreemap) : padding;
            },

            width: function(_) {
                return arguments.length ? (width = +_, bubbletreemap) : width;
            },

            height: function(_) {
                return arguments.length ? (height = +_, bubbletreemap) : height;
            },

            curvature: function(_) {
                return arguments.length ? (curvature = +_, bubbletreemap) : curvature;
            },

            colormap: function(_) {
                return arguments.length ? (colormap = _, bubbletreemap) : colormap;
            }
        };
    }

    exports.bubbletreemap = bubbletreemap;

    Object.defineProperty(exports, '__esModule', { value: true });

}));