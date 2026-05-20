// ==========================
// LOAD MEMBERS
// ==========================
let members = JSON.parse(localStorage.getItem("cyon_members")) || [];

// ==========================
// SAVE TO STORAGE
// ==========================
function updateStorage() {
  localStorage.setItem("cyon_members", JSON.stringify(members));
}

// ==========================
// ID GENERATOR
// ==========================
function generateMemberId() {
  const ids = members.map(m =>
    parseInt((m.id || "").split("-")[1] || 0)
  );

  const maxId = ids.length ? Math.max(...ids) : 0;
  return "CYON-" + String(maxId + 1).padStart(4, "0");
}

// ==========================
// DATA
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
// FORM HANDLER
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

    // VALIDATION
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

      // SUCCESS UI
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
// SEARCH + COUNT (for members.html)
// ==========================
document.addEventListener("DOMContentLoaded", function () {
  const grid = document.getElementById("membersGridV2");
  const search = document.getElementById("membersSearchInputV2");
  const count = document.getElementById("membersTotalCountV2");

  function render(data) {
    if (!grid) return;

    grid.innerHTML = "";

    if (!data.length) {
      grid.innerHTML = "<p>No members found</p>";
      return;
    }

    data.forEach(m => {
      const div = document.createElement("div");
      div.className = "member-card-v2";

      div.innerHTML = `
        <img src="${m.photo}" class="member-photo-v2" />
        <h3>${m.name}</h3>
        <p><strong>ID:</strong> ${m.id}</p>
        <p><strong>Status:</strong> ${m.status}</p>
        <p><strong>Unit:</strong> ${m.assignedUnit}</p>
        <p><strong>Group:</strong> ${m.assignedGroup}</p>
      `;

      grid.appendChild(div);
    });

    if (count) count.textContent = data.length;
  }

  render(members);

  if (search) {
    search.addEventListener("input", function () {
      const q = this.value.toLowerCase();

      const filtered = members.filter(m =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.id || "").toLowerCase().includes(q) ||
        (m.phone || "").toLowerCase().includes(q)
      );

      render(filtered);
    });
  }
});

// ==========================
// DOWNLOAD CYON CARD (FIXED)
// ==========================
async function downloadCard(id) {
  const m = members.find(x => x.id === id);

  if (!m) {
    alert("Member not found");
    return;
  }

  const card = document.querySelector(".success-card");

  if (!card) {
    alert("Card not found");
    return;
  }

  const btn = card.querySelector(".download-btn");
  const original = btn?.textContent;

  if (btn) {
    btn.textContent = "PDF Generated...";
    btn.disabled = true;
  }
  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const margin = 10;

    let imgWidth = pageWidth - margin * 2;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    doc.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);

    doc.save(`${m.id}-CYON-CARD.pdf`);

  } catch (err) {
    console.error(err);
    alert("Unable to generate PDF");
  } finally {
    if (btn) {
      btn.textContent = original;
      btn.disabled = false;
    }
  }
}
