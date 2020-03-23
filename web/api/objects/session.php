<?php
class Session{
 
    // database connection and table name
    private $conn;
    private $table_name = "session";

    // object properties
    public $id;
    public $patient_id;
    
    public $vac_pc;
    public $vac_vc;
    public $cpap;
    public $bipap;

    public $peep;
    public $delta_p;
    public $respiration_rate;
    public $inspiration_expiration_ratio;
    public $fio2;
    public $trigger_level;
    public $tidal_volume;
    public $max_pressure;

    public $updated_at;
    public $created_at;

    
    // constructor with $db as database connection
    public function __construct($db){
        $this->conn = $db;
    }

    // Create
    function create(){
    
        // Query
        $query = "INSERT INTO " . $this->table_name . " (patient_id, vac_pc, vac_vc, cpap, bipap, peep, delta_p, respiration_rate, inspiration_expiration_ratio, fio2, trigger_level, tidal_volume, max_pressure) VALUES (" .
                ((isset($this->patient_id) && !empty($this->patient_id)) ? $this->patient_id : "NULL") . "," .                 
                ((isset($this->vac_pc) && !empty($this->vac_pc)) ? $this->vac_pc : "0") . "," . 
                ((isset($this->vac_vc) && !empty($this->vac_vc)) ? $this->vac_vc : "0") . "," . 
                ((isset($this->cpap) && !empty($this->cpap)) ? $this->cpap : "0") . "," . 
                ((isset($this->bipap) && !empty($this->bipap)) ? $this->bipap : "0") . "," . 
                ((isset($this->peep) && !empty($this->peep)) ? $this->peep : "NULL") . "," . 
                ((isset($this->delta_p) && !empty($this->delta_p)) ? $this->delta_p : "NULL") . "," . 
                ((isset($this->respiration_rate) && !empty($this->respiration_rate)) ? $this->respiration_rate : "NULL") . "," . 
                ((isset($this->inspiration_expiration_ratio) && !empty($this->inspiration_expiration_ratio)) ? $this->inspiration_expiration_ratio : "NULL") . "," . 
                ((isset($this->fio2) && !empty($this->fio2)) ? $this->fio2 : "NULL") . "," . 
                ((isset($this->trigger_level) && !empty($this->trigger_level)) ? $this->trigger_level : "NULL") . "," . 
                ((isset($this->tidal_volume) && !empty($this->tidal_volume)) ? $this->tidal_volume : "NULL") . "," . 
                ((isset($this->max_pressure) && !empty($this->max_pressure)) ? $this->max_pressure : "NULL") . ")";

        echo $query;

        // Submit
        $stmt = $this->conn->query($query);

    
        return $stmt;
    }
    

    // Read
    function read(){
    
        // Query
        $query = "SELECT * FROM " . $this->table_name;

        // Submit
        $stmt = $this->conn->query($query);
    
        return $stmt;
    }

    // Read
    function read_last(){
    
        // Query
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY id DESC LIMIT 1";

        // Submit
        $stmt = $this->conn->query($query);
    
        return $stmt;
    }

    // Update
    function update(){
    
        // Query
        $query = "UPDATE " . $this->table_name . " SET " . 
        ((isset($this->patient_id) && !empty($this->patient_id)) ? ("patient_id=" . $this->patient_id . ",") : "") .
        ((isset($this->vac_pc) && !empty($this->vac_pc)) ? ("vac_pc=" . $this->vac_pc . ",") : "") .
        ((isset($this->vac_vc) && !empty($this->vac_vc)) ? ("vac_vc=" . $this->vac_vc . ",") : "") .
        ((isset($this->cpap) && !empty($this->cpap)) ? ("cpap=" . $this->cpap . ",") : "") .
        ((isset($this->bipap) && !empty($this->bipap)) ? ("bipap=" . $this->bipap . ",") : "") .
        ((isset($this->peep) && !empty($this->peep)) ? ("peep=" . $this->peep . ",") : "") .
        ((isset($this->delta_p) && !empty($this->delta_p)) ? ("delta_p=" . $this->delta_p . ",") : "") .
        ((isset($this->respiration_rate) && !empty($this->respiration_rate)) ? ("respiration_rate=" . $this->respiration_rate . ",") : "") .
        ((isset($this->inspiration_expiration_ratio) && !empty($this->inspiration_expiration_ratio)) ? ("inspiration_expiration_ratio=" . $this->inspiration_expiration_ratio . ",") : "") .
        ((isset($this->fio2) && !empty($this->fio2)) ? ("fio2=" . $this->fio2 . ",") : "") .
        ((isset($this->trigger_level) && !empty($this->trigger_level)) ? ("trigger_level=" . $this->trigger_level . ",") : "") .
        ((isset($this->tidal_volume) && !empty($this->tidal_volume)) ? ("tidal_volume=" . $this->tidal_volume . ",") : "") .
        ((isset($this->max_pressure) && !empty($this->max_pressure)) ? ("max_pressure=" . $this->max_pressure . ",") : "");
        
        // remove comma
        if(substr($query,-1) == ","){
            $query = substr($query,0,-1);
        };

        // Add Where
        $query .= " WHERE id='" . $this->id . "'";

        // Submit
        $stmt = $this->conn->query($query);
    
        return $stmt;
    }

    // Delete
    function delete(){
        
        // Query
        $query = "DELETE FROM " . $this->table_name . " WHERE id='" . $this->id . "'";

        // Submit
        $stmt = $this->conn->query($query);
    
        return $stmt;
    }
}