(function(global) {

    "use strict";

    var parseDate = d3.time.format("%d/%m/%Y %H:%M").parse;

    function type(d) {
        d.key = new Date(d.key);
        d.values = +d.values;
        return d;
    }

    /**
    * Draws a crosfilter that filters the rest of graphs
    * @param data The data to use to draw the graph
    * @param configs of the graph
    */
    global.CrossFilter = function (data, configs, callback) {

        $(configs.selector).find("*").remove();

        data = d3.nest()
            .key(function(d) { return d.DateTime; })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {return g.value; });
            })
            .entries(data);

        data = _(data).map(type).sortBy('key').value();

        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }

        var margin = _.extend({top: 10, right: 100, bottom: 50, left: 40}, configs.margin),
            width = (configs.width || $(window).width()) - margin.left - margin.right,
            height = (configs.height || $(window).height()) - margin.top - margin.bottom;

        var x = d3.time.scale().range([0, width]),
            y = d3.scale.linear().range([height, 0]);

        var xAxis = d3.svg.axis().scale(x).orient("bottom"),
            yAxis = d3.svg.axis().scale(y).orient("left");

        var brush = d3.svg.brush()
            .x(x)
            .on("brush", brushed);

        var line = d3.svg.line()
            .x(function(d) { return x(d.key); })
            .y(function(d) { return y(d.values); });

        var svg = d3.select(configs.selector).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "crossfilter")
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
        .append("rect")
            .attr("width", width)
            .attr("height", height);

        var focus = svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var xdomain = d3.extent(_.pluck(data, 'key'));
        x.domain(xdomain);
        y.domain([0, d3.max(_.pluck(data, 'values'))]);

        context.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

        context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        focus.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        context.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", height + 7);

        function brushed() {
            callback(brush.empty() ? x.domain() : brush.extent());
            //x.domain(brush.empty() ? x.domain() : brush.extent());
            //focus.select(".line").attr("d", line);
            //focus.select(".x.axis").call(xAxis);
        }

    };
}(window));

