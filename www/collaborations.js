
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
    // for (let person in people) {
    //     elements.push({"data":{"id":person, "type":people[person]["type"]}})
    // }

    // Make the list of edges, and make nodes for the edges which exist
    edges = {}
    nodes = {}

    for (var i=0;i<links.length; i++) {
        link = links[i]

        edge_name = link["from"]+"*"+link["to"]

        person = link["from"]
        if (!(person in nodes)) {
            nodes[person] = {"data":{"id":person, "type":people[person]["type"]}}
        }
        person = link["to"]
        if (!(person in nodes)) {
            nodes[person] = {"data":{"id":person, "type":people[person]["type"]}}
        }

        if (!(edge_name in edges)) {
            edges[edge_name] = {
                data: {id: edge_name, source: link["from"], target: link["to"]}
            }
        }
    }

    for (n in nodes) {
        elements.push(nodes[n])
    }

    for (e in edges) {
        elements.push(edges[e])
    }

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
            'curve-style': 'bezier'
            }
        }
        ],
        
        layout: {
            name: 'fcose',
//            name: 'circle',
            animate: false, 
            idealEdgeLength: 250,
            nodeRepulsion: 2048
        }
        
        });

    cy.on(
        'tap',
        function(event) {
            target = event.target;
            if (target.isEdge()) {
                names = target.data()["id"].split("*")
                setPapers(names[0],names[1])
            }

            if (target.isNode()) {
                name = target.data()["id"];
                setPapers(name,null)
            }
        }
    )
}

function setPapers(name1, name2) {

    console.log("Setting papers to "+name1+" and "+name2)
    var table = $("#papertable")
    table.empty()

    for (var eid in publications) {

        var useThisPaper = false;

        if ((!name2) & publications[eid]["collaborators"].includes(name1)) {
            useThisPaper = true;
        }
        else {
            if (publications[eid]["collaborators"].includes(name1) & publications[eid]["collaborators"].includes(name2)) {
                useThisPaper = true;
            }
        }

        if (useThisPaper) {
            var paper = publications[eid];
            table.append("<tr><td>"+paper["collaborators"]+"</td><td>"+paper["title"]+"</td><td>"+paper["year"]+"</td><td><a class=\"btn btn-primary\" href=\""+paper["url"]+"\" role=\"button\" target=\"_abstract\">Abstract</a></td></tr>");  
            console.log(link)
        }
    }
}
    