// --- 1. SERVICE WORKER & INITIALIZATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
    });
}

const appointmentForm = document.getElementById('appointment-form');
const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');
const fileInput = document.getElementById('tattoo-upload');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');

// Prevent past dates
if (dateInput) { 
    dateInput.min = new Date().toISOString().split("T")[0]; 
}

// --- 2. DOUBLE BOOKING: GRAY OUT & DISABLE TAKEN SLOTS ---
// This function checks the local database and grays out slots when a date is picked
dateInput?.addEventListener('change', function() {
    const selectedDate = this.value;
    const localAppts = JSON.parse(localStorage.getItem('appointments')) || [];
    
    // Reset all options to enabled/white first
    Array.from(timeSelect.options).forEach(option => {
        if (option.value !== "") {
            option.disabled = false;
            option.style.color = "white";
            option.style.backgroundColor = "";
            option.innerText = option.value; // Reset text
        }
    });

    // Check against existing bookings
    localAppts.forEach(appt => {
        if (appt.booking_date === selectedDate) {
            Array.from(timeSelect.options).forEach(option => {
                if (option.value === appt.booking_time) {
                    option.disabled = true; // Make unclickable
                    option.style.color = "#555"; // Gray out text
                    option.style.backgroundColor = "#111"; // Darken background
                    option.innerText = option.value + " (ALREADY BOOKED)";
                }
            });
        }
    });
});

// --- 3. IMAGE PREVIEW & DELETE LOGIC ---
fileInput?.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

window.clearImage = function () {
    fileInput.value = "";
    imagePreview.src = "";
    previewContainer.style.display = 'none';
};

// --- 4. BOOKING SUBMISSION LOGIC ---
appointmentForm?.addEventListener('submit', function (e) {
    e.preventDefault();

    const selectedDate = dateInput.value;
    const selectedTime = timeSelect.value;
    const userPhone = document.getElementById('phone').value;

    const localAppts = JSON.parse(localStorage.getItem('appointments')) || [];

    // Final conflict check before sending
    const isConflict = localAppts.some(appt =>
        appt.booking_date === selectedDate && appt.booking_time === selectedTime
    );

    if (isConflict) {
        alert(`⚠️ Slot Taken: Someone just booked ${selectedTime} on ${selectedDate}. Please choose another.`);
        return;
    }

    const apptData = {
        user_name: document.getElementById('name').value,
        user_phone: userPhone,
        booking_date: selectedDate,
        booking_time: selectedTime,
        description: document.getElementById('tattoo-description').value,
        id: Date.now() // Unique ID for deleting
    };

    // Send via EmailJS
    emailjs.send("service_m7ii4ac", "template_me1ljwe", apptData)
        .then(() => {
            alert("✅ Success! Your booking request has been sent.");
            
            // Save to local list to enable the gray-out feature
            localAppts.push(apptData);
            localStorage.setItem('appointments', JSON.stringify(localAppts));
            
            // Reset Form
            appointmentForm.reset();
            clearImage();
        })
        .catch((err) => {
            alert("❌ Failed to send request. Check your connection.");
        });
});

// --- 5. MANAGE BOOKINGS ---
function loadAppointments() {
    const userPhone = document.getElementById('manage-phone')?.value.trim();
    const list = document.getElementById('appointments');
    const appts = JSON.parse(localStorage.getItem('appointments')) || [];

    if (!userPhone) { alert("Please enter your phone number."); return; }

    const filtered = appts.filter(a => a.user_phone === userPhone);
    list.innerHTML = filtered.length === 0
        ? '<li style="padding:10px;">No bookings found for this number.</li>'
        : filtered.map(a => `
            <li class="appointment-card">
                <div>
                    <strong>${a.booking_date}</strong> at <strong>${a.booking_time}</strong>
                </div>
                <button class="delete-btn" onclick="deleteBooking(${a.id})">Cancel</button>
            </li>`).join('');
}

window.deleteBooking = function (id) {
    if (confirm("Are you sure you want to cancel this booking?")) {
        let appts = JSON.parse(localStorage.getItem('appointments')) || [];
        appts = appts.filter(a => a.id !== id);
        localStorage.setItem('appointments', JSON.stringify(appts));
        loadAppointments();
        alert("Booking removed.");
    }
};
