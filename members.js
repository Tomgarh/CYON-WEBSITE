// ==========================
// ELEMENTS
// ==========================
const membersGrid = document.getElementById("membersGridV2");
const totalCount = document.getElementById("membersTotalCountV2");
const searchInput = document.getElementById("membersSearchInputV2");

// ==========================
// GET ALL CARDS FROM HTML
// ==========================
const cards = Array.from(document.querySelectorAll(".member-card-v2"));

// ==========================
// UPDATE TOTAL COUNT
// ==========================
function updateCount() {
  if (totalCount) {
    totalCount.textContent = cards.length;
  }
}

// ==========================
// SEARCH FUNCTION
// ==========================
function filterMembers(value) {
  const query = value.toLowerCase();

  cards.forEach(card => {
    const name = card.querySelector(".member-name-v2")?.textContent.toLowerCase() || "";
    const group = card.textContent.toLowerCase();

    if (name.includes(query) || group.includes(query)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", function () {
  updateCount();

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterMembers(this.value);
    });
  }
});