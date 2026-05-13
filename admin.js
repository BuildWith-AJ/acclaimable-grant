// ============================================================
//  FIREBASE IMPORTS
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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
const db = getFirestore(app);

// ============================================================
//  EMAILJS CONFIG
// ============================================================
const EMAILJS_SERVICE_ID = "service_92txiq4";
const EMAILJS_STATUS_TEMPLATE_ID = "template_sgq67or";
const EMAILJS_PUBLIC_KEY = "nx1tUiDTMLtnEEzUH";

// Load EmailJS
const emailJSScript = document.createElement("script");
emailJSScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
emailJSScript.onload = () => emailjs.init(EMAILJS_PUBLIC_KEY);
document.head.appendChild(emailJSScript);


// ============================================================
//  STATE
// ============================================================
let allApplications = []; // stores all fetched applications
let currentAppId = null;  // tracks which application is open in modal
let currentFilter = "all";


// ============================================================
//  AUTH GUARD — redirect to login if not logged in
// ============================================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "admin-login.html";
    } else {
        document.getElementById("adminEmailDisplay").textContent = user.email;
        document.getElementById("adminEmailDisplay").classList.remove("hidden");
        loadApplications();
    }
});


// ============================================================
//  LOGOUT
// ============================================================
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "admin-login.html";
});


// ============================================================
//  LOAD APPLICATIONS FROM FIRESTORE
// ============================================================
async function loadApplications() {
    try {
        const q = query(collection(db, "grant-applications"), orderBy("submittedAt", "desc"));
        const snapshot = await getDocs(q);

        allApplications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        updateStats();
        renderApplications(allApplications);

    } catch (error) {
        console.error("Error loading applications:", error);
    }
}


// ============================================================
//  UPDATE STATS CARDS
// ============================================================
function updateStats() {
    document.getElementById("totalCount").textContent = allApplications.length;
    document.getElementById("pendingCount").textContent = allApplications.filter(a => a.status === "pending").length;
    document.getElementById("approvedCount").textContent = allApplications.filter(a => a.status === "approved").length;
    document.getElementById("rejectedCount").textContent = allApplications.filter(a => a.status === "rejected").length;
}


// ============================================================
//  FILTER APPLICATIONS
// ============================================================
window.filterApplications = function(filter) {
    currentFilter = filter;

    // Update active filter button styles
    document.querySelectorAll(".filter-btn").forEach(btn => {
        if (btn.getAttribute("data-filter") === filter) {
            btn.classList.add("bg-blue-900", "text-white");
            btn.classList.remove("bg-white", "text-gray-600");
        } else {
            btn.classList.remove("bg-blue-900", "text-white");
            btn.classList.add("bg-white", "text-gray-600");
        }
    });

    const filtered = filter === "all" ? allApplications : allApplications.filter(a => a.status === filter);
    renderApplications(filtered);
}


