(function(global) {

    "use strict";

    /**
    * Draws a Hive graph using d3js
    * @param data The data to use to draw the graph
    * @param configs of the graph
    */
    global.Matrix = function (data, configs) {

        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }

        var margin = _.extend({top: 80, right: 0, bottom: 10, left: 80}, configs.margin),
            width = (configs.width || $(window).width()) - margin.left - margin.right,
            height = (configs.height || $(window).height()) - margin.top - margin.bottom;

        var x = d3.scale.ordinal().rangeBands([0, width]),
            z = d3.scale.linear().domain([0, 4]).clamp(true),
            c = d3.scale.category10().domain(d3.range(10));

        var svg = d3.select(configs.selector).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "matrix")
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var matrix = [],
            nodes = data.nodes,
            n = nodes.length;

        // Compute index per node.
        nodes.forEach(function(node, i) {
            node.index = i;
            node.count = 0;
            matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
        });

        // Convert links to matrix; count character occurrences.
        data.links.forEach(function(link) {
            if (matrix[link.source] && matrix[link.target] && nodes[link.source] && nodes[link.target]) {
                matrix[link.source][link.target].z += link.value;
                matrix[link.target][link.source].z += link.value;
                matrix[link.source][link.source].z += link.value;
                matrix[link.target][link.target].z += link.value;
                nodes[link.source].count += link.value;
                nodes[link.target].count += link.value;
            }
        });

        // Precompute the orders.
        var orders = {
            name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
            group1: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].group1, nodes[b].group1); }),
            group2: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].group2, nodes[b].group2); }),
            count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
            rank: d3.range(n).sort(function(a, b) { return nodes[b].rank - nodes[a].rank; })
        };

        // The default sort order.
        x.domain(orders.name);

        svg.append("rect")
            .attr("class", "background")

            .attr("width", width)
            .attr("height", height);

        var row = svg.selectAll(".row")
            .data(matrix)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
            .each(row);

        row.append("line")
            .attr("x2", width);

        row.append("text")
            .attr("x", -6)
            .attr("y", x.rangeBand() / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "end")
            .text(function(d, i) { return nodes[i].name; });

        var column = svg.selectAll(".column")
            .data(matrix)
            .enter().append("g")
            .attr("class", "column")
            .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

        column.append("line")
            .attr("x1", -width);

        column.append("text")
            .attr("x", 6)
            .attr("y", x.rangeBand() / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .text(function(d, i) { return nodes[i].name; });

        function row(row) {
            var cell = d3.select(this).selectAll(".cell")
                .data(row.filter(function(d) { return d.z; }))
            .enter().append("rect")
                .attr("class", "cell")
                .attr("x", function(d) { return x(d.x); })
                .attr("width", x.rangeBand())
                .attr("height", x.rangeBand())
                .style("fill-opacity", function(d) { return z(d.z); })
                .style("fill", function(d) { return nodes[d.x].name == nodes[d.y].name ? c(nodes[d.x].name) : null; })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
        }

        function mouseover(p) {
            d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
            d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
        }

        function mouseout() {
            d3.selectAll("text").classed("active", false);
        }

        d3.select("#order").on("change", function() {
            order(this.value);
        });

        function order(value) {
            x.domain(orders[value]);

            var t = svg.transition().duration(2500);

            t.selectAll(".row")
                .delay(function(d, i) { return x(i) * 4; })
                .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
            .selectAll(".cell")
                .delay(function(d) { return x(d.x) * 4; })
                .attr("x", function(d) { return x(d.x); })
                .style("fill", function(d) { return nodes[d.x][value] == nodes[d.y][value] ? c(nodes[d.x][value]) : null; })

            t.selectAll(".column")
                .delay(function(d, i) { return x(i) * 4; })
                .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
        }

        order(d3.select("#order").value);

    };
}(window));
