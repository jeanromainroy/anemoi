<?php
class Database{
 
    // Database credentials
    public $db_name = "anemoi";
    private $hostname = "127.0.0.1:3306";
    private $username = "jroy";
    private $password = "31415926";
    public $conn;
 
    // get the database connection
    public function getConnection(){

        // Create a connection with the DB
        $this->conn = new mysqli($this->hostname, $this->username, $this->password, $this->db_name);

        // Check connection
        if($this->conn->connect_error) {
            echo "Error: Couldn't connect to db";

            // Set to null
            $this->conn = null;
        }
 
        return $this->conn;
    }
}
?>
