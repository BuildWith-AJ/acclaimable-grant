// ============================================================
//  FIREBASE IMPORTS — must be at the very top
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ============================================================
//  FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAlFyJn22WsmIwYwh8CE17wKslKzDC-hqc",
  authDomain: "grant-app-514e9.firebaseapp.com",
  projectId: "grant-app-514e9",
  storageBucket: "grant-app-514e9.firebasestorage.app",
  messagingSenderId: "950123937035",
  appId: "1:950123937035:web:8e52803f43d143f101760e",
  measurementId: "G-SFGMMJEDM4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
//  CLOUDINARY CONFIG
// ============================================================
const CLOUDINARY_CLOUD_NAME = "dtisvxq8m";
const CLOUDINARY_UPLOAD_PRESET = "grant_uploads";

// ============================================================
//  EMAILJS CONFIG
// ============================================================
const EMAILJS_SERVICE_ID = "service_92txiq4";
const EMAILJS_CONFIRMATION_TEMPLATE_ID = "template_nwxvtul";
const EMAILJS_PUBLIC_KEY = "nx1tUiDTMLtnEEzUH";

// Load EmailJS dynamically
const emailJSScript = document.createElement("script");
emailJSScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
emailJSScript.onload = () => emailjs.init(EMAILJS_PUBLIC_KEY);
document.head.appendChild(emailJSScript);

// ============================================================
//  FORMSPREE — contact form endpoint
// ============================================================
const FORMSPREE_CONTACT_URL = "https://formspree.io/f/xpqbgano";


// ============================================================
//  TESTIMONIALS CAROUSEL — mouse drag
// ============================================================
const container = document.getElementById('testimonialContainer');
const carousel = document.getElementById('testimonialCarousel');
const prevBtn = document.getElementById('dragPrevBtn');
const nextBtn = document.getElementById('dragNextBtn');
const prevBtnMobile = document.getElementById('dragPrevBtnMobile');
const nextBtnMobile = document.getElementById('dragNextBtnMobile');

let isDown = false;
let startX;
let scrollLeft;
let velocity = 0;
let lastX;
let lastTime;

if (carousel) {
    carousel.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = container.scrollLeft;
        lastX = e.pageX;
        lastTime = Date.now();
        carousel.style.cursor = 'grabbing';
    });

    carousel.addEventListener('mouseleave', () => {
        isDown = false;
        carousel.style.cursor = 'grab';
    });

    carousel.addEventListener('mouseup', () => {
        isDown = false;
        carousel.style.cursor = 'grab';
    });

    carousel.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX);
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTime;
        if (timeDiff > 0) {
            velocity = (e.pageX - lastX) / timeDiff;
        }
        lastX = e.pageX;
        lastTime = currentTime;
        container.scrollLeft = scrollLeft - walk;
    });

    let touchStartX;
    let touchScrollLeft;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchScrollLeft = container.scrollLeft;
    });

    carousel.addEventListener('touchmove', (e) => {
        if (!touchStartX) return;
        const x = e.touches[0].clientX;
        const walk = (touchStartX - x);
        container.scrollLeft = touchScrollLeft + walk;
    });

    carousel.addEventListener('touchend', () => {
        touchStartX = null;
    });
}

function scrollCarousel(direction) {
    if (!container) return;
    const cardWidth = 320;
    const gap = 32;
    const scrollAmount = cardWidth + gap;
    if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
    } else {
        container.scrollLeft += scrollAmount;
    }
}

if (prevBtn) prevBtn.addEventListener('click', () => scrollCarousel('left'));
if (nextBtn) nextBtn.addEventListener('click', () => scrollCarousel('right'));
if (prevBtnMobile) prevBtnMobile.addEventListener('click', () => scrollCarousel('left'));
if (nextBtnMobile) nextBtnMobile.addEventListener('click', () => scrollCarousel('right'));


// ============================================================
//  HAMBURGER MENU
// ============================================================
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}


