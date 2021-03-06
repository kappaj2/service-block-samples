var radius = 4,
    bound = 10,
    seriesHeight = 100;

var center = d3.forceCenter(width / 2, (height - seriesHeight) / 2);
var minX = width / 2, minY = (height - seriesHeight) / 2, maxX = width / 2, maxY = (height - seriesHeight) / 2;
var maxGroup = 1, minGroup = 0;
var maxStrength = 1, minStrength = 0;
var maxBar = 0, minBar = -1;

var voronoi = d3.voronoi()
    .x(scaleX)
    .y(scaleY)
    .extent([[-1, -1],
        [width + 1, height - seriesHeight]
    ]);

var colorRange = d3.scaleLog()
    .domain([minGroup, maxGroup])
    .interpolate(d3.interpolateHsl)
    .range(["#2ecc71", "#e74c3c"]);

function setNodeBounds(d) {
    maxX = d.x > maxX ? d.x : maxX;
    minX = d.x < minX ? d.x : minX;
    maxY = d.y > maxY ? d.y : maxY;
    minY = d.y < minY ? d.y : minY;
    minGroup = d.group < minGroup ? d.group : minGroup;
    maxGroup = d.group > maxGroup ? d.group : maxGroup;

    colorRange = d3.scaleLinear()
        .domain([minGroup, maxGroup])
        .interpolate(d3.interpolateHsl)
        .range(["#2ecc71", "#e74c3c"]);
}

function setLinkBounds(d) {
    minStrength = d.strength < minStrength ? d.strength : minStrength;
    maxStrength = d.strength > maxStrength ? d.strength : maxStrength;
}

function calculateBounds() {
    // Calculate the scale functions for the SVG boundary
    minX = width / 2;
    minY = (height - seriesHeight) / 2;
    maxX = width / 2;
    maxY = (height - seriesHeight) / 2;
    maxGroup = 0;
    minGroup = 1;
    maxStrength = 0;
    minStrength = 1;
    nodes.forEach(setNodeBounds);
    links.forEach(setLinkBounds)
}


function scaleStrength(d) {
    return d3.scaleLinear()
        .domain([minStrength, maxStrength])
        .interpolate(d3.interpolateNumber)
        .range([0, 1.0])(d.strength);
}

function scaleGroup(d) {
    return d3.scaleLinear()
        .domain([minGroup, maxGroup])
        .interpolate(d3.interpolateNumber)
        .range([0, 1.0])(d.group);
}

function scaleX(d) {
    var x = d.x != null ? d.x : d;
    x = d3.scaleLinear()
        .domain([minX, maxX])
        .interpolate(d3.interpolateNumber)
        .range([bound, width - bound])(x);
    return Math.min(Math.max(x, d.group), width - d.group)
}

function scaleY(d) {
    var y = d.y != null ? d.y : d;
    y = d3.scaleLinear()
        .domain([minY, maxY])
        .interpolate(d3.interpolateNumber)
        .range([bound, (height - seriesHeight) - bound])(y);
    return Math.min(Math.max(y, d.group), height - d.group);
}

var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height + 50);

var simulation = function () {
    calculateBounds();
    var forceSimulation = d3.forceSimulation(nodes)
        .force("center", center)
        .force("charge", d3.forceManyBody().strength(-3000))
        .force("link", d3.forceLink(links).id(function (d) {
            return d.id;
        }).distance(function (d) {
            return Math.max(scaleStrength(d) * 400, d.strength <= 5 ? 140 : 50);
        }).strength(.3))
        .force("collide", d3.forceCollide(function (d) {
            return Math.max(scaleGroup(d) * (300), 150);
        }))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    forceSimulation.on("tick", ticked).velocityDecay(.9);

    return forceSimulation;
};

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

var graphBox = svg.append('g');

graphBox.append('line')
    .attr('transform', 'translate(0,' + (seriesHeight) + ')')
    .attr('x1', 0)
    .attr('y1', height - seriesHeight)
    .attr('x2', width)
    .attr('y2', height - seriesHeight)
    .attr('fill', 'black')
    .attr('stroke', 'black')
    .attr('stroke-width', '1px')
    .attr('class', 'bars-frame');

graphBox.append('rect')
    .attr('transform', 'translate(0,' + (0) + ')')
    .attr('x', 0)
    .attr('y', height - seriesHeight)
    .attr('width', width)
    .attr('height', seriesHeight)
    .attr('fill', '#ebf5fb')
    .attr('stroke', 'black')
    .attr('stroke-width', '1px')
    .attr('class', 'bars-frame');

