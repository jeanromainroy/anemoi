function breakStringAtEvery(myString, breakAtEvery){

	var nbrBreaks = Math.floor(myString.length/breakAtEvery);
	var position = 0;
	for(var j = 1 ; j <= nbrBreaks ; j++){
		position = j*breakAtEvery + j;
		myString = [myString.slice(0, position), "<br/>", myString.slice(position)].join('');	
	}

	return myString;
}

// --- Create a HTML Table ---
function createTable(colNames,labels,dataframe,HEADER_ROW=false){

	// Add the header
	html_payload = "<div class='scrollingtable'><div><div><table><tbody>";

	// Add Header row
	html_payload = html_payload + "<tr>";
	for(var i = 0 ; i < labels.length ; i++){
		html_payload = html_payload + "<td style='text-align:center; background-color:#3d5c94; color:white; font-weight:bold'>" + labels[i] + "</td>";
	}
	html_payload = html_payload + "</tr>";


	// We will break the text content of each cell at every N character
	const breakAtEvery = 32;

	// Add the dataframe
	dataframe.forEach(function(d){

		html_payload = html_payload + "<tr>";

		for(var i = 0 ; i < labels.length ; i++){

			// Break the content so that it doesnt overflow
			var content = d[labels[i]];
			if(content == null){
				content = "NULL";
			}
			var words = content.split(" ");
			var lines = [];
			var line = "";

			words.forEach(function(word){
				line = line + word.toString() + " ";
				if(line.length > breakAtEvery){
					if(line.length > 1.5*breakAtEvery){
						line = breakStringAtEvery(line,breakAtEvery);								
					}
					lines.push(line);
					line = "";
				}
			});
			lines.push(line);

			// Join lines with breaks
			content = lines.join("<br/>");

			// Append to html payload
			html_payload = html_payload + "<td>" + content + "</td>";
		}
		
		html_payload = html_payload + "</tr>";
	});

	html_payload = html_payload + "</tbody></table></div></div></div>";
	
	return html_payload;
}

