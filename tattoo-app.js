// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
}

const fileInput = document.getElementById('tattoo-upload');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const uploadText = document.getElementById('upload-text');

// 1. IMAGE PREVIEW & REMOVE
fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
            uploadText.innerText = "✅ Image Loaded";
        }
        reader.readAsDataURL(file);
    }
});

window.clearImage = function() {
    fileInput.value = "";
    previewContainer.style.display = 'none';
    uploadText.innerText = "📸 Click to Upload Reference Image";
};

// 2. BOOKING LOGIC (With Conflict Check)
document.getElementById('appointment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const phone = document.getElementById('phone').value;

    const localAppts = JSON.parse(localStorage.getItem('appointments')) || [];
    const isConflict = localAppts.some(a => a.booking_date === date && a.booking_time === time);

    if (isConflict) {
        alert("⚠️ This time slot is already taken locally. Please choose another.");
        return;
    }

    const templateParams = {
        booking_date: date,
        booking_time: time,
        user_phone: phone,
        reference_image: fileInput.files[0] ? fileInput.files[0].name : "No image"
    };

    emailjs.send('service_default', 'template_your_id', templateParams)
        .then(() => {
            alert("✅ Booking Request Sent!");
            localAppts.push({ ...templateParams, id: Date.now() });
            localStorage.setItem('appointments', JSON.stringify(localAppts));
            this.reset();
            clearImage();
        })
        .catch(() => alert("❌ Failed to send request."));
});

// 3. MANAGE BOOKINGS
window.loadAppointments = function() {
    const phone = document.getElementById('manage-phone').value;
    const list = document.getElementById('appointments');
    const appts = JSON.parse(localStorage.getItem('appointments')) || [];
    const filtered = appts.filter(a => a.user_phone === phone);
    
    list.innerHTML = filtered.map(a => `
        <li style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div><strong>${a.booking_date}</strong> at ${a.booking_time}</div>
            <button class="delete-btn" onclick="deleteBooking(${a.id})">Cancel</button>
        </li>
    `).join('') || "<li>No bookings found.</li>";
};

window.deleteBooking = function(id) {
    let appts = JSON.parse(localStorage.getItem('appointments')) || [];
    appts = appts.filter(a => a.id !== id);
    localStorage.setItem('appointments', JSON.stringify(appts));
    loadAppointments();
};
