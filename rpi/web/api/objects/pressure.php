<?php
class Pressure{
 
    // database connection and table name
    private $conn;
    private $table_name = "pressure";

    // object properties
    public $value;
    public $created_at;
    
    // constructor with $db as database connection
    public function __construct($db){
        $this->conn = $db;
    }

    // Read
    function read($nbrOfPoints, $after){
    
        // Query
        $query = "SELECT value, created_at, id FROM " . $this->table_name . " WHERE id > " . $after . " ORDER BY id DESC LIMIT " . $nbrOfPoints;
        
        // Submit
        $stmt = $this->conn->query($query);
    
        return $stmt;
    }

    // Delete
    function delete(){
        
        // Query
        $query = "DELETE FROM " . $this->table_name;

        // Submit
        $stmt = $this->conn->query($query);
    
        return $stmt;
    }
}