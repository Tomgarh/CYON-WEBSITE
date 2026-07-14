// ==========================
// LOAD PROBATION MEMBERS (KEEP THIS SAFE)
// ==========================
let members = JSON.parse(localStorage.getItem("cyon_members")) || [];

// ==========================
// SAVE TO STORAGE
// ==========================
function updateStorage() {
  localStorage.setItem("cyon_members", JSON.stringify(members));
}

// ==========================
// ID GENERATOR (PROBATION ONLY)
// ==========================
function generateMemberId() {
  const ids = members.map(m =>
    parseInt((m.id || "").split("-")[1] || 0)
  );

  const maxId = ids.length ? Math.max(...ids) : 0;
  return "CYON-" + String(maxId + 1).padStart(4, "0");
}

// ==========================
// DATA (PROBATION)
// ==========================
const groups = [
  "Blessed Tansi Group",
  "Dominic Cardinal Ekanem Group",
  "St. John Bosco Group",
  "Pope John Paul II Group"
];

const units = [
  "Media",
  "Security",
  "Sanitation",
  "Publicity",
  "Sunday School"
];

const unitHeads = {
  Media: "Mr. Bernard Asuquo",
  Security: "Mr. Israel Linus",
  Sanitation: "Mr. Bernard Umoh",
  Publicity: "Miss Josephine Peter",
  "Sunday School": "Miss Josephine Peter"
};

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ==========================
// ERROR DISPLAY
// ==========================
function showError(msg) {
  const errorMsg = document.getElementById("error-message");
  if (!errorMsg) return;
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
}

// ==========================
// PROBATION FORM
// ==========================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("probation-form");
  const successBox = document.getElementById("success-box");
  const errorMsg = document.getElementById("error-message");
  const btn = document.getElementById("submitBtn");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (errorMsg) errorMsg.style.display = "none";
    if (successBox) successBox.style.display = "none";

    const name = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (name.length < 3) return showError("Enter valid full name");
    if (phone.length < 10) return showError("Enter valid phone number");

    const exists = members.find(m => m.phone === phone);
    if (exists) return showError("Member already exists");

    btn.textContent = "Saving...";
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = "Submit Registration";
      btn.disabled = false;

      const newMember = {
        id: generateMemberId(),
        name,
        phone,
        status: "Probation Member",
        photo: "img/default-user.png",
        assignedUnit: random(units),
        assignedGroup: random(groups),
      };

      newMember.unitHead = unitHeads[newMember.assignedUnit];

      members.push(newMember);
      updateStorage();

      form.reset();

      successBox.innerHTML = `
        <div class="success-card">
          <h2>✔ Registration Successful</h2>

          <p><strong>Name:</strong> ${newMember.name}</p>
          <p><strong>ID:</strong> ${newMember.id}</p>
          <p><strong>Phone:</strong> ${newMember.phone}</p>
          <p><strong>Status:</strong> ${newMember.status}</p>
          <p><strong>Unit:</strong> ${newMember.assignedUnit}</p>
          <p><strong>Unit Head:</strong> ${newMember.unitHead}</p>
          <p><strong>Group:</strong> ${newMember.assignedGroup}</p>

          <button class="download-btn" onclick="downloadCard('${newMember.id}')">
            Download CYON Card
          </button>
        </div>
      `;

      successBox.style.display = "block";
    }, 700);
  });
});

// ==========================
// FIREBASE INIT
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
  authDomain: "cyon-stbernard.firebaseapp.com",
  projectId: "cyon-stbernard",
  storageBucket: "cyon-stbernard.appspot.com",
  messagingSenderId: "747151921456",
  appId: "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// ==========================
// FIRESTORE MEMBERS
// ==========================
let firestoreMembers = [];

async function loadMembers() {
  const snapshot = await db.collection("members")
    .orderBy("createdAt", "desc")
    .get();

  firestoreMembers = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderMembers(firestoreMembers);
}

// ==========================
// RENDER MEMBERS
// ==========================
function renderMembers(data) {
  const grid = document.getElementById("membersGridV2");
  const count = document.getElementById("membersTotalCountV2");

  if (!grid) return;

  grid.innerHTML = "";

  data.forEach(m => {
    grid.innerHTML += `
      <div class="member-card-v2">

        <div class="member-avatar">
          ${(m.name || "?").charAt(0).toUpperCase()}
        </div>

        <h3>${m.name || "Unknown"}</h3>
        <p><strong>Group:</strong> ${m.group || "N/A"}</p>
        <p><strong>Role:</strong> ${m.role || "Member"}</p>
        <p><strong>Birthday:</strong>
          ${m.birthMonth && m.birthDay
            ? `${m.birthMonth}/${m.birthDay}`
            : "N/A"}
        </p>

      </div>
    `;
  });

  if (count) count.textContent = data.length;
}

