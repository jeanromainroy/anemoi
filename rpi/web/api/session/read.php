<?php

// required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// include database and object files
include_once '../config/database.php';
include_once '../objects/session.php';

// instantiate database
$database = new Database();
$db = $database->getConnection();
 
// initialize session object
$session = new Session($db);

// query message
$stmt = $session->read();

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
 
    // devices array
    $sessions_arr = array();
 
    // retrieve our table contents
    while ($row = $stmt->fetch_assoc()){

        // extract row
        // this will make $row['name'] to
        // just $name only
        extract($row);

        $session_item=array(
            "id" => $id,
            "patient_id" => $patient_id,
            "vac_pc" => $vac_pc,
            "vac_vc" => $vac_vc,
            "cpap" => $cpap,
            "bipap" => $bipap,
            "peep" => $peep,
            "delta_p" => $delta_p,
            "respiration_rate" => $respiration_rate,
            "inspiration_expiration_ratio" => $inspiration_expiration_ratio,
            "fio2" => $fio2,
            "trigger_level" => $trigger_level,
            "tidal_volume" => $tidal_volume,
            "max_pressure" => $max_pressure,
            "created_at" => $created_at,
            "updated_at" => $updated_at
        );
 
        array_push($sessions_arr, $session_item);
    }
 
    // set response code - 200 OK
    http_response_code(200);
 
    // show devices data in json format
    echo json_encode($sessions_arr);

}else{
 
    // set response code - 404 Not found
    http_response_code(404);
 
    // tell the user no devices found
    echo json_encode(
        array("message" => "Error : No devices found")
    );
}
