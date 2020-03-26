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
    echo json_encode(array("message" => "Unable to update session. Missing Inputs"));

    die();
}

if(empty($data->id)){

    // set response code
    http_response_code(400);
 
    // display message: unable to create user
    echo json_encode(array("message" => "Unable to update session. Empty Inputs"));

    die();
}

// sanitize
$data->id=htmlspecialchars(strip_tags($data->id));

// set session values
$session->id = $data->id;

// params
if(isset($data->patient_id) && !empty($data->patient_id)){
	$session->patient_id = htmlspecialchars(strip_tags($data->patient_id));
}
if(isset($data->vac_pc) && !empty($data->vac_pc)){
	$session->vac_pc = htmlspecialchars(strip_tags($data->vac_pc));
}
if(isset($data->vac_vc) && !empty($data->vac_vc)){
	$session->vac_vc = htmlspecialchars(strip_tags($data->vac_vc));
}
if(isset($data->cpap) && !empty($data->cpap)){
	$session->cpap = htmlspecialchars(strip_tags($data->cpap));
}
if(isset($data->bipap) && !empty($data->bipap)){
	$session->bipap = htmlspecialchars(strip_tags($data->bipap));
}
if(isset($data->peep) && !empty($data->peep)){
	$session->peep = htmlspecialchars(strip_tags($data->peep));
}
if(isset($data->delta_p) && !empty($data->delta_p)){
	$session->delta_p = htmlspecialchars(strip_tags($data->delta_p));
}
if(isset($data->respiration_rate) && !empty($data->respiration_rate)){
	$session->respiration_rate = htmlspecialchars(strip_tags($data->respiration_rate));
}
if(isset($data->inspiration_expiration_ratio) && !empty($data->inspiration_expiration_ratio)){
	$session->inspiration_expiration_ratio = htmlspecialchars(strip_tags($data->inspiration_expiration_ratio));
}
if(isset($data->fio2) && !empty($data->fio2)){
	$session->fio2 = htmlspecialchars(strip_tags($data->fio2));
}
if(isset($data->trigger_level) && !empty($data->trigger_level)){
	$session->trigger_level = htmlspecialchars(strip_tags($data->trigger_level));
}
if(isset($data->tidal_volume) && !empty($data->tidal_volume)){
	$session->tidal_volume = htmlspecialchars(strip_tags($data->tidal_volume));
}
if(isset($data->max_pressure) && !empty($data->max_pressure)){
	$session->max_pressure = htmlspecialchars(strip_tags($data->max_pressure));
}
 
// make sure data is not empty
if(
	$session->update()
){
 
	// set response code
	http_response_code(200);

	// tell the user
	echo json_encode(array("message" => "Session (". $data->id . ") was updated."));
}
 
// if unable to create the branch, tell the user
else{
 
	// set response code - 503 service unavailable
	http_response_code(503);

	// tell the user
	echo json_encode(array("message" => "Error : Unable to update session."));
}
?>