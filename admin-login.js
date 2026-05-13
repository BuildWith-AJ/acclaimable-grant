// ============================================================
//  FIREBASE IMPORTS
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

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
const auth = getAuth(app);


// ============================================================
//  TOGGLE PASSWORD VISIBILITY
// ============================================================
const togglePassword = document.getElementById("togglePassword");
const adminPassword = document.getElementById("adminPassword");

togglePassword.addEventListener("click", () => {
    const type = adminPassword.getAttribute("type") === "password" ? "text" : "password";
    adminPassword.setAttribute("type", type);
    togglePassword.innerHTML = type === "password" ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
});


// ============================================================
//  LOGIN FORM SUBMISSION
// ============================================================
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const loginErrorText = document.getElementById("loginErrorText");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    // Hide previous errors
    loginError.classList.add("hidden");

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Redirect to admin dashboard on success
        window.location.href = "admin.html";
    } catch (error) {
        // Show error message
        loginError.classList.remove("hidden");
        if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
            loginErrorText.textContent = "Invalid email or password. Please try again.";
        } else {
            loginErrorText.textContent = "Something went wrong. Please try again.";
        }

        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    }
});
