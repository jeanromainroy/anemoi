"use strict";

// SQL Date Format
var datetimeParser = d3.timeParse("%Y-%m-%d %H:%M:%S.%L");
var datetimeFormatter = d3.timeFormat("%Y-%m-%d %H:%M:%S.%L");

function timeIt(){
    var t0 = performance.now();
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
    setTimeout(draw, REFRESH_RATE);
    return;
}

function getMilliseconds(datetime){
    return datetimeParser(datetime).getSeconds()*1000.0 + datetimeParser(datetime).getMilliseconds();
}


function renderTrends(){

    // Get objects
    var mainPanel = d3.select("#main-panel");
    var datavizBox = d3.select("#dataviz");
    var mainBox = d3.select("#metrics");
    var metric1 = mainBox.select("#metric1");
    var metric2 = mainBox.select("#metric2");
    var metric3 = mainBox.select("#metric3");
    var metric4 = mainBox.select("#metric4");

    // Max acceptable time difference between UI and sensor measurements (in seconds)
    const MAX_TIME_DIFF = 5000; 
    const TIME_WINDOW = 12000;      // 60/(val*0.5) must be a integer

    // Number of points we want to show on the UI (careful if too many points it cant render fast enough)
    const NBR_OF_POINTS = 200;      // NO MORE THAN 200
    const REFRESH_RATE = 10;      // in ms

    // Timezone offset
    var utcOffset = (new Date()).getTimezoneOffset()*60*1000;   // in milliseconds
    var timezoneOffset = utcOffset; // or 0

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
		bottom: 96,
		left: 72
	};
	var width = mainPanel.node()['clientWidth'] - margin.left - margin.right;
    var height = mainPanel.node()['clientHeight'] - margin.top - margin.bottom;

    var graphPadding = 32;
    var graphHeight = Math.round((height - graphPadding)/2.0);

    // -----------------------------------------------------------------------
    // ---------------------------- Metrics Nbrs -----------------------------
    // -----------------------------------------------------------------------
    var h1Elem = document.createElement("h1");
    var pElem = document.createElement("p");
    var t = document.createTextNode("Min Vol");     // Create a text node
    pElem.appendChild(t);  
    var t = document.createTextNode("0");     // Create a text node
    h1Elem.appendChild(t);  
    metric1.node().appendChild(pElem);
    metric1.node().appendChild(h1Elem);

    var h1Elem = document.createElement("h1");
    var pElem = document.createElement("p");
    var t = document.createTextNode("Max Vol");     // Create a text node
    pElem.appendChild(t);  
    var t = document.createTextNode("0");     // Create a text node
    h1Elem.appendChild(t);  
    metric2.node().appendChild(pElem);
    metric2.node().appendChild(h1Elem);

    var h1Elem = document.createElement("h1");
    var pElem = document.createElement("p");
    var t = document.createTextNode("Min Pr");     // Create a text node
    pElem.appendChild(t);  
    var t = document.createTextNode("0");     // Create a text node
    h1Elem.appendChild(t);  
    metric3.node().appendChild(pElem);
    metric3.node().appendChild(h1Elem);

    var h1Elem = document.createElement("h1");
    var pElem = document.createElement("p");
    var t = document.createTextNode("Max Pr");     // Create a text node
    pElem.appendChild(t);  
    var t = document.createTextNode("0");     // Create a text node
    h1Elem.appendChild(t);  
    metric4.node().appendChild(pElem);
    metric4.node().appendChild(h1Elem);
    
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
		.attr("transform", "translate(" + (width/2.0 + margin.left) + "," + (height + margin.bottom - 16) + ")")
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
    xAxisLabel.text("Time (ms)");
    yTopAxisLabel.text("Volume (mL)");
    yBottomAxisLabel.text("Pressure (cmH2O)");

    // -----------------------------------------------------------------------
	// -------------------------- Scales Domain ------------------------------
    // -----------------------------------------------------------------------
    var xScale = d3.scaleLinear().range([0, width]);
    var yTopScale = d3.scaleLinear().range([graphHeight, 0]);
    var yBottomScale = d3.scaleLinear().range([graphHeight, 0]);

    var xAxis = d3.axisBottom(xScale);
    var yTopAxis = d3.axisLeft(yTopScale);
    var yBottomAxis = d3.axisLeft(yBottomScale);

    // min/max for the y axis
    yTopScale.domain([0, 1500]);
    yBottomScale.domain([0,40]);

    // Update Scales
    xScale.domain([0, TIME_WINDOW]);

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
            var milliSeconds = getMilliseconds(d[1]) % TIME_WINDOW;
            var xVal = xScale(milliSeconds);
            if(xVal < 0){
                return null;
            }
            return xVal;
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
            var milliSeconds = getMilliseconds(d[1]) % TIME_WINDOW;
            var xVal = xScale(milliSeconds);
            if(xVal < 0){
                return null;
            }
            return xVal;
        })
        .y(function (d) {
            return yBottomScale(d[0]) + graphHeight + graphPadding;
        })
        .curve(d3.curveMonotoneX);

    // Runtime Vars
    var lastMaxVolumeId = 1;
    var lastMaxPressureId = 1;
    var minLastData;
    var volumeData = [];
    var pressureData = [];
    var maxVolume = 0;
    var minVolume = 0;
    var maxPressure = 0;
    var minPressure = 0;
    var topLastSeconds = 0;
    var bottomLastSeconds = 0;
    metric1.select("h1").text(0);
    metric2.select("h1").text(0);
    metric3.select("h1").text(0);
    metric4.select("h1").text(0);
    var firstRun = true;

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
            var now = Date.now() + timezoneOffset;

            // Get Max time
            if(newVolumes.length > 0 && newPressures.length > 0){
                lastMaxVolumeId = newVolumes[0][2];
                lastMaxPressureId = newPressures[0][2];
                minLastData = Math.min(...[datetimeParser(newPressures[0][1]), datetimeParser(newVolumes[0][1])]);
            }else if(newVolumes.length > 0){
                lastMaxVolumeId = newVolumes[0][2];
            }else if(newPressures.length > 0){
                lastMaxPressureId = newPressures[0][2];
            }

            // Inverse list
            newVolumes = newVolumes.reverse();
            newPressures = newPressures.reverse();

            // concat to persistant dataframes
            volumeData = [...volumeData, ...newVolumes];
            pressureData = [...pressureData, ...newPressures];

            // get min time
            var minDate = now - TIME_WINDOW;

            // remove elements who are too old
            volumeData = volumeData.filter(function(d){
                return datetimeParser(d[1]) - minDate >= 500;
            });
            pressureData = pressureData.filter(function(d){
                return datetimeParser(d[1]) - minDate >= 500;
            });

            // Get Min/Max Value
            if(volumeData != null && volumeData.length > 0){
                var volumeMinMax = d3.extent(volumeData.map(x => +x[0]));
                if(minVolume != volumeMinMax[0]){
                    minVolume = volumeMinMax[0];
                    metric1.select("h1").text(minVolume);
                }
                if(maxVolume != volumeMinMax[1]){
                    maxVolume = volumeMinMax[1];
                    metric2.select("h1").text(maxVolume);
                }
            }
            if(pressureData != null && pressureData.length > 0){
                var pressureMinMax = d3.extent(pressureData.map(x => +x[0]));
                if(minPressure != pressureMinMax[0]){
                    minPressure = pressureMinMax[0];
                    metric3.select("h1").text(minPressure);
                }
                if(maxPressure != pressureMinMax[1]){
                    maxPressure = pressureMinMax[1];
                    metric4.select("h1").text(maxPressure);
                }
            }

            // Get the difference between now and the last time measurement
            var diffTimeSeconds = Math.abs(now - minLastData);
            if(diffTimeSeconds > MAX_TIME_DIFF){
                
                // Start Alarms
                mainPanel.style("background-color", 'red');
                mainBox.style("background-color", 'red');
                playAudio();

            }else{

                // Stop Alarms
                mainPanel.style("background-color", 'white');
                mainBox.style("background-color", 'white');
                pauseAudio();
            }

            // Get last milliseconds
            var topNew = false;
            var bottomNew = false;
            var topNewSeconds = datetimeParser(volumeData[volumeData.length-1][1]) % TIME_WINDOW;
            var bottomNewSeconds = datetimeParser(pressureData[pressureData.length-1][1]) % TIME_WINDOW;
            if(topNewSeconds < topLastSeconds){
                topNew = true;
            }
            if(bottomNewSeconds < bottomLastSeconds){
                bottomNew = true;
            }
            topLastSeconds = topNewSeconds;
            bottomLastSeconds = bottomNewSeconds;

            if(firstRun){
                firstRun = false;

                // clear array
                volumeData = [];
                pressureData = [];
            }

            // Filter by before/after
            var volumeDataBefore = volumeData.filter(function(d){
                return getMilliseconds(d[1]) % TIME_WINDOW <= now % TIME_WINDOW
            });
            var volumeDataAfter = volumeData.filter(function(d){
                return getMilliseconds(d[1]) % TIME_WINDOW > now % TIME_WINDOW
            });

            var pressureDataBefore = pressureData.filter(function(d){
                return getMilliseconds(d[1]) % TIME_WINDOW <= now % TIME_WINDOW
            });
            var pressureDataAfter = pressureData.filter(function(d){
                return getMilliseconds(d[1]) % TIME_WINDOW > now % TIME_WINDOW
            });

            // update line before
            var topPathsGroup = g.selectAll(".top-before")
                .data([volumeDataBefore]);
                
            var bottomPathsGroup = g.selectAll(".bottom-before")
                .data([pressureDataBefore]);

            // update lines
            topPathsGroup = topPathsGroup
                .enter().append("path")
                .attr("class", "top-before")
                .merge(topPathsGroup);
            
            topPathsGroup
                .attr("d", lineTop)
                .attr("fill","none")
                .attr("stroke","#3d5c94")
                .attr("stroke-width","2px");
                
            bottomPathsGroup = bottomPathsGroup
                .enter().append("path")
                .attr("class", "bottom-before")
                .merge(bottomPathsGroup); 

            bottomPathsGroup
                .attr("d", lineBottom)
                .attr("fill","none")
                .attr("stroke","#3d5c94")
                .attr("stroke-width","2px");


            // update line before
            var topPathsGroup = g.selectAll(".top-after")
                .data([volumeDataAfter]);
                
            var bottomPathsGroup = g.selectAll(".bottom-after")
                .data([pressureDataAfter]);

            // update lines
            topPathsGroup = topPathsGroup
                .enter().append("path")
                .attr("class", "top-after")
                .merge(topPathsGroup);
            
            topPathsGroup
                .attr("d", lineTop)
                .attr("fill","none")
                .attr("stroke","#3d5c94")
                .attr("stroke-width","2px");
                
            bottomPathsGroup = bottomPathsGroup
                .enter().append("path")
                .attr("class", "bottom-after")
                .merge(bottomPathsGroup); 

            bottomPathsGroup
                .attr("d", lineBottom)
                .attr("fill","none")
                .attr("stroke","#3d5c94")
                .attr("stroke-width","2px");


            // Redraw
            setTimeout(draw, REFRESH_RATE);
        });
    }

    // Launch the Draw function
    draw();
}