// ==========================
// SEARCH + INIT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("membersSearchInputV2");

  loadMembers();
  loadTodayBirthdays();
  loadUpcomingBirthdays();
  initBirthdayNotifications(); // 👈 NEW

  if (search) {
    search.addEventListener("input", function () {
      const q = this.value.toLowerCase();

      const filtered = firestoreMembers.filter(m =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.group || "").toLowerCase().includes(q) ||
        (m.role || "").toLowerCase().includes(q)
      );

      renderMembers(filtered);
    });
  }
});

// ==========================
// BIRTHDAYS (TODAY)
// ==========================
async function loadTodayBirthdays() {
  const today = new Date();

  const day = today.getDate();
  const month = today.getMonth() + 1;

  const snapshot = await db.collection("members").get();

  const birthdaysToday = snapshot.docs
    .map(doc => doc.data())
    .filter(m =>
      Number(m.birthDay) === day &&
      Number(m.birthMonth) === month
    );

  renderBirthdays(birthdaysToday);
  handleBirthdayNotifications(birthdaysToday); // 👈 IMPORTANT
}

// ==========================
// NOTIFICATIONS (ONCE PER DAY)
// ==========================
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function initBirthdayNotifications() {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}

function handleBirthdayNotifications(list) {
  const todayKey = getTodayKey();
  const lastSent = localStorage.getItem("birthday_notified_date");

  if (lastSent === todayKey) return;

  if (Notification.permission !== "granted") return;

  list.forEach(m => {
    new Notification("🎂 Birthday Alert!", {
      body: `${m.name} has a birthday today 🎉`,
      icon: m.photoURL || "/img/default-user.png"
    });
  });

  localStorage.setItem("birthday_notified_date", todayKey);
}

// ==========================
// RENDER BIRTHDAYS
// ==========================
function renderBirthdays(list) {
  const banner = document.getElementById("birthdayBanner");
  if (!banner) return;

  if (list.length === 0) {
    banner.innerHTML = `
      <div class="birthday-empty">
        <p>No birthdays today 🎉</p>
      </div>
    `;
    return;
  }

  banner.innerHTML = `
    <div class="birthday-section">
      <h3>🎂 Today's Birthdays</h3>

      <div class="birthday-grid">

        ${list.map(m => `

          <div class="birthday-card">

            ${
              m.photoURL
                ? `
                  <img
                    src="${m.photoURL}"
                    class="birthday-avatar"
                    alt="${m.name}"
                  >
                `
                : `
                  <div class="birthday-avatar birthday-avatar-placeholder">
                    ${m.name.charAt(0).toUpperCase()}
                  </div>
                `
            }

            <div class="birthday-info">
              <h4>${m.name}</h4>
              <p>${m.group || "CYON Member"}</p>
            </div>

            <div class="birthday-icon">🎉</div>

          </div>

        `).join("")}

      </div>
    </div>
  `;
}
// ==========================
// UPCOMING BIRTHDAYS (7 DAYS)
// ==========================
async function loadUpcomingBirthdays() {
  const today = new Date();
  const snapshot = await db.collection("members").get();

  const members = snapshot.docs.map(doc => doc.data());
  const upcoming = [];

  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const day = d.getDate();
    const month = d.getMonth() + 1;

    members.forEach(m => {
      if (Number(m.birthDay) === day && Number(m.birthMonth) === month) {
        upcoming.push({ ...m, when: `In ${i} day(s)` });
      }
    });
  }

  renderUpcomingBirthdays(removeDuplicates(upcoming));
}

function removeDuplicates(list) {
  const seen = new Set();
  return list.filter(m => {
    const key = `${m.name}-${m.birthDay}-${m.birthMonth}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderUpcomingBirthdays(list) {

  const banner = document.getElementById("birthdayBanner");

  if (!banner || list.length === 0) return;

  banner.innerHTML += `

    <div class="birthday-section upcoming">

      <h3>📅 Upcoming Birthdays (Next 7 Days)</h3>

      <div class="birthday-grid">

        ${list.map(m => `

          <div class="birthday-card upcoming-card">

            ${
              m.photoURL
                ? `
                  <img
                    src="${m.photoURL}"
                    class="birthday-avatar"
                    alt="${m.name}"
                  >
                `
                : `
                  <div class="birthday-avatar birthday-avatar-placeholder">
                    ${m.name.charAt(0).toUpperCase()}
                  </div>
                `
            }

            <div class="birthday-info">
              <h4>${m.name}</h4>
              <p>${m.group || "CYON Member"}</p>
              <small>${m.when}</small>
            </div>

            <div class="birthday-icon">🎂</div>

          </div>

        `).join("")}

      </div>

    </div>

  `;
}
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".dropdown");
  const link = dropdown?.querySelector("a");

  if (!dropdown || !link) return;

  link.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      dropdown.classList.toggle("active");
    }
  });

  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768 && !dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
});