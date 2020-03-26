<?php

// required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
 
// include database and object files
include_once '../config/database.php';
include_once '../objects/pressure.php';

// instantiate database
$database = new Database();
$db = $database->getConnection();
 
// initialize pressure object
$pressure = new Pressure($db);
 
// make sure data is not empty
if(
	$pressure->delete()
){
 
	// set response code
	http_response_code(200);

	// tell the user
	echo json_encode(array("message" => "Pressure was deleted."));
}
 
// if unable to create the branch, tell the user
else{
 
	// set response code - 503 service unavailable
	http_response_code(503);

	// tell the user
	echo json_encode(array("message" => "Error : Unable to delete pressure."));
}
?>