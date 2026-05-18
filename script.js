let memberData = {};

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
    if (age < 18) return showError("You must be 18 years and above.");

    // loading
    btn.textContent = "Submitting...";
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = "Submit Registration";
      btn.disabled = false;

      // units
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

      // random assignment
      const assignedUnit = units[Math.floor(Math.random() * units.length)];
      const unitHead = unitHeads[assignedUnit];

      // store globally
      memberData = {
        name,
        phone,
        email,
        age,
        assignedUnit,
        unitHead
      };

      // reset form
      form.reset();

      // show card
      successBox.innerHTML = `
        <h3>✔ Registration Successful</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Status:</strong> Probation Member</p>
        <p><strong>Duration:</strong> 3 Months</p>
        <p><strong>Assigned Unit:</strong> ${assignedUnit}</p>
        <p><strong>Unit Head:</strong> ${unitHead}</p>

        <button id="downloadPdfBtn">Download PDF</button>
      `;

      successBox.style.display = "block";
    }, 1200);
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
  }
});


// PDF GENERATION
document.addEventListener("click", function (e) {
  if (e.target.id === "downloadPdfBtn") {

    if (!memberData.name) {
      alert("Please complete registration first.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // border
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);

    // title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CYON PROBATION CARD", 105, 25, { align: "center" });

    // logo (optional safe version)
    try {
      const img = new Image();
      img.src = "cyon_logo.jpeg";
      doc.addImage(img, "JPEG", 85, 30, 40, 40);
    } catch (e) {}

    // text
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    doc.text(`Name: ${memberData.name}`, 20, 85);
    doc.text(`Phone: ${memberData.phone}`, 20, 95);
    doc.text(`Email: ${memberData.email}`, 20, 105);
    doc.text(`Status: Probation Member`, 20, 115);
    doc.text(`Assigned Unit: ${memberData.assignedUnit}`, 20, 125);
    doc.text(`Unit Head: ${memberData.unitHead}`, 20, 135);
    doc.text(`Duration: 3 Months`, 20, 145);

    // footer
    doc.setFontSize(10);
    doc.text(
      "Catholic Youth Organization of Nigeria (CYON) Saint. Bernard's Parish, Marian Hill, Calabar.",
      105,
      270,
      { align: "center" }
    );

    doc.save(`${memberData.name}_CYON_Card.pdf`);
  }
});
