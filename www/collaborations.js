
$(document).ready(function(){

    people = {}
    publications = {}
    contracts = {}
    links = []
    people_names = []

    $.getJSON("processed_data/people.json", function(data) {
        people = data
        for (person in people) {
            people_names.push(person);
        }

        $('#person').autoComplete({
            resolver:'custom',
            events: {
                search: function(qry, callback) {
                    suggestions = []
                    for (i in people_names) {
                        var thisName = people_names[i]
                        // console.log("name="+thisName.toLowerCase()+" qry="+qry)
                        if (thisName.toLowerCase().indexOf(qry.toLowerCase()) > -1) {
                            suggestions.push(thisName)
                        }
                    }
                    callback(suggestions)
                }
            }
        });
    });

    $.getJSON("processed_data/publications.json", function(data) {
        publications = data
    });

    $.getJSON("processed_data/contracts.json", function(data) {
        contracts = data
    });

    $.getJSON("processed_data/links.json", function(data) {
        links = data
    });

    waitForDataLoad()

    // Sort out the year slider
    $("#years").slider({});
    $('#minpapers').slider({});

    // Actions for the filter links
    $("#papersicon").click(function(){$("#papersp").toggle()})
    $("#yearsicon").click(function(){$("#yearsp").toggle()})
    $("#personicon").click(function(){$("#personp").toggle()})


    // Make the redraw button work
    $("#redrawbutton").click(function(){
        $("#papersp").hide();
        $("#yearsp").hide();
        updateGraph();
    })

}); 

function waitForDataLoad(){
    if($.isEmptyObject(people) || $.isEmptyObject(publications) || $.isEmptyObject(contracts) || $.isEmptyObject(links)){
        setTimeout(waitForDataLoad, 250);
    }
    else{
        updateGraph()
    }
}

function updateGraph () {

    // Populate the list of nodes (people)
    var elements = []


    // Get the current set of filters
    var minPapers = $("#minpapers").val();

    var yearRange = $("#years").val().split(",");

    var specificPerson = $('#person').val();


    // Make the list of edges, and make nodes for the edges which exist
    edges = {}
    nodes = {}

    for (var i=0;i<links.length; i++) {
        link = links[i]

        // If we're filtering for a person then make sure they're involved
        if (specificPerson != "") {
            if (! (link["from"]==specificPerson || link["to"] == specificPerson)) {
                continue;
            }
        }

        // We have different eids for publications and contracts
        if (link["eid"].startsWith("Contract_")) {
            if (contracts[link["eid"]]["year"] < yearRange[0]) {
                continue;
            }
            if (contracts[link["eid"]]["year"] > yearRange[1]) {
                continue;
            }   
        }
        else {
            if (publications[link["eid"]]["year"] < yearRange[0]) {
                continue;
            }
            if (publications[link["eid"]]["year"] > yearRange[1]) {
             continue;
         }
        }

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
                data: {id: edge_name, source: link["from"], target: link["to"], weight: 1}
            }
        }
        else {
            edges[edge_name]["data"]["weight"]++;
        }
    }

    // Find the max edge weight so we can colour appropriately
    var maxWeight = 1;
    var keptPeople = {};

    for (edge in edges) {
        if (edges[edge]["data"]["weight"] < minPapers) {
            continue
        }

        if (edges[edge]["data"]["weight"] > maxWeight) {
            maxWeight = edges[edge]["data"]["weight"];
        }

        keptPeople[edges[edge]["data"]["source"]] = 1;
        keptPeople[edges[edge]["data"]["target"]] = 1;

    }

    for (n in nodes) {
        if (!(n in keptPeople)) {
            continue;
        }
        if (nodes[n]["data"]["count"] < minPapers) {
            continue;
        }
        elements.push(nodes[n])
    }

    for (e in edges) {
        if (edges[e]["data"]["weight"] < minPapers) {
            continue
        }
        elements.push(edges[e])
    }

    var cy = cytoscape({

        container: document.getElementById('networkGraph'), // container to render in
        
        elements: elements,
        
        style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
            'background-color': function(ele){if (ele.data('type')=="GroupLeader"){return "#B22"} else if (ele.data('type')=="Company"){return "#2B2"} return('#22B')},
            'label': 'data(id)',
            'shape': function(ele){if (ele.data('type')=="GroupLeader"){return "square"} else if (ele.data('type')=="Company"){return "ellipse"} return('triangle')}
            }
        },
        
        {
            selector: 'edge',
            style: {
            // 'width': 3,
            'width': "mapData(weight,1,"+maxWeight+",1,10)",
            'line-color': "mapData(weight,1,"+maxWeight+",#CCC,#222)",
            // 'line-color': '#DDD',
            'curve-style': 'bezier'
            }
        }
        ],
        
        layout: {
            name: 'fcose',
//            name: 'circle',
            animate: true, 
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

    // This actually sets both papers and contracts

    // console.log("Setting papers to "+name1+" and "+name2)
    var table = $("#papertable")
    table.empty()

    // Only show papers in the current year filter range
    var yearRange = $("#years").val().split(",");

    for (var eid in publications) {

        var useThisPaper = false;

        if (publications[eid]["year"] < yearRange[0] || publications[eid]["year"] > yearRange[1]) {
            continue;
        }
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
            // console.log(link)
        }
    }

    for (var eid in contracts) {

        var useThisPaper = false;

        if (contracts[eid]["year"] < yearRange[0] || contracts[eid]["year"] > yearRange[1]) {
            continue;
        }

        if (name2) {
            if (contracts[eid]["from"] == name1 && contracts[eid]["to"] == name2) {
                useThisPaper = true;
            }
            if (contracts[eid]["from"] == name2 && contracts[eid]["to"] == name1) {
                useThisPaper = true;
            }
        }
        else {
            if (contracts[eid]["from"] == name1 || contracts[eid]["to"] == name1) {
                useThisPaper = true;
            }
        }

        if (useThisPaper) {
            var paper = contracts[eid];
            table.append("<tr><td>"+paper["from"]+", "+ paper["to"]+"</td><td>"+paper["type"]+"</td><td>"+paper["year"]+"</td><td></td></tr>");  
            // console.log(link)
        }
    }
}
    