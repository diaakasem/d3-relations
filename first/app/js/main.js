$(document).ready(function() {

    var configs = {
        selector: "body div#chart",
        height: 600,
        width: 800
    };

    // Loading CSV data
    d3.csv("data/plot_data1.csv", function(err, data) {
        nodes = data;
        d3.csv("data/plot_data2.csv", function(err, data) {
            links = data;
            // Converting nodes attributes from strings to integers
            nodes = _(nodes).map(function(node) { 
                if (node.index) {
                    node.index = parseInt(node.index, 10);
                } else {
                    return null;
                }
                if (node.group) {
                    node.group = parseInt(node.group, 10);
                } else {
                    return null;
                }
                return node;
            }).compact().value();
            // Converting links attributes from strings to integers
            links = _(links).map(function(link) { 
                if (link.source) {
                    link.source = parseInt(link.source, 10);
                } else {
                    return null;
                }
                if (link.target) {
                    link.target = parseInt(link.target, 10);
                } else {
                    return null;
                }
                if (link.value) {
                    link.value = parseInt(link.value, 10);
                } else {
                    return null;
                }
                return link;
            }).compact().value();
            var data = {nodes: nodes, links: links};
            //ForceDirected(data, configs);
            Dendrogram(data, configs);
            //Hive(data, configs);
        });
    });

});
