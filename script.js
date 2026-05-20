let members = JSON.parse(localStorage.getItem("cyon_members")) || [];

// ==========================
// HELPERS
// ==========================
function updateStorage() {
  localStorage.setItem("cyon_members", JSON.stringify(members));
}

function generateMemberId() {
  const ids = members.map(m =>
    parseInt((m.id || "").split("-")[1] || 0)
  );

  const maxId = ids.length ? Math.max(...ids) : 0;
  return "CYON-" + String(maxId + 1).padStart(4, "0");
}

function showError(msg) {
  const errorMsg = document.getElementById("error-message");
  if (!errorMsg) return;

  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
}

// ==========================
// FORM REGISTRATION ONLY
// ==========================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("probation-form");
  const errorMsg = document.getElementById("error-message");
  const successBox = document.getElementById("success-box");
  const btn = document.getElementById("submitBtn");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (errorMsg) errorMsg.style.display = "none";
    if (successBox) successBox.style.display = "none";

    const name = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim();

    // ======================
    // VALIDATION
    // ======================
    if (name.length < 3) return showError("Enter full name properly.");
    if (phone.length < 10) return showError("Enter valid phone number.");

    const existing = members.find(m => m.phone === phone);
    if (existing) return showError("This member already exists.");

    btn.textContent = "Saving...";
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = "Submit Registration";
      btn.disabled = false;

      const memberId = generateMemberId();

      const newMember = {
        id: memberId,
        name,
        phone,
        status: "Probation Member",
        photo: "img/default-user.png",
        assignedGroup: "Unassigned"
      };

      members.push(newMember);
      updateStorage();

      form.reset();

      if (successBox) {
        successBox.innerHTML = `
          <h3>✔ Member Added Successfully</h3>
          <p><strong>ID:</strong> ${memberId}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
        `;
        successBox.style.display = "block";
      }

    }, 800);
  });
});

