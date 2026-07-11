const firebaseConfig = {
  apiKey: "AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
  authDomain: "cyon-stbernard.firebaseapp.com",
  projectId: "cyon-stbernard",
  storageBucket: "cyon-stbernard.appspot.com",
  messagingSenderId: "747151921456",
  appId: "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"
};

// =========================
// INITIALIZE FIREBASE
// =========================
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// =========================
// ELEMENTS
// =========================
const pendingList = document.getElementById("pendingList");
const pendingCount = document.getElementById("pendingCount");

// =========================
// AUTH PROTECTION
// =========================
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  }
});

// =========================
// LOAD PENDING MEMBERS
// =========================
async function loadPending() {
  try {
    pendingList.innerHTML = "<p>Loading pending members...</p>";

    const snapshot = await db
      .collection("pending_members")
      .orderBy("createdAt", "desc")
      .get();

    pendingCount.textContent = snapshot.size;

    if (snapshot.empty) {
      pendingList.innerHTML = `
        <p class="empty-msg">
          No pending registrations 🎉
        </p>
      `;
      return;
    }
    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    pendingList.innerHTML = "";

    snapshot.forEach(doc => {
      const m = doc.data();

      const card = document.createElement("div");
      card.className = "member-card";

      card.innerHTML = `
        <h3>${m.name}</h3>

        <p><strong>Group:</strong> ${m.group}</p>
        <p><strong>Phone:</strong> ${m.phone || "N/A"}</p>
        <p><strong>Birthday:</strong>
  ${
    m.birthMonth && m.birthDay
      ? `${months[m.birthMonth - 1]} ${m.birthDay}`
      : "N/A"
  }
</p>

        ${
          m.photoURL
            ? `<img src="${m.photoURL}" class="pending-photo" />`
            : `<p><em>No photo uploaded</em></p>`
        }

        <div class="actions">
          <button class="approve-btn" data-id="${doc.id}">
            Approve
          </button>

          <button class="reject-btn" data-id="${doc.id}">
            Reject
          </button>
        </div>
      `;

      pendingList.appendChild(card);
    });

    attachButtonEvents();

  } catch (error) {
    console.error(error);

    pendingList.innerHTML = `
      <p class="error-msg">
        Error loading members
      </p>
    `;
  }
}

// =========================
// BUTTON EVENTS
// =========================
function attachButtonEvents() {

  document.querySelectorAll(".approve-btn")
    .forEach(button => {
      button.onclick = () => approveMember(button.dataset.id);
    });

  document.querySelectorAll(".reject-btn")
    .forEach(button => {
      button.onclick = () => rejectMember(button.dataset.id);
    });

}

// =========================
// APPROVE MEMBER (FIXED)
// =========================
async function approveMember(id) {
  try {

    const pendingRef = db.collection("pending_members").doc(id);
    const doc = await pendingRef.get();

    if (!doc.exists) {
      alert("Member not found");
      return;
    }

    const data = doc.data();

    // IMPORTANT FIX:
    // Ensure photoURL is carried over properly
    await db.collection("members").add({
      name: data.name,
      phone: data.phone || "",
    
      birthMonth: Number(data.birthMonth) || null,
      birthDay: Number(data.birthDay) || null,
    
      group: data.group || "",
      role: data.role || "Member",
      photoURL: data.photoURL || null,
    
      status: "approved",
      approvedAt: new Date(),
      createdAt: data.createdAt || new Date()
    });
    await pendingRef.delete();

    alert("Member approved successfully ✅");

    loadPending();

  } catch (error) {
    console.error(error);
    alert("Error approving member");
  }
}

// =========================
// REJECT MEMBER
// =========================
async function rejectMember(id) {
  try {
    await db.collection("pending_members").doc(id).delete();

    alert("Member rejected ❌");

    loadPending();

  } catch (error) {
    console.error(error);
    alert("Error rejecting member");
  }
}

// =========================
// LOGOUT
// =========================
function logout() {
  auth.signOut()
    .then(() => {
      window.location.href = "login.html";
    })
    .catch(error => {
      console.error(error);
      alert("Logout failed");
    });
}

// =========================
// INITIAL LOAD
// =========================
loadPending();