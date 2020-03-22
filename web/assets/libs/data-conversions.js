// --- Text Mapping ---
function JSONtoCSV(json){

	// Get the column names
	var fields = Object.keys(json[0]);

	// A function to replace the null values with empty
	var replacer = function(key, value) { 
		if(value === null){
			return '';
		}else{
			return value;
		}
	}

	// Map the JSON data to a CSV
	var csv = json.map(function(row){
		return fields.map(function(fieldName){
			return JSON.stringify(row[fieldName], replacer)
		}).join(',');
	});

	// Add the header column on top of the array
	csv.unshift(fields.join(','));

	// Join everything
	return csv.join('\r\n');
}