
// Security: HTML escaping function to prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function safeImageSrc(src) {
    const s = (src === null || src === undefined) ? '' : String(src).trim();
    if (!s) return '';

    // Allow only http(s) and data:image/* for images
    if (/^https?:\/\/[^\s]+$/i.test(s)) return s;
    if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/i.test(s)) return s;

    return '';
}

// Validation functions
function isValidIP(ip) {
    const ipv4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return ipv4.test(ip);
}

function isValidDiscordId(id) {
    return /^\d{17,20}$/.test(id);
}

window.galleryImages = [];
window.pendingImages = [];

async function loadGallery() {
    try {
        const res = await fetch('/api/gallery');
        if (!res.ok) throw new Error('Błąd pobierania galerii');
        const data = await res.json();
        galleryImages = Array.isArray(data) ? data : [];
        renderAdminGallery();
    } catch (err) {
        console.error('Błąd ładowania galerii:', err);
        showNotification('Błąd ładowania galerii', 'error');
    }
}

function renderAdminGallery() {
    const container = document.getElementById('adminGallery');
    if (!container) return;
    
    const allImages = [...galleryImages, ...pendingImages];
    
    if (allImages.length === 0) {
        container.innerHTML = '<p style="color: #888; grid-column: 1/-1; text-align: center;">Brak zdjęć w galerii</p>';
        return;
    }
    
    container.innerHTML = '';
    
    allImages.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'gallery-admin-item';
        
        const imgEl = document.createElement('img');
        imgEl.src = safeImageSrc((img && typeof img === 'object') ? img.image : img) || '';
        imgEl.alt = `Zdjęcie ${i + 1}`;
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.title = 'Edytuj';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => {
            const rawSrc = (img && typeof img === 'object') ? img.image : img;
            openImageEditor(safeImageSrc(rawSrc) || '', (img && typeof img === 'object' ? (img.title || '') : ''));
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener('click', () => deleteImage(i));
        
        div.appendChild(imgEl);
        div.appendChild(editBtn);
        div.appendChild(deleteBtn);
        container.appendChild(div);
    });
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            pendingImages.push({
                image: e.target.result,
                title: file.name.replace(/\.[^/.]+$/, '')
            });
            renderAdminGallery();
        };
        reader.readAsDataURL(file);
    });
}

async function deleteImage(index) {
    if (index < galleryImages.length) {
        const img = galleryImages[index];
        if (confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
            try {
                const res = await fetch('/api/gallery/' + img.id, { method: 'DELETE' });
                if (!res.ok) throw new Error('Błąd usuwania zdjęcia');
                galleryImages.splice(index, 1);
                renderAdminGallery();
                showNotification('Zdjęcie usunięte', 'success');
            } catch (err) {
                showNotification('Błąd usuwania zdjęcia', 'error');
            }
        }
    } else {
        pendingImages.splice(index - galleryImages.length, 1);
        renderAdminGallery();
    }
}

async function saveGallery() {
    let success = 0;
    let failed = 0;

    for (const img of pendingImages) {
        try {
            const res = await fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(img)
            });

            if (!res.ok) throw new Error('Błąd zapisu');
            success++;
        } catch (err) {
            failed++;
            console.error('Błąd zapisywania zdjęcia:', err);
        }
    }

    if (failed === 0) {
        pendingImages = [];
        await loadGallery();
        showNotification(`Zapisano ${success} zdjęć`, 'success');
    } else {
        showNotification(`Zapisano: ${success}, błędy: ${failed}`, 'warning');
    }
}

async function clearGallery() {
    if (confirm('Czy na pewno chcesz usunąć wszystkie zdjęcia z galerii?')) {
        let failed = 0;
        
        for (const img of galleryImages) {
            try {
                const res = await fetch('/api/gallery/' + img.id, { method: 'DELETE' });
                if (!res.ok) throw new Error('Błąd usuwania');
            } catch (err) {
                failed++;
                console.error('Błąd usuwania zdjęcia:', err);
            }
        }
        
        if (failed === 0) {
            galleryImages = [];
            pendingImages = [];
            renderAdminGallery();
            showNotification('Wszystkie zdjęcia usunięte', 'success');
        } else {
            showNotification(`Usunięto ${galleryImages.length - failed} zdjęć, błędy: ${failed}`, 'warning');
            await loadGallery();
        }
    }
}

