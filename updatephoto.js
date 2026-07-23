// ========================================
// FIREBASE CONFIG
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyC-ADpygB1KELcBI3x2TtoOUpumKLa2zuw",
    authDomain: "cyon-stbernard.firebaseapp.com",
    projectId: "cyon-stbernard",
    storageBucket: "cyon-stbernard.firebasestorage.app",
    messagingSenderId: "747151921456",
    appId: "1:747151921456:web:43f8bb21e9b0a4f4abf8f5"
  };
  
  firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// ========================================
// CLOUDINARY
// ========================================

const CLOUD_NAME = "t71rt123";
const UPLOAD_PRESET = "cyon-members";

// ========================================
// ELEMENTS
// ========================================

const phoneInput = document.getElementById("phone");
const searchBtn = document.getElementById("searchBtn");

const memberCard = document.getElementById("memberCard");

const memberName = document.getElementById("memberName");
const memberGroup = document.getElementById("memberGroup");
const memberRole = document.getElementById("memberRole");

const currentPhoto = document.getElementById("currentPhoto");
const avatar = document.getElementById("avatarPlaceholder");

const photoInput = document.getElementById("photo");
const preview = document.getElementById("previewImage");

const uploadBtn = document.getElementById("uploadBtn");

const messageBox = document.getElementById("messageBox");

let currentMemberId = null;

// ========================================
// SEARCH MEMBER
// ========================================

searchBtn.addEventListener("click", async () => {

    const phone = phoneInput.value.trim();

    if (!phone) {
        return showMessage("Enter your phone number.", "red");
    }

    try {

        const snapshot = await db
            .collection("members")
            .where("phone", "==", phone)
            .limit(1)
            .get();

        if (snapshot.empty) {

            memberCard.style.display = "none";

            return showMessage("No member found.", "red");
        }

        const doc = snapshot.docs[0];

        currentMemberId = doc.id;

        const member = doc.data();

        memberCard.style.display = "block";

        memberName.textContent = member.name;
        memberGroup.textContent = member.group;
        memberRole.textContent = member.role;

        if (member.photoURL) {

            currentPhoto.src = member.photoURL;
            currentPhoto.style.display = "block";

            avatar.style.display = "none";

        } else {

            currentPhoto.style.display = "none";

            avatar.style.display = "flex";

            avatar.textContent = member.name.charAt(0).toUpperCase();

        }

        preview.style.display = "none";
        photoInput.value = "";

        showMessage("", "");

    }

    catch (error) {

        console.error(error);

        showMessage("Error searching member.", "red");

    }

});

// ========================================
// PREVIEW
// ========================================

photoInput.addEventListener("change", () => {

  const file = photoInput.files[0];

  if (!file) return;

  // Reject HEIC / HEIF
  if (
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif")
  ) {

      photoInput.value = "";

      preview.style.display = "none";

      return showMessage(
          "❌ HEIC images are not supported. Please upload a JPG, JPEG, PNG or WEBP image.",
          "red"
      );
  }

  // Allow only supported formats
  const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {

      photoInput.value = "";

      preview.style.display = "none";

      return showMessage(
          "❌ Please upload a JPG, JPEG, PNG or WEBP image.",
          "red"
      );
  }

  window.selectedFile = file;

  const reader = new FileReader();

  reader.onload = function (e) {

      preview.src = e.target.result;

      preview.style.display = "block";

  };

  reader.readAsDataURL(file);

  showMessage("", "");

});

// ========================================
// UPDATE PHOTO
// ========================================

uploadBtn.addEventListener("click", async () => {

    if (!currentMemberId) {
        return showMessage("Search your account first.", "red");
    }

    let file = window.selectedFile || photoInput.files[0];

    if (!file) {
        return showMessage("Please choose a passport photo.", "red");
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    try {

        const formData = new FormData();

        formData.append("file", file);

        formData.append("upload_preset", UPLOAD_PRESET);

        const response = await fetch(

            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

            {
                method: "POST",
                body: formData
            }

        );

        const data = await response.json();

        if (!response.ok || !data.secure_url) {

            throw new Error(
                data.error?.message || "Cloudinary upload failed."
            );

        }

        const imageUrl = data.secure_url;

        await db.collection("members")
            .doc(currentMemberId)
            .update({

                photoURL: imageUrl

            });

        currentPhoto.src = imageUrl;
        currentPhoto.style.display = "block";

        avatar.style.display = "none";

        preview.style.display = "none";

        photoInput.value = "";

        window.selectedFile = null;

        showMessage("✅ Passport photo updated successfully!", "green");

    }

    catch (error) {

        console.error(error);

        showMessage(error.message, "red");

    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = "Update Passport Photo";

});

// ========================================
// MESSAGE
// ========================================

function showMessage(message, color) {

    messageBox.textContent = message;

    messageBox.style.color = color;

}