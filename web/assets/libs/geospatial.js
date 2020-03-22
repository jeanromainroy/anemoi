/**
 * Checks if a GPS point is inside a GPS polygon
 *
 * @param point       		The point [lat,lng]
 * @param polygon          	The polygon [[lat,lng],[lat,lng],...]
 */
function isPointInPolygon(point, polygon) {
	// ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Get the central point of a polygon
 *
 * @param polygon          	The polygon [[lat,lng],[lat,lng],...]
 */
function centerPoint(polygon) {

	var sumX = 0.0;
	var sumY = 0.0;
	var counter = 0;
	polygon.forEach(function(point){

		var x = point[0], y = point[1];
		sumX = sumX + x;
		sumY = sumY + y;
		counter = counter + 1;
	});

	var aveX = sumX/counter;
	var aveY = sumY/counter;

    return [aveX,aveY];
}