if (document.getElementById('adminGallery')) {
    loadGallery();
}

async function loadBans() {
    const container = document.getElementById('bansContainer');
    if (!container) return;
    
    try {
        const res = await fetch('/api/bans');
        if (!res.ok) throw new Error('Błąd pobierania banów');
        const bans = await res.json();
        
        // Safe array handling
        const bannedIPs = Array.isArray(bans.ip) ? bans.ip : [];
        const bannedDiscordIDs = Array.isArray(bans.discord) ? bans.discord : [];
        
        let html = '';
        
        if (bannedIPs.length > 0) {
            html += '<h5 style="color: #00d4ff; margin: 10px 0;">Zablokowane adresy IP:</h5>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">';
            bannedIPs.forEach(ip => {
                const safeIp = escapeHtml(ip);
                html += `<div style="background: rgba(255,71,87,0.2); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #ff4757;">${safeIp}</span>
                    <button onclick="unbanIP('${safeIp}')" style="background: none; border: none; color: #00d4ff; cursor: pointer;"><i class="fas fa-unlock"></i></button>
                </div>`;
            });
            html += '</div>';
        }
        
        if (bannedDiscordIDs.length > 0) {
            html += '<h5 style="color: #00d4ff; margin: 10px 0;">Zablokowane konta Discord:</h5>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
            bannedDiscordIDs.forEach(discordId => {
                const safeId = escapeHtml(discordId);
                html += `<div style="background: rgba(255,71,87,0.2); padding: 8px 15px; border-radius: 5px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #ff4757;">${safeId}</span>
                    <button onclick="unbanDiscord('${safeId}')" style="background: none; border: none; color: #00d4ff; cursor: pointer;"><i class="fas fa-unlock"></i></button>
                </div>`;
            });
            html += '</div>';
        }
        
        if (!html) {
            html = '<p style="color: #888;">Brak aktywnych banów</p>';
        }
        
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p style="color: #ff4757;">Błąd ładowania banów</p>';
    }
}

async function banIP() {
    const input = document.getElementById('banIPInput');
    const ip = input.value.trim();
    
    if (!ip) {
        showNotification('Wpisz adres IP!', 'warning');
        return;
    }
    
    if (!isValidIP(ip)) {
        showNotification('Nieprawidłowy format adresu IP!', 'warning');
        return;
    }
    
    try {
        const res = await fetch('/api/bans/ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip })
        });
        if (!res.ok) throw new Error('Błąd banowania');
        const data = await res.json();
        showNotification(data.message, 'success');
        input.value = '';
        loadBans();
    } catch (err) {
        showNotification('Błąd podczas banowania IP', 'error');
    }
}

async function unbanIP(ip) {
    if (!confirm(`Czy na pewno odblokować IP ${ip}?`)) return;
    
    try {
        const res = await fetch('/api/bans/ip', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip })
        });
        if (!res.ok) throw new Error('Błąd odblokowywania');
        const data = await res.json();
        showNotification(data.message, 'success');
        loadBans();
    } catch (err) {
        showNotification('Błąd podczas odblokowywania IP', 'error');
    }
}

async function banDiscord() {
    const input = document.getElementById('banDiscordInput');
    const discordId = input.value.trim();
    
    if (!discordId) {
        showNotification('Wpisz Discord ID!', 'warning');
        return;
    }
    
    if (!isValidDiscordId(discordId)) {
        showNotification('Nieprawidłowy format Discord ID (musi być 17-20 cyfr)!', 'warning');
        return;
    }
    
    try {
        const res = await fetch('/api/bans/discord', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId })
        });
        if (!res.ok) throw new Error('Błąd banowania');
        const data = await res.json();
        showNotification(data.message, 'success');
        input.value = '';
        loadBans();
    } catch (err) {
        showNotification('Błąd podczas banowania Discord', 'error');
    }
}

