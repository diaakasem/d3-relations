(function(global) {

    "use strict";

    /**
    * Change data format to match the Hive graph
    *
    * @param data The data to use to draw the graph
    * @param configs of the graph
    */
    function refineData (nodes, links) {

        var data = d3.nest()
            .key(function(d) {return d.group1; })
            .key(function(d) {return d.group2; })
            //.key(function(d) {return d.rank; })
            .sortKeys(function(d) {return parseInt(d.rank, 10);})
            .entries(nodes);

        return data;
    }


    // Toggle children.
    function toggle(d) {
        if (d.values) {
            d._values = d.values;
            d.values = null;
        } else {
            d.values = d._values;
            d._values = null;
        }
    }

    function toggleAll(d) {
        if (d.values) {
            d.values.forEach(toggleAll);
            toggle(d);
        }
    }

    /**
    * Draws a Dendrogram graph using d3js
    * @param data The array of object to use to draw the graph
    * @param configs of the graph
    */
    global.Dendrogram = function (data, configs) {
        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }

        var margin = _.extend({top: 20, right: 20, bottom: 30, left: 85}, configs.margin),
            width = (configs.width || $(window).width()) - margin.left - margin.right,
            height = (configs.height || $(window).height()) - margin.top - margin.bottom;

        var root = refineData(data.nodes, data.links);
        root = {name: 'root', values: root};
        root.x0 = height / 2;
        root.y0 = 0;

        var i = 0;


        var color = d3.scale.category20();

        var radius = width / 2;

        var cluster = d3.layout.cluster()
            .size([360, radius - 120])
            .children(function(d) { return d.values; });

        var diagonal = d3.svg.diagonal.radial()
            .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

        var svg = d3.select(configs.selector).append("svg")
            .attr("class", "dendrogram")
            .attr("width", radius * 2)
            .attr("height", radius * 2)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var paths = svg.append("g")
            .attr("class", "paths");

        function update(source) {

            var duration = d3.event && d3.event.altKey ? 5000 : 500;

            // Compute the new tree layout.
            var nodes = cluster.nodes(root);
            var links = cluster.links(nodes);

            var link = paths.selectAll("path.link")
                .data(links, function(d) { 
                    return d.id || (d.id = ++i); });

            link.enter().append("path")
                .attr("d", function(d) {
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                })
                .transition()
                .duration(duration)
                .attr("class", "link")
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", function(d) {
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                });

            var node = svg.selectAll("g.node")
                .data(nodes, function(d) { return d.id || (d.id = ++i); });

            var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) {
                    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                })
                .attr("fill", function(d) { return color(d.group2); })
                .on("click", function(d) { toggle(d); update(d); });

            nodeEnter.append("circle")
                .attr("r", 0)
                .style("fill", function(d) { return d._values ? "lightsteelblue" : "#fff"; })
                .transition()
                .duration(duration / 2)
                .attr("r", 4.5);

            nodeEnter.append("text")
                .attr("dy", ".31em")
                .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
                .attr("transform", function(d) {
                    return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)";
                })
                .text(function(d) { return d.name; });

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                })

            nodeUpdate.select("circle")
                .transition()
                .duration(duration)
                .attr("r", 4.5)
                .style("fill", function(d) { return d._values ? "lightsteelblue" : "#fff"; });

            nodeUpdate.select("text")
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(duration)
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

             //Stash the old positions for transition.
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            d3.select(self.frameElement).style("height", radius * 2 + "px");
        }
        //root.values.forEach(toggleAll);
        update(root);

    };
}(window));
