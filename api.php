<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$conn = new mysqli("localhost", "root", "", "db_jadwal_ti");

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Gagal konek ke MySQL: " . $conn->connect_error]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$action = isset($data['action']) ? $data['action'] : '';

if ($action === "register") {
    $user = $conn->real_escape_string($data['username']);
    $pass = $conn->real_escape_string($data['password']);

    $cek = $conn->query("SELECT * FROM users WHERE username='$user'");
    if ($cek->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Username udah dipakai bos!"]);
    } else {
        $conn->query("INSERT INTO users (username, password) VALUES ('$user', '$pass')");
        echo json_encode(["status" => "success", "message" => "Akun berhasil dibuat!"]);
    }
}

elseif ($action === "login") {
    $user = $conn->real_escape_string($data['username']);
    $pass = $conn->real_escape_string($data['password']);

    $cek = $conn->query("SELECT * FROM users WHERE username='$user' AND password='$pass'");
    if ($cek->num_rows > 0) {
        echo json_encode(["status" => "success", "message" => "Login berhasil"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Username atau Password salah!"]);
    }
}

elseif ($action === "getJadwal") {
    $result = $conn->query("SELECT * FROM jadwal");
    $jadwalList = [];
    while($row = $result->fetch_assoc()) {
        $jadwalList[] = $row;
    }
    echo json_encode(["status" => "success", "data" => $jadwalList]);
}

elseif ($action === "addJadwal") {
    $id = $conn->real_escape_string($data['id']);
    $pengajar = $conn->real_escape_string($data['pengajar']);
    $kelas = $conn->real_escape_string($data['kelas']);
    $ruangan = $conn->real_escape_string($data['ruangan']);
    $jamMulai = $conn->real_escape_string($data['jamMulai']);
    $jamSelesai = $conn->real_escape_string($data['jamSelesai']);
    $sksText = $conn->real_escape_string($data['sksText']);

    $sql = "INSERT INTO jadwal (id, pengajar, kelas, ruangan, jamMulai, jamSelesai, sksText) 
            VALUES ('$id', '$pengajar', '$kelas', '$ruangan', '$jamMulai', '$jamSelesai', '$sksText')";
    
    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "Jadwal ditambahkan"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal input: " . $conn->error]);
    }
}

elseif ($action === "deleteJadwal") {
    $id = $conn->real_escape_string($data['id']);
    
    if ($conn->query("DELETE FROM jadwal WHERE id='$id'")) {
        echo json_encode(["status" => "success", "message" => "Jadwal dihapus"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal hapus: " . $conn->error]);
    }
}

$conn->close();
?>