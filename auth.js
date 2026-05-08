const API_URL = "https://backend-fikri.ct.ws//api.php";

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('themeTI') || 'dark';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
});

async function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (username.length < 3 || password.length < 3) {
        alert('Username dan Password minimal 3 karakter ya!');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            redirect: "follow",
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action: "register", username, password })
        });
        const result = await response.json();

        if (result.status === "success") {
            alert('Mantap! Akun berhasil dibuat di database. Silakan login.');
            window.location.href = 'login.html';
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert("Gagal connect ke database. Pastikan XAMPP dan Internet jalan.");
        console.error(e);
    }
}

async function handleRealLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    try {
        const response = await fetch(API_URL, {
            redirect: "follow",
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action: "login", username, password })
        });
        const result = await response.json();

        if (result.status === "success") {
            localStorage.setItem('currentUserTI', username);
            window.location.href = 'dashboard.html'; 
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert("Error login. Pastikan URL API sudah betul.");
        console.error(e);
    }
}
