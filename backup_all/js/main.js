// ===== ARMOR Main JS =====
// Security: Removed pseudo-security (F12 blocking, right-click disable)
// These provide no real security and only annoy legitimate users

const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
}); 

function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

const bgImages = ['/images/armor1.png', '/images/armor2.png', '/images/armor3.png', '/images/armor4.png'];
let currentSlide = 0;
let slideInterval;

function initSlideshow() {
    const heroBg = document.getElementById('heroBg');
    const bgBtns = document.querySelectorAll('.bg-btn');
    
    if (!heroBg) return;

    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
    
    heroBg.classList.add('slide-0');
    bgBtns[0]?.classList.add('active');
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % bgImages.length;
        heroBg.className = 'hero-bg slide-' + currentSlide;
        bgBtns.forEach((btn, i) => btn.classList.toggle('active', i === currentSlide));
    }
    
    slideInterval = setInterval(nextSlide, 5000);
    
    bgBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            clearInterval(slideInterval);
            currentSlide = index;
            heroBg.className = 'hero-bg slide-' + currentSlide;
            bgBtns.forEach((b, i) => b.classList.toggle('active', i === currentSlide));
            slideInterval = setInterval(nextSlide, 5000);
        });
    });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSlideshow();
} else {
    document.addEventListener('DOMContentLoaded', initSlideshow);
}
