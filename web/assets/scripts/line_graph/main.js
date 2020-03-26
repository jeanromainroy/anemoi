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
        .attr("transform", "translate(" + 20 + "," + (height/2.0 + margin.bottom) + ")rotate(-90)")
        .text("");


    // set the labels
    xAxisLabel.text("Time");
    yAxisLabel.text("Pressure (cmH2O)");


    // -----------------------------------------------------------------------
	// -------------------------- Scales Domain ------------------------------
    // -----------------------------------------------------------------------

    var xScale = d3.scaleTime().range([0, width]);
    var yScale = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    g.append("g")
        .attr("class","xaxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    g.append("g")
        .attr("class","yaxis")
        .call(yAxis);

    var line = d3.line()
        .defined(function (d) {
            return !isNaN(d[0]);
        })
        .x(function (d) {
            return xScale(datetimeParser(d[1]));
        })
        .y(function (d) {
            return yScale(d[0]);
        })
        .curve(d3.curveMonotoneX);

	var datetimeParser = d3.timeParse("%Y-%m-%d %H:%M:%S");

    function draw(){

        request_GET(endPoint).then(
            function(data){
                if(data != null && data.length > 0){

                    // Get Data Min/Max
                    var minY = Math.min(...data.map(d => d[0]));
                    var maxY = Math.max(...data.map(d => d[0]));
                    var extraY = Math.round((maxY - minY)*0.1);

                    // Update Scales
                    xScale.domain(d3.extent(data, function (d) {
                        return datetimeParser(d[1]);
                    }));
                    yScale.domain([(minY-extraY),(maxY+extraY)]);

                    // clear
                    g.selectAll("path.dataviz").remove();

                    // update axis
                    g.select(".xaxis").call(xAxis);
                    g.select(".yaxis").call(yAxis);

                    // update line
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

    // Launch the Draw function
    draw();
}