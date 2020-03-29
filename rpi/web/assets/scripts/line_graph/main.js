"use strict";

function renderTrend(yLabel, endPoint, DOMid, xLabelOn=true){

    // Get objects
    var datavizBox = d3.select(DOMid);

    // Max acceptable time difference between UI and sensor measurements (in seconds)
    const MAX_TIME_DIFF = 5; 

    // Number of points we want to show on the UI (careful if too many points it cant render fast enough)
    const NBR_OF_POINTS = 100;      // NO MORE THAN 200
    const REFRESH_RATE = 1000;      // in ms

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
		bottom: 48,
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
		.attr("transform", "translate(" + (width/2.0 + margin.left) + "," + (height + margin.bottom + 28) + ")")
        .text("");

    var yAxisLabel = svg.append("text")
        .attr("class","y-label")
        .attr("transform", "translate(" + 20 + "," + (height/2.0 + margin.bottom) + ")rotate(-90)")
        .text("");


    // set the labels
    if(xLabelOn){
        xAxisLabel.text("Time (s)");
    }else{
        xAxisLabel.text("");
    }
    yAxisLabel.text(yLabel);


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
                    var diffTimeSeconds = (Math.abs(Date.now() - datetimeParser(data[0][1]))/1000);
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


function getMin(arr){
    return Math.min(...arr.map(d => d[0]));
}

function getMax(arr){
    return Math.max(...arr.map(d => d[0]));
}

function renderTrends(){

    // Get objects
    var datavizBox = d3.select("#dataviz");

    // Max acceptable time difference between UI and sensor measurements (in seconds)
    const MAX_TIME_DIFF = 5; 

    // Number of points we want to show on the UI (careful if too many points it cant render fast enough)
    const NBR_OF_POINTS = 100;      // NO MORE THAN 200
    const REFRESH_RATE = 100;      // in ms

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
		bottom: 48,
		left: 72
	};
	var width = 1000 - margin.left - margin.right;
    var height = 700 - margin.top - margin.bottom;

    var graphPadding = 32;
    var graphHeight = Math.round((height - graphPadding)/2.0);
    
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
		.attr("transform", "translate(" + (width/2.0 + margin.left) + "," + (height + margin.bottom + 28) + ")")
        .text("");

    var yTopAxisLabel = svg.append("text")
        .attr("class","y-label")
        .attr("transform", "translate(" + 20 + "," + (graphHeight/2.0 + margin.top) + ")rotate(-90)")
        .text("");

    var yBottomAxisLabel = svg.append("text")
        .attr("class","y-label")
        .attr("transform", "translate(" + 20 + "," + (graphHeight/2.0 + graphPadding + graphHeight + margin.top) + ")rotate(-90)")
        .text("");

    // set the labels
    xAxisLabel.text("Time (s)");
    yTopAxisLabel.text("Flow (L/min)");
    yBottomAxisLabel.text("Pressure (cmH2O)");

    // -----------------------------------------------------------------------
	// -------------------------- Scales Domain ------------------------------
    // -----------------------------------------------------------------------
    var xScale = d3.scaleTime().range([0, width]);
    var yTopScale = d3.scaleLinear().range([graphHeight, 0]);
    var yBottomScale = d3.scaleLinear().range([graphHeight, 0]);

    var xAxis = d3.axisBottom(xScale);
    var yTopAxis = d3.axisLeft(yTopScale);
    var yBottomAxis = d3.axisLeft(yBottomScale);

    g.append("g")
        .attr("class","xaxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    g.append("g")
        .attr("class","ytopaxis")
        .call(yTopAxis);
    
    g.append("g")
        .attr("class","ybottomaxis")
        .attr("transform", "translate(0," + (graphHeight + graphPadding) + ")")
        .call(yBottomAxis);

    var lineTop = d3.line()
        .defined(function (d) {
            return !isNaN(d[0]);
        })
        .x(function (d) {
            return xScale(datetimeParser(d[1]));
        })
        .y(function (d) {
            return yTopScale(d[0]);
        })
        .curve(d3.curveMonotoneX);

    var lineBottom = d3.line()
        .defined(function (d) {
            return !isNaN(d[0]);
        })
        .x(function (d) {
            return xScale(datetimeParser(d[1]));
        })
        .y(function (d) {
            return yBottomScale(d[0]) + graphHeight + graphPadding;
        })
        .curve(d3.curveMonotoneX);

    function draw(){

        var promises = [];
        promises.push(request_GET("api/flow/read.php?nbr-points=" + NBR_OF_POINTS));
        promises.push(request_GET("api/pressure/read.php?nbr-points=" + NBR_OF_POINTS));

        Promise.all(promises).then(function (results){
            // INFO: dataframe comes back ordered in timestamped descending order
            // d[0] is the value, d[1] is the timestamp

            // Grab results
            var flowData = results[0];
            var pressureData = results[1];

            // check
            if(flowData == null){
                flowData = [];
            }
            if(pressureData == null){
                pressureData = [];
            }
            if(flowData.length == 0 && pressureData.length == 0){
                alert("ERROR: There is no data in the DB");
                return;
            }

            // Get Min/Max
            var flowMax_y = getMax(flowData);
            var flowMax_x = datetimeParser(flowData[0][1]);
            var flowMin_y = getMin(flowData);
            var flowMin_x = datetimeParser(flowData[flowData.length-1][1]);
            var flowExtraY = Math.round((flowMax_y - flowMin_y)*0.1);

            var pressureMax_y = getMax(pressureData);
            var pressureMax_x = datetimeParser(pressureData[0][1]);
            var pressureMin_y = getMin(pressureData);
            var pressureMin_x = datetimeParser(pressureData[pressureData.length-1][1]);
            var pressureExtraY = Math.round((pressureMax_y - pressureMin_y)*0.1);

            var globalMax_x = Math.min(...[pressureMax_x,flowMax_x]);
            var globalMin_x = Math.min(...[pressureMin_x,flowMin_x]);

            // Get the difference between now and the last time measurement
            var diffTimeSeconds = Math.round(Math.abs(Date.now() - globalMax_x)/1000);
            if(diffTimeSeconds > MAX_TIME_DIFF){
                
                // Start Alarms
                svg.style("background-color", 'red');
                playAudio();

            }else{

                // Stop Alarms
                svg.style("background-color", 'white');
                pauseAudio();

                // Update Scales
                xScale.domain([globalMin_x,globalMax_x]);
                yTopScale.domain([(flowMin_y-flowExtraY),(flowMax_y+flowExtraY)]);
                yBottomScale.domain([(pressureMin_y-pressureExtraY),(pressureMax_y+pressureExtraY)]);

                // clear
                g.selectAll("path.dataviz").remove();

                // update axis
                g.select(".xaxis").call(xAxis);
                g.select(".ytopaxis").call(yTopAxis);
                g.select(".ybottomaxis").call(yBottomAxis);

                // update line
                var pathsGroup = g.selectAll("path")
                    .data(flowData)
                    .enter().append("g");

                pathsGroup.append("path")
                    .attr("class", "dataviz")
                    .datum(flowData)
                    .attr("d", lineTop)
                    .attr("fill","none")
                    .attr("stroke","#3d5c94")
                    .attr("stroke-width","1px");
                
                pathsGroup.append("path")
                    .attr("class", "dataviz")
                    .datum(pressureData)
                    .attr("d", lineBottom)
                    .attr("fill","none")
                    .attr("stroke","#3d5c94")
                    .attr("stroke-width","1px");    
            }                

            // Redraw
            setTimeout(draw, REFRESH_RATE);
        });
    }

    // Launch the Draw function
    draw();
}