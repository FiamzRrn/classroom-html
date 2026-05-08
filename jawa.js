const API_URL = "http://backend-fikri.ct.ws/api.php";

let dataJadwal = [];
let idleTimer;
const glow = document.getElementById('cursor-glow');

window.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = localStorage.getItem('themeTI') || 'dark';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    const isDark = document.documentElement.classList.contains('dark');
    const sun = document.getElementById('sun-icon');
    const moon = document.getElementById('moon-icon');
    if(sun) sun.style.display = isDark ? 'none' : 'block';
    if(moon) moon.style.display = isDark ? 'block' : 'none';

    cekLoginStatus(); 
    
    if(document.getElementById('daftarJadwal')) {
        await muatDataDariSpreadsheet();
    }
});

async function muatDataDariSpreadsheet() {
    try {
        const response = await fetch(API_URL, {
            redirect: "follow",
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action: "getJadwal" })
        });
        const result = await response.json();
        if (result.status === "success") {
            dataJadwal = result.data;
            renderSemuaJadwal();
        }
    } catch (err) {
        showToast("Gagal tarik jadual dari database", "error");
        console.error(err);
    }
}

function cekLoginStatus() {
    const savedName = localStorage.getItem('currentUserTI');
    if (!savedName) {
        window.location.href = 'login.html';
    } else {
        const displayName = document.getElementById('display-name');
        const initials = document.getElementById('initials');
        if(displayName) displayName.innerText = savedName;
        if(initials) initials.innerText = savedName.charAt(0).toUpperCase();
    }
}

function handleLogout() {
    localStorage.removeItem('currentUserTI');
    window.location.href = 'login.html';
}

function toggleProfile() {
    const info = document.getElementById('profile-info');
    if(info) info.style.display = (info.style.display === 'block') ? 'none' : 'block';
}

function renderSemuaJadwal() {
    const container = document.getElementById('daftarJadwal');
    if(!container) return; 

    Array.from(container.children).forEach(child => {
        if (child.id !== 'emptyState') child.remove();
    });
    dataJadwal.forEach(jadwal => buatElemenJadwal(jadwal));
    updateJadwalCount();
}

function buatElemenJadwal(jadwal) {
    const container = document.getElementById('daftarJadwal');
    if(!container) return;

    const emptyState = document.getElementById('emptyState');
    if(emptyState) emptyState.style.display = 'none';

    const div = document.createElement('div');
    div.id = `jadwal-${jadwal.id}`;
    div.className = "jadwal-card fade-in mb-3";
    
    div.innerHTML = `
        <div style="flex: 1; padding-right: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div class="jadwal-ruang-wrap">
                    <span class="ruang-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"></path></svg>
                    </span>
                    <p class="ruang-title mb-0">${jadwal.ruangan}</p>
                </div>
                <div class="waktu-badge">
                    ${jadwal.jamMulai} - ${jadwal.jamSelesai} <br> 
                    <span class="waktu-sks">(${jadwal.sksText})</span>
                </div>
            </div>
            <p class="jadwal-matkul mb-1">${jadwal.kelas}</p>
            <div class="jadwal-dosen">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                <p class="mb-0">${jadwal.pengajar}</p>
            </div>
        </div>
        <button onclick="hapusJadwal('${jadwal.id}')" class="btn-delete" title="Hapus Jadwal">
            <svg style="width:20px;height:20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
    `;
    
    if (emptyState && emptyState.nextSibling) {
        container.insertBefore(div, emptyState.nextSibling);
    } else {
        container.appendChild(div);
    }
}

async function tambahJadwal() {
    const pengajar = document.getElementById('selectedDosen').innerText;
    const kelas = document.getElementById('kelas').value.trim();
    const ruangan = document.getElementById('selectedOption').innerText;
    const jamMulai = document.getElementById('selectedJam').innerText; 
    const sksText = document.getElementById('selectedSks').innerText;
    const sksValue = parseInt(document.getElementById('selectedSks').getAttribute('data-sks')) || 0;

    if (pengajar === "Pilih Dosen" || !kelas || ruangan === "Pilih Ruang" || jamMulai === "Pilih Jam" || sksValue === 0) {
        showToast("Isi semua data dulu bos!", "error");
        triggerShake(); return; 
    }

    let startMins = timeToMins(jamMulai);
    let endMins = startMins + (sksValue * 50);
    let jamSelesai = minsToTime(endMins);

    const bentrokRuang = dataJadwal.find(j => {
        if (j.ruangan !== ruangan) return false;
        let jStart = timeToMins(j.jamMulai); let jEnd = timeToMins(j.jamSelesai);
        return (startMins < jEnd) && (endMins > jStart);
    });

    if (bentrokRuang) {
        showToast(`Waduh bentrok! ${ruangan} sedang dipakai ${bentrokRuang.pengajar}`, "error");
        triggerShake(); return;
    }

    const id = Date.now().toString();
    const jadwalBaru = { id, pengajar, kelas, ruangan, jamMulai, jamSelesai, sksText };
    
    try {
        const response = await fetch(API_URL, {
            redirect: "follow",
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "addJadwal", ...jadwalBaru })
        });
        const result = await response.json();
        
        if (result.status === "success") {
            dataJadwal.push(jadwalBaru);
            buatElemenJadwal(jadwalBaru);
            resetForm();
            updateJadwalCount();
            showToast("Jadwal berhasil disimpan ke Database!", "success");
        }
    } catch (err) {
        showToast("Gagal disimpan ke server", "error");
        console.error(err);
    }
}

