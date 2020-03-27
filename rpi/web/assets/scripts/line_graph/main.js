"use strict";

function renderTrend(endPoint, DOMid){

    // Get objects
    var datavizBox = d3.select(DOMid);

    // Max acceptable time difference between UI and sensor measurements (in seconds)
    const MAX_TIME_DIFF = 5; 

    // Number of points we want to show on the UI (careful if too many points it cant render fast enough)
    const NBR_OF_POINTS = 100;      // NO MORE THAN 200
    const REFRESH_RATE = 5000;      // in ms

    // SQL Date Format
    var datetimeParser = d3.timeParse("%Y-%m-%d %H:%M:%S.%L");
    
    // Audio
    var wasAllowed = false;
    var audio = document.getElementById("myAudio"); 
    let bt = document.getElementById("bt");
    bt.addEventListener("click", ()=>{
        playAudio();
        pauseAudio();
        wasAllowed = true;
    });
    function playAudio() {
        if(wasAllowed){
            audio.play();
        }
    }    
    function pauseAudio() {
        if(wasAllowed){
            audio.pause();
        }
    }

    // Main Graph
	var margin = {
		top: 32,
		right: 8,
		bottom: 72,
		left: 72
	};
	var width = 1000 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;
    
    
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

    function draw(){

        request_GET(endPoint + "?nbr-points=" + NBR_OF_POINTS).then(
            function(data){
                if(data != null && data.length > 0){

                    // Get the difference between now and the last time measurement
                    var diffTimeSeconds = (Math.abs(Date.now() - datetimeParser(data[0][1]))/1000) % 60;
                    if(diffTimeSeconds > MAX_TIME_DIFF){
                        svg.style("background-color", 'red');
                        playAudio();
                    }else{
                        svg.style("background-color", 'white');
                        pauseAudio();
                    }

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
                    setTimeout(draw, REFRESH_RATE);
                }
            },
            function(error){
                console.log(error);
                setTimeout(draw, REFRESH_RATE);
            }
        );
    }

    // Launch the Draw function
    draw();
}