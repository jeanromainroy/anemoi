// Constants
httpTimeout = 20000;


/**
 * A GET request using XMLHttpRequest
 *
 * @param url           The target url
 */
var request_GET = function(url, ERROR_MSG=true, RESPONSE_TYPE="json") {

	var xhr = new XMLHttpRequest();

	return new Promise(function(resolve,reject){

		// Setup our listener to process compeleted requests
		xhr.onload = function() {
			
			// Process the response
			if (xhr.status >= 200 && xhr.status < 300) {
				
				// If successful
				resolve(xhr.response);

			}else if(xhr.status == 401){

				// Send to index.html
				window.location.href = '/index.html';
				
			}else{

				// If failed
				reject({
					status: xhr.status,
					statusText: xhr.statusText
				});
			}
		};

		// Setup our HTTP request
		xhr.open('GET', url, true);
		xhr.responseType = RESPONSE_TYPE;
		
		// time in milliseconds
		xhr.timeout = httpTimeout; 

		// Timeout function
		xhr.ontimeout = function (e) {
			if(ERROR_MSG){
				alert("ERROR : Internet not working");
			}
			console.log("ERROR: Internet not working");

			// If failed
			reject({
				status: xhr.status,
				statusText: xhr.response
			});
		};

		// Set JWT Token
		var jwt = getCookie('jwt');
		xhr.setRequestHeader('Authorization','Bearer ' + jwt);
		
		// Send the request
		xhr.send();
	});
};

/**
 * A POST request using XMLHttpRequest
 *
 * @param url           The target url
 * @param payload       The request body in JSON format, e.g. {"email": "hey@mail.com", "password": "101010"}
 */
var request_POST = function(url,payload = {}, ERROR_MSG=true, RESPONSE_TYPE="json") {
	// payload must be in the format : {"email": "hey@mail.com", "password": "101010"}

	// JSON stringify the payload
	payload = JSON.stringify(payload);

	// Create a request
	var xhr = new XMLHttpRequest();

	return new Promise(function(resolve,reject){

		// Setup our listener to process compeleted requests
		xhr.onload = function() {
			
			// Process the response
			if (xhr.status >= 200 && xhr.status < 300) {
				
				// If successful
				resolve(xhr.response);

			}else if(xhr.status == 401){

				// Send to index.html
				window.location.href = '/index.html';

			}else{
				
				// If failed
				reject({
					status: xhr.status,
					statusText: xhr.response
				});
			}
		};

		// Setup our HTTP request
		xhr.open('POST', url, true);
		xhr.responseType = RESPONSE_TYPE;

		// time in milliseconds
		xhr.timeout = httpTimeout; 

		// Timeout function
		xhr.ontimeout = function (e) {
			if(ERROR_MSG){
				alert("ERROR : Internet not working");
			}
			console.log("ERROR: Internet not working");

			// If failed
			reject({
				status: xhr.status,
				statusText: xhr.response
			});
		};

		//Send the proper header information along with the request
		xhr.setRequestHeader("Content-Type", "application/json");

		// Set JWT Token
		var jwt = getCookie('jwt');
		xhr.setRequestHeader('Authorization','Bearer ' + jwt);
		
		// Send the request
		xhr.send(payload);
	});
};


/**
 * A POST request using the fetch function
 *
 * @param url           The target url
 * @param payload       The request body in JSON format, e.g. {"email": "hey@mail.com", "password": "101010"}
 */
function fetch_UPLOAD(url, payload = {}){

	var jwt = getCookie('jwt');

	return fetch(url,{
		method: 'POST',
		mode: 'same-origin',
		cache: 'no-cache',
		credentials: 'same-origin',
		headers: {
			'Authorization':'Bearer ' + jwt,
		},
		body: payload
	});
}

/**
 * Saves an arbitrary cookie
 *
 * @param cname			The saved name of the cookie
 * @param cvalue		The saved value of the cookie
 * @param exdays		The number of days that the cookie should be saved in the cache
 */
function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

/**
 * Get a saved cookie using it's name
 *
 * @param cname			The saved name of the cookie
 */
function getCookie(cname){
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' '){
			c = c.substring(1);
		}

		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

/**
 * Returns all the params in the current URL
 * 
 * ie. /index.html?foo=34&bob=35
 * 
 * 		returns {foo: 34, bob: 35}
 * 
 */
function getUrlParams() {

	// init array
	var params = {};

	// grab current url
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
	function(m,key,value) {
		params[key] = value;
	});
	
	return params;
}