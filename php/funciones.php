<?php
$conn = new mysqli("localhost", "root", "", "basedatos", 3309);
if ($conn->connect_error) {
    die("Error: " . $conn->connect_error);
}
?>