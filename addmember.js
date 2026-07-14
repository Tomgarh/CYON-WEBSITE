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
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// =========================
// CLOUDINARY SETTINGS
// =========================
const CLOUD_NAME = "t71rt123";
const UPLOAD_PRESET = "cyon-members";

// =========================
// ELEMENTS
// =========================
const form = document.getElementById("addMemberForm");
const successBox = document.getElementById("successBox");
const submitBtn = document.getElementById("submitBtn");
const photoInput = document.getElementById("photo");

// =========================
// SUBMIT FORM
// =========================
form.addEventListener("submit", async function (e) {

  e.preventDefault();

  const fullname = document.getElementById("fullname").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const birthday = document.getElementById("birthday").value;
  const group = document.getElementById("group").value;
  const role = document.getElementById("role").value;

  // =========================
  // VALIDATION
  // =========================

  if (!fullname || fullname.length < 3)
    return showMessage("Enter a valid full name.", "red");

  if (!phone || phone.length < 10)
    return showMessage("Enter a valid phone number.", "red");

  if (!birthday)
    return showMessage("Select birthday.", "red");

  if (!group)
    return showMessage("Select a group.", "red");

  if (!role)
    return showMessage("Select a role.", "red");

  if (!photoInput.files.length)
    return showMessage("Please choose a passport photo.", "red");

  submitBtn.disabled = true;
  submitBtn.textContent = "Uploading...";

  try {

    // =========================
    // CHECK FOR DUPLICATE MEMBER
    // =========================

    const existing = await db
      .collection("members")
      .where("phone", "==", phone)
      .get();

    if (!existing.empty) {
      showMessage(
        "This member already exists in the members directory.",
        "red"
      );

      submitBtn.disabled = false;
      submitBtn.textContent = "Add Member";
      return;
    }

    // =========================
    // CHECK PENDING TOO
    // =========================

    const pending = await db
      .collection("pending_members")
      .where("phone", "==", phone)
      .get();

    if (!pending.empty) {
      showMessage(
        "Registration already submitted and awaiting approval.",
        "red"
      );

      submitBtn.disabled = false;
      submitBtn.textContent = "Add Member";
      return;
    }

    // =========================
    // UPLOAD PHOTO TO CLOUDINARY
    // =========================

    const file = photoInput.files[0];

    const data = new FormData();

    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data
      }
    );

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.secure_url) {
      throw new Error("Cloudinary upload failed");
    }

    const photoURL = uploadResult.secure_url;

    // =========================
    // CONVERT DATE
    // =========================

    const dateObj = new Date(birthday);

    const birthMonth = dateObj.getMonth() + 1;
    const birthDay = dateObj.getDate();

    // =========================
    // SAVE TO FIRESTORE
    // =========================

    const docRef = await db.collection("pending_members").add({

      name: fullname,
      phone,
      group,
      role,

      birthMonth,
      birthDay,

      photoURL,

      status: "pending",

      createdAt: new Date()

    });

    // =========================
    // SUCCESS
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

  }

  catch (error) {

    console.error(error);

    showMessage(
      "Error submitting registration. Please try again.",
      "red"
    );

  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Add Member";

});

// =========================
// MESSAGE
// =========================

function showMessage(message, color) {

  successBox.innerHTML = `<p>${message}</p>`;

  successBox.style.color = color;

}