// =========================
// FIREBASE CONFIG
// =========================
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "cyon-stbernard.firebaseapp.com",
    projectId: "cyon-stbernard",
    storageBucket: "cyon-stbernard.firebasestorage.app",
    messagingSenderId: "747151921456",
    appId: "YOUR_FIREBASE_APP_ID"
  };
  
  // =========================
  // FIREBASE INIT
  // =========================
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // =========================
  // RECORD VOTE
  // =========================
  function recordVote(id) {
    db.collection("contestants")
      .doc(id)
      .set(
        {
          votes: firebase.firestore.FieldValue.increment(1)
        },
        { merge: true }
      )
      .then(() => {
        console.log("Vote recorded");
      })
      .catch((err) => {
        console.error("Vote failed:", err);
      });
  }
  
  // =========================
  // PAYSTACK + VOTE
  // =========================
  function vote(id, event) {
    const btn = event ? event.target : null;
  
    if (btn) {
      btn.disabled = true;
    }
  
    let handler = PaystackPop.setup({
      key: "YOUR_PAYSTACK_PUBLIC_KEY",
  
      // Replace with actual voter email
      email: "voter@example.com",
  
      amount: 100 * 100, // ₦100
      currency: "NGN",
  
      callback: function (response) {
        console.log("Payment successful:", response.reference);
  
        // Record vote
        recordVote(id);
  
        const msg = document.getElementById("vote_msg");
  
        if (msg) {
          msg.innerText = "✅ Payment successful! Vote recorded.";
          msg.style.color = "green";
  
          setTimeout(() => {
            msg.innerText = "";
          }, 3000);
        }
  
        if (btn) {
          btn.disabled = false;
        }
      },
  
      onClose: function () {
        const msg = document.getElementById("vote_msg");
  
        if (msg) {
          msg.innerText = "❌ Payment cancelled";
          msg.style.color = "red";
  
          setTimeout(() => {
            msg.innerText = "";
          }, 3000);
        }
  
        if (btn) {
          btn.disabled = false;
        }
      }
    });
  
    handler.openIframe();
  }
  
  // =========================
  // LIVE VOTE LISTENER
  // =========================
  function listenVotes(id, elementId) {
    db.collection("contestants")
      .doc(id)
      .onSnapshot(
        (doc) => {
          const el = document.getElementById(elementId);
  
          if (!el) return;
  
          if (doc.exists) {
            const data = doc.data();
            el.innerText = data.votes || 0;
          } else {
            el.innerText = 0;
          }
        },
        (error) => {
          console.error("Snapshot error:", error);
        }
      );
  }
  
  // =========================
  // ALL CONTESTANTS
  // =========================
  const contestants = [
    "bosco_male",
    "bosco_female",
  
    "charles_male",
    "charles_female",
  
    "theresa_male",
    "theresa_female",
  
    "dominic_male",
    "dominic_female",
  
    "bishop_male",
    "bishop_female",
  
    "brian_male",
    "brian_female",
  
    "pope_male",
    "pope_female",
  
    "tansi_male",
    "tansi_female"
  ];
  
  // =========================
  // ATTACH LISTENERS
  // =========================
  contestants.forEach((id) => {
    listenVotes(id, `${id}_votes`);
  });