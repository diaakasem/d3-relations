(function(global) {

    "use strict";

    /**
    * Draws a Force Directed graph using d3js
    * @param data The array of object to use to draw the graph
    * @param configs of the graph
    */
    global.ForceDirected = function (graph, configs) {
        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }
        function onCrossFilter (domain) {
        }

        CrossFilter(data.links, {
            'width': configs.width,
            'height': 150,
            'selector': configs.crossfilter_selector
        }, onCrossFilter);


        var margin = _.extend({top: 20, right: 20, bottom: 30, left: 85}, configs.margin),
            width = (configs.width || $(window).width()) - margin.left - margin.right,
            height = (configs.height || $(window).height()) - margin.top - margin.bottom;

        var color = d3.scale.category20();

        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .size([width, height]);

        var svg = d3.select(configs.selector)
            .attr("class", "forced")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        force
            .nodes(graph.nodes)
            .links(graph.links)
            .start();

        var link = svg.selectAll(".link")
            .data(graph.links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke-width", function(d) { return Math.sqrt(d.value); });

        var node = svg.selectAll(".node")
            .data(graph.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 5)
            .style("fill", function(d) { return color(d.group2); })
            .call(force.drag);

        node.append("title")
            .text(function(d) { return d.name; });

        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        });

    };
}(window));