async function unbanDiscord(discordId) {
    if (!confirm(`Czy na pewno odblokować Discord ID ${discordId}?`)) return;
    
    try {
        const res = await fetch('/api/bans/discord', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId })
        });
        if (!res.ok) throw new Error('Błąd odblokowywania');
        const data = await res.json();
        showNotification(data.message, 'success');
        loadBans();
    } catch (err) {
        showNotification('Błąd podczas odblokowywania Discord', 'error');
    }
}

if (document.getElementById('bansContainer')) {
    loadBans();
}

// Load logs
async function loadLogs() {
    const container = document.getElementById('logsContainer');
    if (!container) return;
    
    try {
        const res = await fetch('/api/logs');
        if (!res.ok) {
            throw new Error('Błąd API');
        }
        const data = await res.json();
        const logs = Array.isArray(data) ? data : [];
        
        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="no-orders"><i class="fas fa-history"></i> Brak logów</div>';
            return;
        }
        
        let html = '<div style="overflow-x: auto;"><table class="orders-table"><thead><tr><th>Data</th><th>Użytkownik</th><th>Discord ID</th><th>Avatar</th><th>Akcja</th></tr></thead><tbody>';
        
        logs.forEach(log => {
            // Safe date parsing
            const parsedDate = new Date(log.timestamp);
            const date = isNaN(parsedDate.getTime())
                ? 'Nieznana data'
                : parsedDate.toLocaleString('pl-PL');
            
            // Safe avatar URL
            const avatarUrl = log.avatar && log.discordId
                ? `https://cdn.discordapp.com/avatars/${log.discordId}/${log.avatar}.png`
                : '';
            
            const safeUsername = escapeHtml(log.username || 'Nieznany');
            const safeDiscordId = escapeHtml(log.discordId || '-');
            
            const actionBadge = log.action === 'login' ? '<span class="order-status nowe">Logowanie</span>' : 
                              log.action === 'test' ? '<span class="order-status" style="background: rgba(255,193,7,0.2); color: #ffc107;">Test</span>' :
                              log.action === 'admin_action' ? '<span class="order-status" style="background: rgba(0,255,136,0.2); color: #00ff88;">Akcja admina</span>' :
                              '<span class="order-status">' + escapeHtml(log.action) + '</span>';
            
            html += `<tr>
                <td>${escapeHtml(date)}</td>
                <td style="display: flex; align-items: center; gap: 10px;">
                    ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" style="width: 30px; height: 30px; border-radius: 50%;">` : '<i class="fas fa-user" style="color: #888;"></i>'}
                    <span>${safeUsername}</span>
                </td>
                <td>${safeDiscordId}</td>
                <td>${avatarUrl ? '<i class="fas fa-check" style="color: #00ff88;"></i>' : '<i class="fas fa-times" style="color: #ff4757;"></i>'}</td>
                <td>${actionBadge}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (err) {
        console.error('Błąd ładowania logów:', err);
        container.innerHTML = '<div class="no-orders">Błąd ładowania logów: ' + escapeHtml(err.message) + '</div>';
    }
}

async function addTestLog() {
    try {
        const res = await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'test',
                discordId: '123456789',
                username: 'TestAdmin',
                avatar: null,
                roles: ['admin']
            })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Błąd dodawania logu');
        }
        loadLogs();
        showNotification('Dodano testowy log!', 'success');
    } catch (err) {
        showNotification('Błąd dodawania logu: ' + err.message, 'error');
    }
}

async function clearLogs() {
    if (!confirm('Czy na pewno chcesz wyczyścić wszystkie logi?')) return;
    try {
        const res = await fetch('/api/logs', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Błąd czyszczenia');
        const data = await res.json();
        if (data.success) {
            loadLogs();
            showNotification('Wyczyszczono logi!', 'success');
        }
    } catch (err) {
        showNotification('Błąd czyszczenia logów!', 'error');
    }
}

if (document.getElementById('logsContainer')) {
    loadLogs();
}
