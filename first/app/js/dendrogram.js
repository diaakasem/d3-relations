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
            .entries(nodes);

        return data;
    }

    /**
    * Draws a Dendrogram graph using d3js
    * @param data The array of object to use to draw the graph
    * @param configs of the graph
    */
    global.Dendrogram = function (data, configs) {

        var root = refineData(data.nodes, data.links);

        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }

        var margin = _.extend({top: 20, right: 20, bottom: 30, left: 85}, configs.margin),
            width = (configs.width || $(window).width()) - margin.left - margin.right,
            height = (configs.height || $(window).height()) - margin.top - margin.bottom;

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

        var nodes = cluster.nodes({name: 'root', values: root});

        var link = svg.selectAll("path.link")
            .data(cluster.links(nodes))
            .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal);

        var node = svg.selectAll("g.node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

        node.append("circle")
            .attr("r", 4.5);

        node.append("text")
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
            .text(function(d) { return d.name; });

        d3.select(self.frameElement).style("height", radius * 2 + "px");

    };
}(window));
