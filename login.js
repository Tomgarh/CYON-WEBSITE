// =========================
// FIREBASE CONFIG
// =========================
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

const auth = firebase.auth();

// =========================
// LOGIN FUNCTION
// =========================
function login() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const msg =
    document.getElementById("msg");

  // Clear old messages
  msg.innerText = "";

  auth.signInWithEmailAndPassword(
    email,
    password
  )

  .then(() => {

    // Redirect to dashboard
    window.location.href =
      "admin.html";

  })

  .catch(error => {

    console.error(error);

    msg.innerText =
      error.message;

  });

}