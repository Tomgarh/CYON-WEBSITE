let members = JSON.parse(localStorage.getItem("cyon_members")) || [];

// Save to localStorage
function updateStorage() {
  localStorage.setItem("cyon_members", JSON.stringify(members));
}

// Generate ID safely
function generateMemberId() {
  const ids = members.map(m =>
    parseInt((m.id || "").split("-")[1] || 0)
  );

  const maxId = ids.length ? Math.max(...ids) : 0;
  return "CYON-" + String(maxId + 1).padStart(4, "0");
}

document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("probation-form");
  const errorMsg = document.getElementById("error-message");
  const successBox = document.getElementById("success-box");
  const btn = document.getElementById("submitBtn");

  if (!form) return;

  // ======================
  // REGISTRATION
  // ======================
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    errorMsg.style.display = "none";
    successBox.style.display = "none";

    const name = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const age = Number(document.getElementById("age").value);

    // validation
    if (name.length < 3) return showError("Enter a valid full name.");
    if (phone.length < 10) return showError("Enter a valid phone number.");
    if (!email.includes("@")) return showError("Enter a valid email.");
    if (age < 18) return showError("You must be 18 years and above.");

    // duplicate check
    const existing = members.find(m =>
      m.phone === phone || m.email === email
    );

    if (existing) {
      return showError("This phone or email is already registered.");
    }

    btn.textContent = "Submitting...";
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = "Submit Registration";
      btn.disabled = false;

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

      const assignedUnit = units[Math.floor(Math.random() * units.length)];
      const unitHead = unitHeads[assignedUnit];

      const memberId = generateMemberId();

      const newMember = {
        id: memberId,
        name,
        phone,
        email,
        age,
        assignedUnit,
        unitHead
      };

      members.push(newMember);
      updateStorage();

      form.reset();

      successBox.innerHTML = `
        <h3>✔ Registration Successful</h3>

        <p><strong>Member ID:</strong> ${memberId}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Status:</strong> Probation Member</p>
        <p><strong>Duration:</strong> 3 Months</p>
        <p><strong>Assigned Unit:</strong> ${assignedUnit}</p>
        <p><strong>Unit Head:</strong> ${unitHead}</p>

        <p><strong>Total Members:</strong> ${members.length}</p>

        <button id="downloadPdfBtn" data-id="${memberId}">
          Download PDF
        </button>
      `;

      successBox.style.display = "block";
    }, 1200);
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
  }
});


// ======================
// PDF GENERATION (FIXED)
// ======================
document.addEventListener("click", function (e) {

  if (e.target.id !== "downloadPdfBtn") return;

  const memberId = e.target.getAttribute("data-id");

  const members = JSON.parse(localStorage.getItem("cyon_members")) || [];
  const member = members.find(m => m.id === memberId);

  if (!member) {
    alert("Member not found.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setLineWidth(1.5);
  doc.rect(10, 10, 190, 277);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CYON PROBATION CARD", 105, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  doc.text(`Member ID: ${member.id}`, 20, 75);
  doc.text(`Name: ${member.name}`, 20, 85);
  doc.text(`Phone: ${member.phone}`, 20, 95);
  doc.text(`Email: ${member.email}`, 20, 105);
  doc.text(`Status: Probation Member`, 20, 115);
  doc.text(`Assigned Unit: ${member.assignedUnit}`, 20, 125);
  doc.text(`Unit Head: ${member.unitHead}`, 20, 135);
  doc.text(`Duration: 3 Months`, 20, 145);

  doc.setFontSize(10);
  doc.text(
    "Catholic Youth Organization of Nigeria (CYON)",
    105,
    270,
    { align: "center" }
  );

  doc.save(`${member.id}_CYON_Card.pdf`);
});


// ======================
// SEARCH (FIXED)
// ======================
document.addEventListener("DOMContentLoaded", function () {

  const searchBtn = document.getElementById("searchBtn");
  const resultBox = document.getElementById("resultBox");

  if (!searchBtn) return;

  searchBtn.addEventListener("click", function () {

    const query = document.getElementById("searchInput").value.trim().toLowerCase();

    const members = JSON.parse(localStorage.getItem("cyon_members")) || [];

    if (!query) {
      resultBox.innerHTML = "<p>Please enter a Phone or Member ID</p>";
      return;
    }

    const user = members.find(m =>
      String(m.phone).toLowerCase() === query ||
      String(m.id).toLowerCase() === query
    );

    if (!user) {
      resultBox.innerHTML = "<p>No record found ❌</p>";
      return;
    }

    resultBox.innerHTML = `
      <div class="card">
        <h3>Member Found ✔</h3>

        <p><strong>ID:</strong> ${user.id}</p>
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Phone:</strong> ${user.phone}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Unit:</strong> ${user.assignedUnit}</p>
        <p><strong>Unit Head:</strong> ${user.unitHead}</p>

        <button id="downloadPdfBtn" data-id="${user.id}">
          Download PDF
        </button>
      </div>
    `;
  });
});
