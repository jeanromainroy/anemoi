"use strict";


function timeIt(){
    var t0 = performance.now();
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
    setTimeout(draw, REFRESH_RATE);
    return;
}


function renderTrends(){

    // Get objects
    var mainPanel = d3.select("#main-panel");
    var datavizBox = d3.select("#dataviz");

    // Max acceptable time difference between UI and sensor measurements (in seconds)
    const MAX_TIME_DIFF = 5000; 
    const TIME_WINDOW = 10000;

    // Number of points we want to show on the UI (careful if too many points it cant render fast enough)
    const NBR_OF_POINTS = 50;      // NO MORE THAN 200
    const REFRESH_RATE = 100;      // in ms

    // SQL Date Format
    var datetimeParser = d3.timeParse("%Y-%m-%d %H:%M:%S.%L");
    var datetimeFormatter = d3.timeFormat("%Y-%m-%d %H:%M:%S.%L");
    
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
    yTopAxisLabel.text("Volume (mL)");
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

    // min/max for the y axis
    yTopScale.domain([0, 1500]);
    yBottomScale.domain([0,40]);

    g.append("g")
        .attr("class","xaxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    g.append("g")
        .call(yTopAxis);
    
    g.append("g")
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

    // Runtime Vars
    var lastMaxVolumeId = 1;
    var lastMaxPressureId = 1;
    var volumeData = [];
    var pressureData = [];

    function draw(){

        var promises = [];
        promises.push(request_GET("api/volume/read.php?nbr-points=" + NBR_OF_POINTS + "&after=" + lastMaxVolumeId));
        promises.push(request_GET("api/pressure/read.php?nbr-points=" + NBR_OF_POINTS + "&after=" + lastMaxPressureId));

        Promise.all(promises).then(function (results){
            // INFO: dataframe comes back ordered in timestamped descending order
            // d[0] is the value, d[1] is the timestamp, d[2] is the id

            // Grab results
            var newVolumes = results[0];
            var newPressures = results[1];

            // convert to empty if null
            if(newVolumes == null){
                newVolumes = [];
            }
            if(newPressures == null){
                newPressures = [];
            }

            // Get time now
            var now = Date.now();

            // Get Max time
            if(newVolumes.length > 0){
                lastMaxVolumeId = newVolumes[0][2];
            }
            if(newPressures.length > 0){
                lastMaxPressureId = newPressures[0][2];
            }

            // Get min time
            var minLastData = Math.min(...[datetimeParser(newPressures[0][1]), datetimeParser(newVolumes[0][1])]);

            // Inverse list
            newVolumes = newVolumes.reverse();
            newPressures = newPressures.reverse();

            // concat to persistant dataframes
            volumeData = [...volumeData, ...newVolumes];
            pressureData = [...pressureData, ...newPressures];

            // remove elements who are too old
            volumeData = volumeData.filter(function(d){
                return datetimeParser(d[1]) > now - TIME_WINDOW;
            });
            pressureData = pressureData.filter(function(d){
                return datetimeParser(d[1]) > now - TIME_WINDOW;
            });

            // Get the difference between now and the last time measurement
            var diffTimeSeconds = Math.abs(now - minLastData);
            if(diffTimeSeconds > MAX_TIME_DIFF){
                
                // Start Alarms
                mainPanel.style("background-color", 'red');
                playAudio();

            }else{

                // Stop Alarms
                mainPanel.style("background-color", 'white');
                pauseAudio();
            }            

            // Update Scales
            xScale.domain([now - TIME_WINDOW,now]);

            // update axis
            g.select(".xaxis").call(xAxis);

            // update line
            var topPathsGroup = g.selectAll(".top")
                .data([volumeData]);
                
            var bottomPathsGroup = g.selectAll(".bottom")
                .data([pressureData]);
                        
            // update lines
            topPathsGroup = topPathsGroup
                .enter().append("path")
                .attr("class", "top")
                .attr("d", lineTop)
                .attr("fill","none")
                .attr("stroke","#3d5c94")
                .attr("stroke-width","2px")
                .merge(topPathsGroup);
            
            topPathsGroup
                .attr("d", lineTop)
                .attr("fill","none")
                .attr("stroke","#3d5c94")
                .attr("stroke-width","2px");
                
            bottomPathsGroup = bottomPathsGroup
                .enter().append("path")
                .attr("class", "bottom")
                .merge(bottomPathsGroup); 

            bottomPathsGroup
                .attr("d", lineBottom)
                .attr("fill","none")
                .attr("stroke","#3d5c94")
                .attr("stroke-width","2px")

            // Redraw
            setTimeout(draw, REFRESH_RATE);
        });
    }

    // Launch the Draw function
    draw();
}