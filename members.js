const firebaseConfig = {
  apiKey: "AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
  authDomain: "cyon-stbernard.firebaseapp.com",
  projectId: "cyon-stbernard",
  storageBucket: "cyon-stbernard.firebasestorage.app",
  messagingSenderId: "747151921456",
  appId: "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"
};

// INIT FIREBASE
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// ELEMENTS
const searchInput = document.getElementById("membersSearchInputV2");
const membersGrid = document.getElementById("membersGridV2");
const totalCount = document.getElementById("membersTotalCountV2");

let allMembers = [];

// ==========================
// LOAD MEMBERS FROM FIREBASE
// ==========================
async function loadMembers() {
  try {
    const snapshot = await db
      .collection("members")
      .orderBy("createdAt", "desc")
      .get();

    allMembers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderMembers(allMembers);

  } catch (error) {
    console.error(error);
    membersGrid.innerHTML = "<p>Error loading members</p>";
  }
}

// ==========================
// RENDER MEMBERS
// ==========================
function renderMembers(data) {

  membersGrid.innerHTML = "";

  if (data.length === 0) {
    membersGrid.innerHTML = "<p>No members found</p>";
    totalCount.textContent = 0;
    return;
  }

  data.forEach(member => {

    const avatarHTML = member.photoURL
      ? `
        <div class="member-avatar">
          <img
            src="${member.photoURL}"
            alt="${member.name}"
            onerror="this.parentElement.innerHTML='${member.name.charAt(0).toUpperCase()}'"
          >
        </div>
      `
      : `
        <div class="member-avatar">
          ${member.name.charAt(0).toUpperCase()}
        </div>
      `;

    membersGrid.innerHTML += `
      <div class="member-card-v2">

        ${avatarHTML}

        <h3>${member.name}</h3>

        <p><strong>Group:</strong> ${member.group}</p>

        <p>
          <strong>Role:</strong>
          ${member.role || "Member"}
        </p>

        <p>
          <strong>Birthday:</strong>
          ${member.birthday || "N/A"}
        </p>

      </div>
    `;
  });

  totalCount.textContent = data.length;
}

// ==========================
// SEARCH FUNCTION
// ==========================
searchInput.addEventListener("input", function () {

  const query =
    searchInput.value.toLowerCase();

  const filtered = allMembers.filter(member =>
    (
      (member.name || "") + " " +
      (member.group || "") + " " +
      (member.role || "")
    )
      .toLowerCase()
      .includes(query)
  );

  renderMembers(filtered);

});

// ==========================
// INIT
// ==========================
document.addEventListener(
  "DOMContentLoaded",
  loadMembers
);

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const dropdown =
      document.querySelector(".dropdown");

    const link =
      dropdown?.querySelector("a");

    if (!dropdown || !link) return;

    link.addEventListener("click", (e) => {

      if (window.innerWidth <= 768) {

        e.preventDefault();

        dropdown.classList.toggle(
          "active"
        );

      }

    });

  }
);
