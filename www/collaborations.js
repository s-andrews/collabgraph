
$(document).ready(function(){

    people = {}
    publications = {}
    links = []

    $.getJSON("processed_data/people.json", function(data) {
        people = data
    });

    $.getJSON("processed_data/publications.json", function(data) {
        publications = data
    });
    
    $.getJSON("processed_data/links.json", function(data) {
        links = data
    });

    waitForDataLoad()

}); 

function waitForDataLoad(){
    if($.isEmptyObject(people) || $.isEmptyObject(publications) || $.isEmptyObject(links)){
        setTimeout(waitForDataLoad, 250);
    }
    else{
        updateGraph()
    }
}

function updateGraph () {

    // Populate the list of nodes (people)
    var elements = []
    for (let person in people) {
        elements.push({"data":{"id":person, "type":people[person]["type"]}})
    }

    // Make the list of edges
    edges = {}

    for (var i=0;i<links.length; i++) {
        link = links[i]
        edge_name = link["from"]+"*"+link["to"]

        if (!(edge_name in edges)) {
            console.log(edge_name)
            edges[edge_name] = {
                data: {id: edge_name, source: link["from"], target: link["to"]}
            }
        }
    }

    for (e in edges) {
        elements.push(edges[e])
    }

    console.log(elements)


    var cy = cytoscape({

        container: document.getElementById('networkGraph'), // container to render in
        
        elements: elements,
        
        style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
            'background-color': function(ele){if (ele.data('type')=="GroupLeader"){return "#B22"} return('#22B')},
            'label': 'data(id)',
            'shape': function(ele){if (ele.data('type')=="GroupLeader"){return "square"} return('triangle')}
            }
        },
        
        {
            selector: 'edge',
            style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
            }
        }
        ],
        
        layout: {
        name: 'grid',
        rows: 5
        }
        
        });
}
    