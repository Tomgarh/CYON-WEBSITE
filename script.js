document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("probation-form");
    const errorMsg = document.getElementById("error-message");
    const successBox = document.getElementById("success-box");
    const btn = document.getElementById("submitBtn");
  
    if (!form) return;
  
    form.addEventListener("submit", function (e) {
      e.preventDefault();
  
      // reset UI
      errorMsg.style.display = "none";
      successBox.style.display = "none";
  
      // values
      const name = document.getElementById("fullname").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const email = document.getElementById("email").value.trim();
      const age = document.getElementById("age").value;
  
      // validation
      if (name.length < 3) return showError("Enter a valid full name.");
      if (phone.length < 10) return showError("Enter a valid phone number.");
      if (!email.includes("@")) return showError("Enter a valid email.");
      if (age < 18) return showError("You must be 18+ to register.");
  
      // loading state (REAL SYSTEM FEEL)
      btn.textContent = "Submitting...";
      btn.disabled = true;
  
      setTimeout(() => {
        btn.textContent = "Submit Registration";
        btn.disabled = false;
  
        form.reset();
        successBox.style.display = "block";
      }, 1500);
    });
  
    function showError(msg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = "block";
    }
  });