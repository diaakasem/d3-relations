(function(global) {

    "use strict";

    /**
    * Draws a Force Directed graph using d3js
    * @param data The array of object to use to draw the graph
    * @param configs of the graph
    */
    global.ForceDirected = function (data, configs) {
        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }

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

        function update(data, crossfilter) {

            force
                .nodes(data.nodes)
                .links(data.links)
                .start();

            svg.selectAll(".link").remove();
            svg.selectAll(".node").remove();

            var link = svg.selectAll(".link")
                .data(data.links);

            link.enter().append("line")
                .attr("class", "link")
                .style("stroke-width", function(d) { return Math.sqrt(d.value); });

            link.exit().remove();

            var node = svg.selectAll(".node")
                .data(data.nodes, function(d) { return d.index; });

            var nodeEnter = node.enter().append("circle")
                .attr("class", "node")
                .attr("r", 5)
                .style("fill", function(d) { return color(d.group2); })
                .call(force.drag);

            nodeEnter.append("title")
                .text(function(d) { return d.name; });

            node.exit().remove()

            force.on("tick", _.throttle(function() {
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                nodeEnter.attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
            }, 30));
        }

        update(data);

        var onCrossFilter =  _.debounce(function (domain) {
            var links = _.filter(data.links, function(d) {
                return domain[0] <= d.DateTime && d.DateTime <= domain[1];
            });

            var nodes = _.filter(data.nodes, function(d) {
                return _.filter(links, function(link) {
                    return link.source.index === d.index || link.target.index === d.index;
                }).length;
            });

            update({links: links, nodes: nodes}, true);
        }, 250, {trailing: true});

        CrossFilter(data.links, {
            'width': configs.width,
            'height': 150,
            'selector': configs.crossfilter_selector
        }, onCrossFilter);


    };
}(window));
