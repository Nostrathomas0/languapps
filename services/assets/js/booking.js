// booking.js - Calendar booking system for languapps.com/services
import { auth, onAuthStateChanged } from '/assets/js/firebaseInit.js';

(function() {
    'use strict';

    // ============================================================================
    // 1. FIREBASE AUTHENTICATION
    // ============================================================================

    let currentUser = null;

    /**
     * Get JWT from cookie (same function from firebaseAuth.js)
     */
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    /**
     * Update UI based on auth state
     */
    function updateAuthUI(user) {
        const userStatus = document.getElementById('user-status');
        const calendarContainer = document.getElementById('calendar-container');
        
        if (!user) {
            userStatus.innerHTML = '🔒 Please <a href="https://languapps.com/?auth-modal">log in</a> to book lessons';
            userStatus.style.color = '#e74c3c';
            calendarContainer.style.display = 'none';
            currentUser = null;
        } else {
            userStatus.innerHTML = `✅ Logged in as ${user.email}`;
            userStatus.style.color = '#27ae60';
            calendarContainer.style.display = 'block';
            currentUser = user;
            
            // Render calendar once auth is confirmed
            renderCalendar();
        }
    }

    /**
     * Initialize Firebase auth listener
     */
    function initAuth() {
        console.log('🔍 [Booking] Initializing Firebase auth listener...');
        
        onAuthStateChanged(auth, (user) => {
            console.log('🔍 [Booking] Auth state changed:', user ? user.email : 'signed out');
            updateAuthUI(user);
        });
    }

    // ============================================================================
    // 2. CALENDAR DISPLAY
    // ============================================================================

    /**
     * Available time slots (you can modify this)
     */
    const availableSlots = {
        'Monday': ['09:00', '11:00', '11:30', '15:00', '16:00'],
        'Tuesday': ['09:00', '11:00', '11:30', '15:00', '16:00'],
        'Wednesday': [ '12:00', '15:30', '16:30'],
        'Thursday': ['09:00', '11:00', '11:30', '15:00'],
        'Friday': ['09:00', '11:00', '11:30',  '15:00']
    };

    /**
     * Render calendar
     */
    function renderCalendar() {
        const container = document.getElementById('calendar-container');
        
        let html = '<div class="calendar-grid">';
        
        for (const [day, slots] of Object.entries(availableSlots)) {
            html += `
                <div class="day-column">
                    <h4>${day}</h4>
                    <div class="slots">
            `;
            
            slots.forEach(time => {
                html += `
                    <button class="time-slot" data-day="${day}" data-time="${time}">
                        ${time}
                    </button>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        container.innerHTML = html;
        
        // Add click handlers
        document.querySelectorAll('.time-slot').forEach(button => {
            button.addEventListener('click', handleSlotClick);
        });
    }

    // ============================================================================
    // 3. SLOT SELECTION
    // ============================================================================

    let selectedSlots = [];

    /**
     * Handle slot click
     */
    function handleSlotClick(event) {
        const button = event.target;
        const day = button.dataset.day;
        const time = button.dataset.time;
        const slotKey = `${day}-${time}`;
        
        // Toggle selection
        if (button.classList.contains('selected')) {
            // Deselect
            button.classList.remove('selected');
            selectedSlots = selectedSlots.filter(s => s !== slotKey);
        } else {
            // Select (max 2 slots)
            if (selectedSlots.length >= 2) {
                alert('You can only select 2 time slots. Please deselect one first.');
                return;
            }
            
            button.classList.add('selected');
            selectedSlots.push(slotKey);
        }
        
        // Show/hide booking form
        const bookingForm = document.getElementById('booking-form');
        if (selectedSlots.length === 2) {
            bookingForm.style.display = 'block';
            updateBookingSummary();
        } else {
            bookingForm.style.display = 'none';
        }
    }

    /**
     * Update booking summary
     */
    function updateBookingSummary() {
        const slotSelection = document.getElementById('slot-selection');
        
        let html = '<ul>';
        selectedSlots.forEach(slot => {
            const [day, time] = slot.split('-');
            html += `<li><strong>${day}</strong> at ${time}</li>`;
        });
        html += '</ul>';
        
        slotSelection.innerHTML = html;
    }

    // ============================================================================
    // 4. STRIPE CHECKOUT
    // ============================================================================

    /**
     * Confirm booking and redirect to Stripe
     */
    function confirmBooking() {
        if (!currentUser) {
            alert('Please log in to continue');
            window.location.href = 'https://languapps.com/?auth-modal';
            return;
        }
        
        if (selectedSlots.length !== 2) {
            alert('Please select exactly 2 time slots');
            return;
        }
        
        // Get JWT from cookie for metadata
        const jwtToken = getCookie('JWT');
        
        // Prepare metadata for Stripe
        const bookingData = {
            user_email: currentUser.email,
            user_id: currentUser.uid,
            slots: selectedSlots,
            booked_at: new Date().toISOString(),
            jwt: jwtToken ? jwtToken.substring(0, 50) + '...' : 'none'
        };
        
        // Encode booking data for URL
        const encodedData = encodeURIComponent(JSON.stringify(bookingData));
        
        const stripeLink = 'https://buy.stripe.com/7sY4gsg8C2u0aMqcGpefC04';
        
        // Redirect to Stripe with metadata
        window.location.href = `${stripeLink}?client_reference_id=${encodedData}`;
    }

    // ============================================================================
    // 5. INITIALIZATION
    // ============================================================================

    /**
     * Initialize booking system
     */
    function init() {
        console.log('🔍 [Booking] Booking system initializing...');
        
        // Initialize Firebase auth listener
        initAuth();
        
        // Add confirm button handler
        const confirmButton = document.getElementById('confirm-booking');
        if (confirmButton) {
            confirmButton.addEventListener('click', confirmBooking);
        }
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();