let galleryItems = [];
let currentImageIndex = 0;

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    
    if (galleryItems.length === 0) {
        grid.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">Brak zdjęć w galerii. Dodaj zdjęcia jako admin.</p>';
        return;
    }
    
    grid.innerHTML = galleryItems.map((item, i) => {
        return '<div class="gallery-item fade-in" onclick="openLightbox(' + i + ')">' +
            '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title || 'Zdjęcie') + '">' +
            '<div class="gallery-overlay"><span>' + escapeHtml(item.title || ('Zdjęcie ' + (i + 1))) + '</span></div>' +
            '</div>';
    }).join('');
    
    observeElements();
}

function loadGallery() {
    fetch('/api/gallery')
        .then(res => {
            if (!res.ok) throw new Error('Błąd pobierania galerii');
            return res.json();
        })
        .then(data => {
            galleryItems = Array.isArray(data) ? data : [];
            renderGallery();
        })
        .catch(err => {
            console.error('Błąd ładowania galerii:', err);
            galleryItems = [];
            renderGallery();
        });
}

function openLightbox(index) {
    if (!galleryItems.length || index < 0 || index >= galleryItems.length) return;
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    
    const item = galleryItems[index];
    
    lightboxImg.src = item.image;
    lightboxImg.alt = item.title || 'Zdjęcie';
    lightbox.style.display = 'flex';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
}

function nextImage() {
    if (!galleryItems.length) return;
    currentImageIndex = (currentImageIndex + 1) % galleryItems.length;
    openLightbox(currentImageIndex);
}

function prevImage() {
    if (!galleryItems.length) return;
    currentImageIndex = (currentImageIndex - 1 + galleryItems.length) % galleryItems.length;
    openLightbox(currentImageIndex);
}

function filterGallery(category) {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    
    const filteredItems = category === 'all' 
        ? galleryItems 
        : galleryItems.filter(item => item.category === category);
    
    if (filteredItems.length === 0) {
        grid.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">Brak zdjęć w tej kategorii.</p>';
        return;
    }
    
    grid.innerHTML = filteredItems.map((item, i) => {
        return '<div class="gallery-item fade-in" onclick="openLightbox(' + i + ')">' +
            '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title || 'Zdjęcie') + '">' +
            '<div class="gallery-overlay"><span>' + escapeHtml(item.title || ('Zdjęcie ' + (i + 1))) + '</span></div>' +
            '</div>';
    }).join('');
    
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-filter="' + category + '"]').classList.add('active');
    
    observeElements();
}

function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', function() {
    loadGallery();
    
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        const lb = document.getElementById('lightbox');
        if (lb && lb.style.display === 'flex') {
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'Escape') closeLightbox();
        }
    });
});
