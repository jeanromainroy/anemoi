"use strict";


function renderTrend(endPoint){

    var nbrOfPoints = 100;

    // Get objects
    var datavizBox = d3.select("#dataviz");

    // Main Graph
	var margin = {
		top: 64,
		right: 8,
		bottom: 72,
		left: 72
	};
	var width = 1000 - margin.left - margin.right;
	var height = 500 - margin.top - margin.bottom;
    
	// -----------------------------------------------------------------------
	// ------------------------ Objects Creation -----------------------------
	// -----------------------------------------------------------------------
    var svg = datavizBox.append("svg")
		.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("data-header", "header");

	// Graph Group
	var g = svg
		.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Axis Labels
	var xAxisLabel = svg.append("text")
        .attr("class","x-label")
		.attr("transform", "translate(" + (width/2.0 + margin.left) + "," + (height + margin.bottom + 32) + ")")
        .text("");

    var yAxisLabel = svg.append("text")
        .attr("class","y-label")
        .attr("transform", "translate(" + 20 + "," + height/2.0 + ")rotate(-90)")
        .text("");


    // set the labels
    xAxisLabel.text("Time");
    yAxisLabel.text("Pressure (cmH2O)");

    // -----------------------------------------------------------------------
	// -------------------------- Scales Domain ------------------------------
	// -----------------------------------------------------------------------

    var xScale = d3.scaleTime().range([0, width]);
    var yScale = d3.scaleLinear().range([height, 0]);

    xScale.domain([nbrOfPoints,0]);
    yScale.domain([900, 1122]);

    var xAxis = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1));		
    var yAxis = d3.axisLeft(yScale);

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    g.append("g")
        .call(yAxis);

    var line = d3.line()
        .defined(function (d) {
            return !isNaN(d[0]);
        })
        .x(function (d,i) {
            return xScale(i);
        })
        .y(function (d) {
            return yScale(d[0]);
        })
        .curve(d3.curveMonotoneX);


    function draw(){

        request_GET(endPoint).then(
            function(data){
                if(data != null && data.length > 0){
                        
                    g.selectAll("path.dataviz").remove();

                    var pathsGroup = g.selectAll("path")
                        .data(data)
                        .enter().append("g");

                    pathsGroup.append("path")
                        .attr("class", "dataviz")
                        .datum(data)
                        .attr("d", line)
                        .attr("fill","none")
                        .attr("stroke","#3d5c94")
                        .attr("stroke-width","1px");                    

                    // Redraw
                    draw();
                }
            },
            function(error){
                console.log(error);
            }
        );
    }

    draw();
}