var cell = svg.append('svg:g').attr('class', 'cells').selectAll('path'),
    link = svg.append('svg:g').attr("class", "links").selectAll('path'),
    node = svg.append('svg:g').attr("class", "nodes").selectAll('circle');

function redrawPolygon(polygon) {
    polygon.attr("d", function (d) {
        return d ? "M" + d.join("L") + "Z" : null;
    });
}

function ticked() {
    calculateBounds();

    svg.select(".links").selectAll("path").attr('d', function (d) {
        return 'M' + scaleX(d.source) + ',' + scaleY(d.source) + 'L' + scaleX(d.target) + ',' + scaleY(d.target);
    });

    svg.select(".nodes").selectAll("circle")
        .attr("cx", function (d) {
            d[0] = d.x;
            return scaleX(d);
        })
        .attr("cy", function (d) {
            d[1] = d.y;
            return scaleY(d);
        })
        .attr("fill", function (d) {
            var group = d != null ? d.group : null;
            return group > 1 ? colorRange(group) : "gray";
        });

    cell = cell.exit().remove();

    var diagram = voronoi(nodes);

    svg.select('.cells').selectAll('path')
        .data(diagram.polygons())
        .enter()
        .append("path")
        .attr("fill", function (d) {
            var group = d != null ? graph.nodes[d.data.id].group : null;
            return group > 4 ? colorRange(group) : "#5d6d7e";
        })
        .attr('class', 'polygon')
        .call(redrawPolygon);

    svg.select('.cells').selectAll('path')
        .data(diagram.polygons())
        .attr("fill", function (d) {
            var group = d != null ? graph.nodes[d.data.id].group : null;
            return group > 4 ? colorRange(group) : "#5d6d7e";
        })
        .call(redrawPolygon);
}


var xAxis = svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")");

var lineX;
var axis;

function initScales() {
    d3.timer(function (elapsed) {
        interval = (events[events.length - 1].timestamp - events[0].timestamp) / 100;
        bars = [];
        events.forEach(updateSeries);
        axis = d3.axisBottom(lineX);
        //d3.select(".axis")
        xAxis = xAxis.call(axis);
        xAxis.call(drawGraph);
    }, 1000);
}

var lineFunction = d3.area()
    .x(function (d) {
        return lineX(d.timestamp);
    })
    .y1(scaleBars)
    .y0(height);

var bar = svg.append('svg:g').attr('class', 'bars')
    .append("path")
    .datum(bars)
    .attr("d", lineFunction)
    .attr("stroke", "#2e86c1")
    .attr("stroke-width", 1)
    .attr("fill", "gray");

function setBarBounds(bar) {
    minBar = minBar == -1 ? bar.data.length : (bar.data.length < minBar ? bar.data.length : minBar);
    maxBar = bar.data.length > maxBar ? bar.data.length : maxBar;
}

function calculateBars() {
    minBar = -1;
    maxBar = 0;
    bars.forEach(setBarBounds);
}

function scaleBars(d) {
    return d3.scaleLinear()
        .domain([minBar, maxBar])
        .interpolate(d3.interpolateNumber)
        .range([height, height - seriesHeight])(d.data.length);
}


function drawGraph() {
    calculateBars();
    // drawBar();

    bar.datum(bars)
        .transition()
        .duration(20)
        .attr("fill", "#5d6d7e")
        .attr("stroke", "#154360")
        .attr("d", lineFunction);
}

var sim = simulation();

function restart(updateSim) {
    sim.stop();
    calculateBounds();

    // Update links
    link = link.data(links).exit().remove();

    svg.select(".links").selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr('class', 'link');

    // Update nodes
    node = node.data(nodes).exit().remove();

    svg.select(".nodes").selectAll("circle")
        .data(nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', radius)
        .attr('cx', function (d) {
            d[0] = d.x;
            return scaleX(d)
        })
        .attr('cy', function (d) {
            d[1] = d.y;
            return scaleY(d)
        })
        .attr('id', function (d) {
            return d.id;
        })
        .attr('fill', function (d) {
            return colorRange(d.group);
        })
        .classed('reflexive', function (d) {
            return d.reflexive;
        });

    if (updateSim)
        sim = simulation();
}

restart(false);
