(function(global) {

    "use strict";

    /**
    * Draws a Hive graph using d3js
    * @param data The data to use to draw the graph
    * @param configs of the graph
    */
    global.Hive = function (data, configs) {

        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }

        var margin = _.extend({top: 20, right: 20, bottom: 30, left: 85}, configs.margin),
            width = (configs.width || $(window).width()) - margin.left - margin.right,
            height = (configs.height || $(window).height()) - margin.top - margin.bottom;

        var innerRadius = width / 20,
            outerRadius = _.min([height, width]) / 3,
            majorAngle = 2 * Math.PI / 3,
            minorAngle = 1 * Math.PI / 12;

        var angle = d3.scale.ordinal()
            .domain(["source", "source-target", "target-source", "target"])
            .range([0, majorAngle - minorAngle, majorAngle + minorAngle, 2 * majorAngle]);

        var group2Domain = _(nodes).pluck('group2').uniq().value();
        var ranksDomain = _(nodes).pluck('rank').uniq().value();
        var stepInAxis = (outerRadius - innerRadius) / group2Domain.length;

        var group2Radius = d3.scale.ordinal()
            .range([innerRadius, outerRadius])
            .domain(group2Domain);

        function radius(d) {
            if (!d) {
                return 0;
            }

            var rangeStart = group2Radius(d.group2);
            var rangeEnd = rangeStart + stepInAxis;
            var rankRadius = d3.scale.linear()
                .range([rangeStart, rangeEnd])
                .domain(ranksDomain);
            
            return rankRadius(d.rank);
        }

        var color = d3.scale.category20();

        var svg = d3.select(configs.selector)
            .attr("class", "hive")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        function update(data, crossfilter) {

            var nodes = data.nodes;
            var links = _(data.links).map(function(link) {
                return {
                    source: nodes[link.source],
                target: nodes[link.target]
                };
            }).value();
            var axes = _.uniq(nodes, 'group1');

            var axis = svg.selectAll(".axis")
                .data(axes);

            axis.enter().append("line")
                .attr("class", "axis")
                .attr("transform", function(d) { return "rotate(" + degrees(angle(d.group1)) + ")"; })
                .attr("x1", innerRadius - stepInAxis)
                .attr("x2", outerRadius + stepInAxis);

            axis.exit().remove();

            var link = svg.selectAll(".link")
                .data(links);

            link.enter().append("path")
                .attr("class", "link")
                .attr("d", d3.hive.link().angle(function(d) {
                    if (d) {
                        return angle(d.group1);
                    }
                    return 0;
                }).radius(radius))
                .style("stroke", function(d) {
                    if (!d || !d.source) {
                        return null;
                    }
                    return color(d.source.group2); 
                })
                .on("mouseover", linkMouseover)
                .on("mouseout", mouseout);
            
            link.exit().remove();

            var node = svg.selectAll(".node")
                .data(nodes);

            var nodeEnter = node.enter().append("circle");

            nodeEnter.attr("class", "node")
                .attr("transform", function(d) { return "rotate(" + degrees(angle(d.group1)) + ")"; })
                .attr("cx", radius)
                .attr("r", 5)
                .style("fill", function(d) { return color(d.group2); })
                .on("mouseover", nodeMouseover)
                .on("mouseout", mouseout);

            nodeEnter.append("title")
                .text(function(d) { return d.name; });

            node.exit().remove();

            // Highlight the link and connected nodes on mouseover.
            function linkMouseover(d) {
                svg.selectAll(".link").classed("active", function(p) { return p === d; });
                svg.selectAll(".node circle").classed("active", function(p) { return p === d.source || p === d.target; });
            }

            // Highlight the node and connected links on mouseover.
            function nodeMouseover(d) {
                svg.selectAll(".link").classed("active", function(p) { return p.source === d || p.target === d; });
                d3.select(this).classed("active", true);
            }

            // Clear any highlighted nodes or links.
            function mouseout() {
                svg.selectAll(".active").classed("active", false);
            }

            function degrees(radians) {
                return radians / Math.PI * 180 - 90;
            }
        }
        //update(data);

        var onCrossFilter =  _.debounce(function (domain) {

            var links = _.filter(data.links, function(d) {
                return domain[0] <= d.DateTime && d.DateTime <= domain[1];
            });

            var nodes = _.filter(data.nodes, function(d) {
                return _.filter(links, function(link) {
                    return link.source === d.index || link.target === d.index;
                }).length;
            });

            update({links: links, nodes: nodes}, true);
        }, 500, {trailing: true});


        CrossFilter(data.links, {
            'height': 150,
            'selector': configs.crossfilter_selector
        }, onCrossFilter);


    };
}(window));
