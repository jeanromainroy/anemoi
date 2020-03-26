<?php

// required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
 
// include database and object files
include_once '../config/database.php';
include_once '../objects/session.php';

// instantiate database
$database = new Database();
$db = $database->getConnection();
 
// initialize session object
$session = new Session($db);
 
// get posted data
$data = json_decode(file_get_contents("php://input"));

// Check inputs
if(!isset($data->id)){

    // set response code
    http_response_code(400);
 
    // display message: unable to create user
    echo json_encode(array("message" => "Unable to delete session. Missing Inputs"));

    die();
}

if(empty($data->id)){

    // set response code
    http_response_code(400);
 
    // display message: unable to create user
    echo json_encode(array("message" => "Unable to delete session. Empty Inputs"));

    die();
}

// sanitize
$data->id=htmlspecialchars(strip_tags($data->id));

// set session values
$session->id = $data->id;

// make sure data is not empty
if(
	$session->delete()
){
 
	// set response code
	http_response_code(200);

	// tell the user
	echo json_encode(array("message" => "Session (". $data->id . ") was deleted."));
}
 
// if unable to create the branch, tell the user
else{
 
	// set response code - 503 service unavailable
	http_response_code(503);

	// tell the user
	echo json_encode(array("message" => "Error : Unable to delete session."));
}
?>