// ============================================================
//  HELPER — upload a file to Cloudinary
// ============================================================
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
    );

    if (!response.ok) throw new Error("File upload to Cloudinary failed");

    const data = await response.json();
    return data.secure_url;
}


// ============================================================
//  GRANT APPLICATION FORM SUBMISSION
// ============================================================
const form = document.getElementById("grantForm");

if (form) {
    const submitBtn = form.querySelector("button[type='submit']");
    const successMessage = document.getElementById("successMessage");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading files...";

        try {
            // 1. Upload ID file to Cloudinary (required)
            const idFile = document.getElementById("idUpload").files[0];
            const idFileURL = await uploadToCloudinary(idFile);

            submitBtn.textContent = "Saving your application...";

            // 2. Upload supporting document to Cloudinary (optional)
            let supportingDocURL = null;
            const supportingFile = document.getElementById("supportingDoc").files[0];
            if (supportingFile) {
                supportingDocURL = await uploadToCloudinary(supportingFile);
            }

            // 3. Collect all form values
            const fullName = document.getElementById("fullName").value;
            const email = document.getElementById("email").value;
            const amount = document.getElementById("amount").value;
            const submittedAt = new Date().toISOString();

            // 4. Save all form data + file URLs to Firestore
            await addDoc(collection(db, "grant-applications"), {
                fullName,
                email,
                phone:            document.getElementById("phone").value,
                dateOfBirth:      document.getElementById("dob").value,
                address:          document.getElementById("address").value,
                idType:           document.getElementById("idType").value,
                idNumber:         document.getElementById("idNumber").value,
                idFileURL,
                amountRequested:  amount,
                employmentStatus: document.getElementById("employment").value,
                monthlyIncome:    document.getElementById("income").value || "Not provided",
                purpose:          document.getElementById("purpose").value,
                expectedImpact:   document.getElementById("impact").value,
                previousGrant:    document.getElementById("previousGrant").value,
                supportingDocURL,
                submittedAt,
                status:           "pending"
            });

            submitBtn.textContent = "Almost done...";

            // 5. Send confirmation email to applicant via EmailJS (silent fail)
            try {
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONFIRMATION_TEMPLATE_ID, {
                    applicant_name: fullName,
                    to_email:       email,
                    amount:         amount,
                    submitted_date: new Date(submittedAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric"
                    })
                });
            } catch (emailError) {
                console.warn("Confirmation email failed:", emailError);
                // Fails silently — form submission still succeeds
            }

            // 6. Hide form, show success message, scroll to it
            form.classList.add("hidden");
            successMessage.classList.remove("hidden");
            successMessage.scrollIntoView({ behavior: "smooth" });

        } catch (error) {
            console.error("Submission error:", error);
            alert("Something went wrong. Please try again.\n\nError: " + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Application";
        }
    });
}


// ============================================================
//  CONTACT FORM SUBMISSION — Formspree
// ============================================================
const contactForm = document.getElementById("contactForm");

if (contactForm) {
    const contactBtn = contactForm.querySelector("button[type='submit']");
    const contactSuccess = document.getElementById("contactSuccess");

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        contactBtn.disabled = true;
        contactBtn.textContent = "Sending...";

        try {
            const response = await fetch(FORMSPREE_CONTACT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: document.getElementById("firstName").value,
                    last_name:  document.getElementById("lastName").value,
                    email:      document.getElementById("contactEmail").value,
                    phone:      document.getElementById("contactPhone").value,
                    subject:    document.getElementById("subject").value,
                    message:    document.getElementById("message").value
                })
            });

            if (!response.ok) throw new Error("Failed to send message");

            // Hide form, show success message
            contactForm.classList.add("hidden");
            contactSuccess.classList.remove("hidden");
            contactSuccess.scrollIntoView({ behavior: "smooth" });

        } catch (error) {
            console.error("Contact form error:", error);
            alert("Something went wrong. Please try again.");
            contactBtn.disabled = false;
            contactBtn.textContent = "Send Message";
        }
    });
}
