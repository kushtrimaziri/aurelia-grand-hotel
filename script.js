/* ========================================================
   AURELIA GRAND HOTEL — INTERACTION LAYER
   Built on top of the original project without removing
   the original sections or visual structure.
======================================================== */

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* ---------------- Navigation ---------------- */
const menuToggle = $('.menu-toggle');
const navLinks = $('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });

    $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    }));
}

/* ---------------- Booking modal ---------------- */
const bookingModal = $('#booking-modal');
const bookingClose = $('#booking-close');
const modalForm = $('#booking-form');
const modalMessage = $('#booking-message');
const modalRoom = $('#room-type');
const modalCheckIn = $('#check-in');
const modalCheckOut = $('#check-out');
const modalGuests = $('#guests');
const modalName = $('#guest-name');
const modalEmail = $('#guest-email');
const nightsEl = $('#booking-nights');
const totalEl = $('#booking-total');

const roomPrices = {
    'Deluxe Room': 140,
    'Executive Room': 190,
    'Presidential Suite': 350
};

function todayISO() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
}

function setDateLimits() {
    const today = todayISO();
    [modalCheckIn, modalCheckOut].forEach(input => { if (input) input.min = today; });
}

function calculateStay() {
    if (!modalCheckIn || !modalCheckOut) return { nights: 0, total: 0 };
    const start = new Date(`${modalCheckIn.value}T00:00:00`);
    const end = new Date(`${modalCheckOut.value}T00:00:00`);
    const nights = modalCheckIn.value && modalCheckOut.value && end > start
        ? Math.round((end - start) / 86400000) : 0;
    const total = nights * (roomPrices[modalRoom?.value] || 0);
    if (nightsEl) nightsEl.textContent = `${nights} night${nights === 1 ? '' : 's'}`;
    if (totalEl) totalEl.textContent = `€${total.toLocaleString()}`;
    return { nights, total };
}

function clearMessage() {
    if (!modalMessage) return;
    modalMessage.textContent = '';
    modalMessage.classList.remove('success');
}

function openBookingModal(room = '') {
    if (!bookingModal) return;
    bookingModal.classList.add('active');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setDateLimits();
    clearMessage();
    if (room && modalRoom) modalRoom.value = room;
    calculateStay();
    setTimeout(() => (modalName || modalCheckIn)?.focus(), 100);
}

function closeBookingModal() {
    if (!bookingModal) return;
    bookingModal.classList.remove('active');
    bookingModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

$$('a[href="#booking"], .room-book-btn, .nav-button').forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault();
        openBookingModal(button.dataset.room || '');
    });
});

bookingClose?.addEventListener('click', closeBookingModal);
bookingModal?.addEventListener('click', e => {
    if (e.target === bookingModal) closeBookingModal();
});

[modalCheckIn, modalCheckOut, modalRoom].forEach(el => el?.addEventListener('input', calculateStay));

function markInvalid(input, message) {
    const group = input?.closest('.form-group');
    if (!group) return;
    group.classList.add('invalid');
    let error = group.querySelector('.form-error');
    if (!error) {
        error = document.createElement('div');
        error.className = 'form-error';
        group.appendChild(error);
    }
    error.textContent = message;
}

function clearInvalid(input) {
    const group = input?.closest('.form-group');
    if (!group) return;
    group.classList.remove('invalid');
    group.querySelector('.form-error')?.remove();
}

function validateModalBooking() {
    const fields = [modalName, modalEmail, modalCheckIn, modalCheckOut, modalGuests, modalRoom];
    fields.forEach(clearInvalid);
    let valid = true;

    if (!modalName?.value.trim()) { markInvalid(modalName, 'Please enter your full name.'); valid = false; }
    if (!modalEmail?.value.trim()) { markInvalid(modalEmail, 'Please enter your email.'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalEmail.value.trim())) { markInvalid(modalEmail, 'Please enter a valid email address.'); valid = false; }
    if (!modalCheckIn?.value) { markInvalid(modalCheckIn, 'Please choose a check-in date.'); valid = false; }
    if (!modalCheckOut?.value) { markInvalid(modalCheckOut, 'Please choose a check-out date.'); valid = false; }

    const stay = calculateStay();
    if (modalCheckIn?.value && modalCheckOut?.value && stay.nights <= 0) {
        markInvalid(modalCheckOut, 'Check-out must be after check-in.'); valid = false;
    }
    if (!modalGuests?.value) { markInvalid(modalGuests, 'Please select the number of guests.'); valid = false; }
    if (!modalRoom?.value) { markInvalid(modalRoom, 'Please select a room.'); valid = false; }
    return valid;
}

modalForm?.addEventListener('submit', event => {
    event.preventDefault();
    event.stopPropagation();
    clearMessage();

    if (!validateModalBooking()) {
        if (modalMessage) modalMessage.textContent = 'Please review the highlighted fields.';
        return;
    }

    const stay = calculateStay();
    if (modalMessage) {
        modalMessage.innerHTML = `Thank you, <strong>${escapeHTML(modalName.value.trim())}</strong>. Your request for the <strong>${escapeHTML(modalRoom.value)}</strong> has been received — ${stay.nights} night${stay.nights === 1 ? '' : 's'}, estimated at <strong>€${stay.total.toLocaleString()}</strong>. We will contact you at ${escapeHTML(modalEmail.value.trim())}.`;
        modalMessage.classList.add('success');
    }
});

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

