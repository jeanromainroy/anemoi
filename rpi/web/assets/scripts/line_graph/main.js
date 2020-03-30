"use strict";

function getMin(arr){
    return Math.min(...arr.map(d => d[0]));
}

function getMax(arr){
    return Math.max(...arr.map(d => d[0]));
}

function renderTrends(){

    // Get objects
    var mainPanel = d3.select("#main-panel");
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
        bt.style.backgroundColor = "#3d5c94";
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
		right: 72,
		bottom: 72,
		left: 72
	};
	var width = mainPanel.node()['clientWidth'] - margin.left - margin.right;
    var height = mainPanel.node()['clientHeight'] - margin.top - margin.bottom;

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
                mainPanel.style("background-color", 'red');
                playAudio();

            }else{

                // Stop Alarms
                mainPanel.style("background-color", 'white');
                pauseAudio();

                // Update Scales
                xScale.domain([globalMin_x,globalMax_x]);
                yTopScale.domain([(flowMin_y-flowExtraY),(flowMax_y+flowExtraY)]);
                //yBottomScale.domain([0,40]);
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