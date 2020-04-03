<?php

// required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// include database and object files
include_once '../config/database.php';
include_once '../objects/pressure.php';

// Get the url
$url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 
                "https" : "http") . "://" . $_SERVER['HTTP_HOST'] .  
                $_SERVER['REQUEST_URI']; 

// Use parse_url() function to parse the URL  
// and return an associative array which 
// contains its various components 
$url_components = parse_url($url); 
  
// Use parse_str() function to parse the 
// string passed via URL 
parse_str($url_components['query'], $params); 

// Parse
$nbrOfPoints = htmlspecialchars(strip_tags($params['nbr-points']));
$after = htmlspecialchars(strip_tags($params['after']));

// Check if nbr of points is set
if(!isset($nbrOfPoints) || !isset($after)){
    
    // set response code
    http_response_code(400);
 
    // display message: unable to create user
    echo json_encode(array("message" => "Unable to read DB. Missing Inputs"));

    die();
}
if(empty($nbrOfPoints) || empty($after)){

    // set response code
    http_response_code(400);
 
    // display message: unable to create user
    echo json_encode(array("message" => "Unable to read DB. Empty Inputs"));

    die();
}
if(!is_numeric($nbrOfPoints)){

    // set response code
    http_response_code(400);
 
    // display message: unable to create user
    echo json_encode(array("message" => "Unable to read DB. NaN"));

    die();
}

// instantiate database
$database = new Database();
$db = $database->getConnection();
 
// initialize pressure object
$pressure = new Pressure($db);

// query message
$stmt = $pressure->read($nbrOfPoints,$after);

// Check if empty
if(!is_object($stmt)){

    // set response code - 200 OK
    http_response_code(200);
 
    // show branches data in json format
    echo json_encode(array());

    die();
}

// Get the number of rows
$num = $stmt->num_rows;
 
// check if more than 0 record found
if($num == 0){
    
    // set response code - 200 OK
    http_response_code(200);
 
    // show branches data in json format
    echo json_encode(array());

    die();

}else if($num > 0){
 
    // retrieve our table contents
    $pressures_arr = $stmt->fetch_all();
 
    // set response code - 200 OK
    http_response_code(200);
 
    // show devices data in json format
    echo json_encode($pressures_arr);

}else{
 
    // set response code - 404 Not found
    http_response_code(404);
 
    // tell the user no devices found
    echo json_encode(
        array("message" => "Error : No devices found")
    );
}
