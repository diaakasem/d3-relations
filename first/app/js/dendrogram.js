(function(global) {

    "use strict";

    function hashCode(s){
        return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
    }

    function linkId(target) {
        if (target.name) {
            return target.name;
        }
        if (target.values && target.values.length || target._values && target._values.length) {
            var targetIdString = _(target.values || target._values).map(linkId).reduce(function(sum, val) {
                return sum + val;
            }, "");

            return hashCode(targetIdString);
        }
        return "Error";
    }

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

        var cluster = d3.layout.cluster()
            .size([360, radius - 120])
            .children(function(d) { return d.values; });

        function update(source, crossfilter) {

            var duration = d3.event && d3.event.altKey ? 5000 : 500;

            // Compute the new tree layout.
            var nodes = cluster.nodes(root).reverse();
            var links = cluster.links(nodes);

            if (crossfilter) {
                paths.select("path.link").remove();
                svg.select(".node").remove();
            }

            var link = paths.selectAll("path.link")
                .data(links, function(d) {
                    return linkId(d.target);
                });

            link.enter().append("path")
                .attr("class", "link")
                .attr("d", function(d) {
                    var o = {x: d.source.x0, y: d.source.y0};
                    return diagonal({source: o, target: o});
                });

            link.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit()
                .transition()
                .duration(duration)
                .attr("d", function(d) {
                    return diagonal({source: d.source, target: d.source});
                }).remove();

            var node = svg.selectAll("g.node")
                .data(nodes, function(d) { return d.id || (d.id = ++i); });

            var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) {
                    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                })
                .attr("fill", function(d) { return color(d.group2); })
                .on("click", function(d) { 
                    if (d.values || d.collapsed) {
                        toggle(d); update(d); 
                        d.collapsed = true;
                    }
                });

            nodeEnter.append("circle")
                .attr("r", 0)
                .style("fill", function(d) { return d._values ? "lightsteelblue" : "#fff"; })
                .transition()
                .duration(duration / 2)
                .attr("r", 4.5);

            nodeEnter.append("text")
                .attr("dy", ".31em")
                .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
                .style("color", function(d) { return color(d.group2); })
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

        var onCrossFilter =  _.debounce(function (domain) {

            var links = _.filter(data.links, function(d) {
                return domain[0] <= d.DateTime && d.DateTime <= domain[1];
            });

            var nodes = _.filter(data.nodes, function(d) {
                return _.filter(links, function(link) {
                    return link.source === d.index || link.target === d.index;
                }).length;
            });

            root = refineData(nodes, links);
            root = {name: 'root', values: root};
            root.x0 = height / 2;
            root.y0 = 0;

            update(root, true);
        }, 500, {trailing: true});

        CrossFilter(data.links, {
            'height': 150,
            'selector': configs.crossfilter_selector
        }, onCrossFilter);

    };
}(window));
