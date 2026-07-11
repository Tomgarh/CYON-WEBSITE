const firebaseConfig = {
  apiKey: "AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
  authDomain: "cyon-stbernard.firebaseapp.com",
  projectId: "cyon-stbernard",
  storageBucket: "cyon-stbernard.appspot.com",
  messagingSenderId: "747151921456",
  appId: "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"
};

// =========================
// INIT FIREBASE
// =========================
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// =========================
// FORM ELEMENTS
// =========================
const form = document.getElementById("addMemberForm");
const successBox = document.getElementById("successBox");
const submitBtn = document.getElementById("submitBtn");

// =========================
// SUBMIT FORM
// =========================
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const birthday = document.getElementById("birthday").value; // expects YYYY-MM-DD
  const group = document.getElementById("group").value;
  const role = document.getElementById("role").value;

  // =========================
  // VALIDATION
  // =========================
  if (!fullname || fullname.length < 3) {
    return showMessage("Enter a valid full name", "red");
  }

  if (!phone || phone.length < 10) {
    return showMessage("Enter a valid phone number", "red");
  }

  if (!birthday) {
    return showMessage("Please enter birthday", "red");
  }

  if (!group) {
    return showMessage("Please select a group", "red");
  }

  if (!role) {
    return showMessage("Please select a role", "red");
  }

  submitBtn.textContent = "Submitting Registration...";
  submitBtn.disabled = true;

  try {
    // =========================
    // CONVERT BIRTHDAY → MONTH & DAY
    // =========================
    const dateObj = new Date(birthday);

    const birthMonth = dateObj.getMonth() + 1; // 1–12
    const birthDay = dateObj.getDate(); // 1–31

    // =========================
    // SAVE TO PENDING MEMBERS
    // =========================
    const docRef = await db.collection("pending_members").add({
      name: fullname,
      phone: phone,
      group: group,
      role: role,

      birthMonth: birthMonth,
      birthDay: birthDay,

      status: "pending",
      createdAt: new Date()
    });

    // =========================
    // SUCCESS MESSAGE
    // =========================
    successBox.innerHTML = `
      <div class="success-card">

        <h3>✅ Registration Submitted</h3>

        <p>Your registration has been sent for approval.</p>

        <br>

        <p><strong>Name:</strong> ${fullname}</p>
        <p><strong>Group:</strong> ${group}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Reference ID:</strong> ${docRef.id}</p>

      </div>
    `;

    successBox.style.color = "green";
    form.reset();

  } catch (error) {
    console.error(error);
    showMessage("Error submitting registration", "red");
  }

  submitBtn.textContent = "Add Member";
  submitBtn.disabled = false;
});

// =========================
// MESSAGE FUNCTION
// =========================
function showMessage(message, color) {
  successBox.innerHTML = `<p>${message}</p>`;
  successBox.style.color = color;
}