// ============================================================
//  RENDER APPLICATIONS TABLE
// ============================================================
function renderApplications(applications) {
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const applicationsTable = document.getElementById("applicationsTable");
    const tbody = document.getElementById("applicationsBody");

    loadingState.classList.add("hidden");

    if (applications.length === 0) {
        emptyState.classList.remove("hidden");
        applicationsTable.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    applicationsTable.classList.remove("hidden");

    tbody.innerHTML = applications.map(app => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4">
                <div class="font-medium text-gray-800">${app.fullName || "—"}</div>
                <div class="text-gray-400 text-xs">${app.email || "—"}</div>
            </td>
            <td class="px-6 py-4 text-gray-700">$${app.amountRequested || "—"}</td>
            <td class="px-6 py-4 text-gray-700 capitalize">${app.employmentStatus || "—"}</td>
            <td class="px-6 py-4 text-gray-500 text-xs">${formatDate(app.submittedAt)}</td>
            <td class="px-6 py-4">${statusBadge(app.status)}</td>
            <td class="px-6 py-4">
                <button onclick="openModal('${app.id}')"
                    class="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-200 transition">
                    <i class="fas fa-eye mr-1"></i> View
                </button>
            </td>
        </tr>
    `).join("");
}


// ============================================================
//  OPEN MODAL
// ============================================================
window.openModal = function(appId) {
    currentAppId = appId;
    const app = allApplications.find(a => a.id === appId);
    if (!app) return;

    // Set current status in dropdown
    document.getElementById("statusSelect").value = app.status || "pending";
    document.getElementById("statusUpdateMsg").classList.add("hidden");

    // Build modal content
    document.getElementById("modalBody").innerHTML = `
        <!-- Personal Info -->
        <div>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Information</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${modalField("Full Name", app.fullName)}
                ${modalField("Email", app.email)}
                ${modalField("Phone", app.phone)}
                ${modalField("Date of Birth", app.dateOfBirth)}
                ${modalField("Address", app.address, true)}
            </div>
        </div>

        <!-- Identification -->
        <div>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Identification</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${modalField("ID Type", app.idType)}
                ${modalField("ID Number", app.idNumber)}
            </div>
            <div class="mt-3">
                ${app.idFileURL ? `
                    <a href="${app.idFileURL}" target="_blank"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition">
                        <i class="fas fa-id-card"></i> View Uploaded ID
                    </a>` : "<p class='text-gray-400 text-sm'>No ID uploaded</p>"}
            </div>
        </div>

        <!-- Financial Details -->
        <div>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Financial Details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${modalField("Amount Requested", "$" + app.amountRequested)}
                ${modalField("Employment Status", app.employmentStatus)}
                ${modalField("Monthly Income", app.monthlyIncome ? "$" + app.monthlyIncome : "Not provided")}
                ${modalField("Previous Grant", app.previousGrant)}
            </div>
        </div>

        <!-- Grant Purpose -->
        <div>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Grant Purpose</h3>
            ${modalField("Purpose", app.purpose, true)}
            ${modalField("Expected Impact", app.expectedImpact, true)}
        </div>

        <!-- Supporting Document -->
        <div>
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Supporting Document</h3>
            ${app.supportingDocURL ? `
                <a href="${app.supportingDocURL}" target="_blank"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition">
                    <i class="fas fa-file-alt"></i> View Supporting Document
                </a>` : "<p class='text-gray-400 text-sm'>No supporting document uploaded</p>"}
        </div>

        <!-- Metadata -->
        <div class="pt-2 border-t border-gray-100">
            <p class="text-xs text-gray-400">Submitted: ${formatDate(app.submittedAt)} &nbsp;|&nbsp; Application ID: ${app.id}</p>
        </div>
    `;

    document.getElementById("detailModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
}


// ============================================================
//  CLOSE MODAL
// ============================================================
window.closeModal = function() {
    document.getElementById("detailModal").classList.add("hidden");
    document.body.style.overflow = "";
    currentAppId = null;
}

// Close modal when clicking backdrop
document.getElementById("detailModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("detailModal")) closeModal();
});


// ============================================================
//  UPDATE APPLICATION STATUS + SEND EMAIL
// ============================================================
window.updateStatus = async function() {
    if (!currentAppId) return;

    const newStatus = document.getElementById("statusSelect").value;
    const updateBtn = document.getElementById("updateStatusBtn");
    const statusUpdateMsg = document.getElementById("statusUpdateMsg");

    updateBtn.disabled = true;
    updateBtn.textContent = "Saving...";

    try {
        // 1. Update status in Firestore
        const appRef = doc(db, "grant-applications", currentAppId);
        await updateDoc(appRef, { status: newStatus });

        // 2. Update local state
        const appIndex = allApplications.findIndex(a => a.id === currentAppId);
        if (appIndex !== -1) allApplications[appIndex].status = newStatus;

        // 3. Send status email to applicant via EmailJS
       // 3. Send status email to applicant via EmailJS
        try {
            const application = allApplications.find(a => a.id === currentAppId);
            if (application && application.email) {
                const statusMessage = newStatus === "approved"
                    ? "Congratulations! Your grant application has been approved. Our team will be in touch with you shortly regarding the next steps."
                    : newStatus === "rejected"
                    ? "We regret to inform you that your grant application has not been approved at this time. You may reapply in the future."
                    : "Your application is currently under review. We will notify you once a decision has been made.";

                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_STATUS_TEMPLATE_ID, {
                    applicant_name: application.fullName,
                    to_email: application.email,
                    status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
                    status_message: statusMessage
                });
            }
        } catch (emailError) {
            console.warn("Status email failed:", emailError);
            // Email failed silently — status update still succeeds
        }

        // 4. Update UI
        updateStats();
        renderApplications(currentFilter === "all" ? allApplications : allApplications.filter(a => a.status === currentFilter));
        statusUpdateMsg.classList.remove("hidden");

    } catch (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status. Please try again.\n\n" + error.message);
    }

    updateBtn.disabled = false;
    updateBtn.textContent = "Save Status";
}


// ============================================================
//  HELPERS
// ============================================================
function modalField(label, value, fullWidth = false) {
    return `
        <div class="${fullWidth ? "sm:col-span-2" : ""}">
            <p class="text-xs text-gray-400 mb-1">${label}</p>
            <p class="text-sm text-gray-800 font-medium">${value || "—"}</p>
        </div>
    `;
}

function statusBadge(status) {
    const styles = {
        pending: "bg-yellow-100 text-yellow-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700"
    };
    const style = styles[status] || styles.pending;
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold capitalize ${style}">${status || "pending"}</span>`;
}

function formatDate(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
