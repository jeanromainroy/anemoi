// --- Datetime ---
function getFormattedDateTime(extra_seconds) {

	// Get datetime now
	var today = new Date();

	// Format time
	var second = String((today.getSeconds() + extra_seconds) % 60);
	if(second.length !== 2){
		second = "0" + second; 
	}

	var extra_minute = Math.floor((today.getSeconds() + extra_seconds)/60.0);
	var minute = String((today.getMinutes() + extra_minute) % 60);
	if(minute.length !== 2){
		minute = "0" + minute; 
	}

	var extra_hour = Math.floor((today.getMinutes() + extra_minute)/60.0);
	var hour = String((today.getHours() + extra_hour) % 24);
	if(hour.length !== 2){
		hour = "0" + hour; 
	}
	
	// Format date
	var extra_day = Math.floor((today.getHours() + extra_hour)/24.0);
	var day = String(today.getDate() + extra_day);
	if(day.length !== 2){
		day = "0" + day; 
	}

	var month = String(today.getMonth() + 1);   // JavaScript months are 0-based.
	if(month.length !== 2){
		month = "0" + month; 
	}

	var year = String(today.getFullYear());    
	
	// Return full datetime
	return year + "-" + month + "-" + day + "_" + hour + ":" + minute + ":" + second;
}
