// ==========================
// RETRIEVE PROBATION CARD
// ==========================
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const resultBox = document.getElementById("resultBox");
  
    // If we're not on retrieve.html, stop here
    if (!searchInput || !searchBtn || !resultBox) return;
  
    function searchMember() {
      const query = searchInput.value.trim().toLowerCase();
  
      if (!query) {
        resultBox.innerHTML = `
          <div class="error-message">
            Please enter your phone number or Member ID.
          </div>
        `;
        return;
      }
  
      // Refresh members from localStorage
      members = JSON.parse(localStorage.getItem("cyon_members")) || [];
  
      const member = members.find(m =>
        (m.phone && m.phone.toLowerCase() === query) ||
        (m.id && m.id.toLowerCase() === query)
      );
  
      if (!member) {
        resultBox.innerHTML = `
          <div class="error-message">
            No member record found.
          </div>
        `;
        return;
      }
  
      resultBox.innerHTML = `
        <div class="retrieve-card">
          <h3>${member.name}</h3>
          <p><strong>Member ID:</strong> ${member.id}</p>
          <p><strong>Phone:</strong> ${member.phone}</p>
          <p><strong>Status:</strong> ${member.status}</p>
          <p><strong>Assigned Group:</strong> ${member.assignedGroup}</p>
  
          <button class="download-btn" onclick="downloadCard('${member.id}')">
            Download Card (PDF)
          </button>
        </div>
      `;
    }
  
    // Search button click
    searchBtn.addEventListener("click", searchMember);
  
    // Press Enter to search
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchMember();
      }
    });
  });
  
  // ==========================
  // DOWNLOAD PDF CARD
  // ==========================
  function downloadCard(memberId) {
    const members = JSON.parse(localStorage.getItem("cyon_members")) || [];
    const member = members.find(m => m.id === memberId);
  
    if (!member) return;
  
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    doc.setFontSize(20);
    doc.text("CYON Probation Card", 20, 20);
  
    doc.setFontSize(12);
    doc.text(`Name: ${member.name}`, 20, 40);
    doc.text(`Member ID: ${member.id}`, 20, 50);
    doc.text(`Phone: ${member.phone}`, 20, 60);
    doc.text(`Status: ${member.status}`, 20, 70);
    doc.text(`Group: ${member.assignedGroup}`, 20, 80);
  
    doc.save(`${member.id}-Probation-Card.pdf`);
  }