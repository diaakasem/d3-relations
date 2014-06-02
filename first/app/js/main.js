$(document).ready(function() {

    var configs = {
        selector: "body div#chart",
        height: 800,
        width: 800
    };

    var compiledData;

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
                if (node.rank) {
                    node.rank = parseInt(node.rank, 10);
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

            compiledData = {nodes: nodes, links: links};

            $('#dendrogram a').click(function() {
                configs.height = 800;
                $('#chart *').remove();
                Dendrogram(_.cloneDeep(compiledData), configs);
            });
            $('#forcedirected a').click(function() {
                configs.height = 500;
                $('#chart *').remove();
                ForceDirected(_.cloneDeep(compiledData), configs);
            });
            $('#hive a').click(function() {
                $('#chart *').remove();
                configs.height = 600;
                Hive(_.cloneDeep(compiledData), configs);
            });
            $('#matrix a').click(function() {
                configs.height = 850;
                $('#chart *').remove();
                Matrix(_.cloneDeep(compiledData), configs);
            });

            // initial graph
            $('#matrix a').click();

        });
    });
});