async function hapusJadwal(id) {
    if (!confirm("Yakin mau menghapus jadwal ini?")) return;

    try {
        const response = await fetch(API_URL, {
            redirect: "follow",
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "deleteJadwal", id: id })
        });
        const result = await response.json();
        
        if (result.status === "success") {
            const elemen = document.getElementById(`jadwal-${id}`);
            if (elemen) {
                elemen.style.opacity = '0';
                setTimeout(() => {
                    elemen.remove();
                    dataJadwal = dataJadwal.filter(j => j.id !== id);
                    updateJadwalCount();
                    showToast("Jadwal dihapus dari database.", "default");
                }, 300);
            }
        }
    } catch (err) {
        showToast("Gagal menghapus data", "error");
        console.error(err);
    }
}

function timeToMins(timeStr) {
    if(!timeStr) return 0;
    let parts = timeStr.split('.');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function minsToTime(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    return (h < 10 ? '0' + h : h) + '.' + (m < 10 ? '0' + m : m);
}

window.addEventListener('mousemove', (e) => {
    if(glow) glow.classList.remove('cursor-idle');
    requestAnimationFrame(() => { 
        if(glow) glow.style.left = e.clientX + 'px'; 
        if(glow) glow.style.top = e.clientY + 'px'; 
    });
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if(glow) glow.classList.add('cursor-idle'); }, 2000);
});

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    
    localStorage.setItem('themeTI', isDark ? 'dark' : 'light');
    
    const sun = document.getElementById('sun-icon');
    const moon = document.getElementById('moon-icon');
    if(sun) sun.style.display = isDark ? 'none' : 'block';
    if(moon) moon.style.display = isDark ? 'block' : 'none';
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
    document.querySelectorAll('.arrow-icon').forEach(s => s.style.transform = 'rotate(0deg)');
    const profile = document.getElementById('profile-info');
    if(profile) profile.style.display = 'none';
}

function toggleMenu(menuId, arrowId) {
    const menu = document.getElementById(menuId);
    const arrow = document.getElementById(arrowId);
    if(!menu || !arrow) return;
    
    const isShowing = menu.classList.contains('show');
    closeAllDropdowns();
    if(!isShowing) { menu.classList.add('show'); arrow.style.transform = 'rotate(180deg)'; }
}

function toggleDropdown() { toggleMenu('dropdownMenu', 'arrow'); }
function toggleDosenDropdown() { toggleMenu('dosenDropdown', 'dosenArrow'); }
function toggleJamDropdown() { toggleMenu('jamDropdown', 'jamArrow'); }
function toggleSksDropdown() { toggleMenu('sksDropdown', 'sksArrow'); }

function selectItem(spanId, val, menuId, extraAttr = null, extraVal = null) {
    const el = document.getElementById(spanId);
    if(!el) return;
    el.innerText = val;
    el.style.color = "var(--text-main)"; 
    if(extraAttr) el.setAttribute(extraAttr, extraVal);
    closeAllDropdowns();
}

function selectOption(val) { selectItem('selectedOption', val); }
function selectDosen(val) { selectItem('selectedDosen', val); }
function selectJam(val) { selectItem('selectedJam', val); }
function selectSks(textVal, numVal) { selectItem('selectedSks', textVal, null, 'data-sks', numVal); }

function triggerShake() {
    ['jamSelect', 'customSelect', 'dosenSelect', 'sksSelect', 'kelas'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.classList.add('animate-shake'); setTimeout(() => el.classList.remove('animate-shake'), 500); }
    });
}

function resetForm() {
    document.getElementById('selectedDosen').innerText = "Pilih Dosen";
    document.getElementById('selectedDosen').style.color = "";
    document.getElementById('kelas').value = "";
    document.getElementById('selectedSks').innerText = "Pilih SKS";
    document.getElementById('selectedSks').setAttribute('data-sks', '0');
    document.getElementById('selectedSks').style.color = "";
    document.getElementById('selectedJam').innerText = "Pilih Jam";
    document.getElementById('selectedJam').style.color = "";
    document.getElementById('selectedOption').innerText = "Pilih Ruang";
    document.getElementById('selectedOption').style.color = "";
}

function updateJadwalCount() {
    const countEl = document.getElementById('jadwalCount');
    const emptyState = document.getElementById('emptyState');
    
    if(countEl) countEl.innerText = dataJadwal.length;
    if(emptyState) emptyState.style.display = dataJadwal.length <= 0 ? 'block' : 'none';
}

function showToast(message, type = 'default') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    
    let icon = '';
    if(type === 'success') {
        toast.className = 'toast toast-success fade-in';
        icon = `<svg style="width:24px;height:24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else {
        toast.className = 'toast toast-error fade-in';
        icon = `<svg style="width:24px;height:24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
}

window.onclick = function(e) {
    if (!e.target.closest('.glass-input') && !e.target.closest('.circle-avatar') && !e.target.closest('#profile-info')) {
        closeAllDropdowns();
    }
}