/* ---------------- Original page booking form, upgraded ---------------- */
const pageForm = $('#page-booking-form');
if (pageForm) {
    const ids = ['page-check-in','page-check-out'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.min = todayISO(); });
    pageForm.addEventListener('submit', event => {
        event.preventDefault();
        const message = $('#page-booking-message');
        const name = $('#page-guest-name')?.value.trim();
        const email = $('#page-guest-email')?.value.trim();
        const checkIn = $('#page-check-in')?.value;
        const checkOut = $('#page-check-out')?.value;
        const guests = $('#page-guests')?.value;
        const room = $('#page-room-type')?.value;
        if (!name || !email || !checkIn || !checkOut || !guests || !room || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || new Date(checkOut) <= new Date(checkIn)) {
            if (message) message.textContent = 'Please complete the form with a valid email and valid stay dates.';
            return;
        }
        if (message) {
            const nights = Math.round((new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`)) / 86400000);
            message.textContent = `Thank you, ${name}. Your ${room} request for ${nights} night${nights === 1 ? '' : 's'} has been received.`;
            message.classList.add('success');
        }
    });
}

/* ---------------- Testimonials ---------------- */
const testimonialText = $('.testimonial-text');
const testimonialAuthor = $('.testimonial-author');
const testimonials = [
    ['“From the moment we arrived, everything felt effortless. Beautiful rooms, incredible service, and an unforgettable stay.”','— Sofia M.'],
    ['“The atmosphere was elegant without ever feeling cold. The concierge made our entire weekend effortless.”','— Daniel R.'],
    ['“Our suite was beautiful, breakfast was excellent, and the rooftop view at sunset was unforgettable.”','— Elena & Marco'],
    ['“A calm, refined hotel in the middle of Florence. We would happily stay here again.”','— James T.']
];
let testimonialIndex = 0;
function showTestimonial(index) {
    testimonialIndex = (index + testimonials.length) % testimonials.length;
    if (!testimonialText || !testimonialAuthor) return;
    testimonialText.style.opacity = '0';
    setTimeout(() => {
        testimonialText.textContent = testimonials[testimonialIndex][0];
        testimonialAuthor.textContent = testimonials[testimonialIndex][1];
        testimonialText.style.opacity = '1';
    }, 160);
}
$('.testimonial-btn.prev')?.addEventListener('click', () => showTestimonial(testimonialIndex - 1));
$('.testimonial-btn.next')?.addEventListener('click', () => showTestimonial(testimonialIndex + 1));
setInterval(() => showTestimonial(testimonialIndex + 1), 7000);

/* ---------------- Gallery lightbox ---------------- */
const galleryItems = $$('.gallery-item');
const lightbox = $('#lightbox');
const lightboxImage = $('#lightbox-image');
const lightboxCaption = $('#lightbox-caption');
let galleryIndex = 0;
function openLightbox(index) {
    if (!galleryItems.length || !lightbox) return;
    galleryIndex = (index + galleryItems.length) % galleryItems.length;
    const image = galleryItems[galleryIndex];
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = image.alt;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
}
function closeLightbox() {
    lightbox?.classList.remove('active');
    lightbox?.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
}
galleryItems.forEach((image, index) => image.addEventListener('click', () => openLightbox(index)));
$('#lightbox-close')?.addEventListener('click', closeLightbox);
$('#lightbox-prev')?.addEventListener('click', () => openLightbox(galleryIndex - 1));
$('#lightbox-next')?.addEventListener('click', () => openLightbox(galleryIndex + 1));
lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

/* ---------------- FAQ ---------------- */
$$('.faq-item').forEach(item => item.addEventListener('click', () => {
    const open = item.classList.contains('open');
    $$('.faq-item.open').forEach(other => other.classList.remove('open'));
    if (!open) item.classList.add('open');
}));

/* ---------------- Scroll effects ---------------- */
const progress = $('#scroll-progress');
const backTop = $('#back-to-top');
function updateScrollUI() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    backTop?.classList.toggle('show', window.scrollY > 550);
}
window.addEventListener('scroll', updateScrollUI, { passive:true });
updateScrollUI();
backTop?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

/* ---------------- Scroll reveal ---------------- */
const revealTargets = $$('.section-heading, .about-image, .about-content, .room-card, .amenity, .gallery-item, .testimonial-container, .booking-container, .contact-container, .faq-list');
revealTargets.forEach(el => el.classList.add('reveal-ready'));
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold:.12 });
    revealTargets.forEach(el => observer.observe(el));
} else revealTargets.forEach(el => el.classList.add('revealed'));

/* ---------------- Animated stats ---------------- */
const counters = $$('[data-count]');
if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = Number(el.dataset.count);
            let current = 0;
            const step = Math.max(1, Math.ceil(target / 35));
            const tick = () => {
                current = Math.min(target, current + step);
                el.textContent = current + (target === 25 ? '+' : '');
                if (current < target) requestAnimationFrame(tick);
            };
            tick();
            counterObserver.unobserve(el);
        });
    }, { threshold:.6 });
    counters.forEach(el => counterObserver.observe(el));
}

/* ---------------- Florence live clock ---------------- */
const clock = $('#florence-time');
function updateClock() {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone:'Europe/Rome', hour:'2-digit', minute:'2-digit', second:'2-digit'
    }).format(new Date());
}
updateClock();
setInterval(updateClock, 1000);

/* ---------------- Keyboard accessibility ---------------- */
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeBookingModal();
        closeLightbox();
        navLinks?.classList.remove('active');
    }
    if (lightbox?.classList.contains('active')) {
        if (event.key === 'ArrowLeft') openLightbox(galleryIndex - 1);
        if (event.key === 'ArrowRight') openLightbox(galleryIndex + 1);
    }
});

setDateLimits();
