// ==========================
// ELEMENTS
// ==========================
const searchInput = document.getElementById("membersSearchInputV2");
const membersGrid = document.getElementById("membersGridV2");
const totalCount = document.getElementById("membersTotalCountV2");

// ==========================
// GET ALL MANUAL CARDS
// ==========================
const cards = Array.from(document.querySelectorAll(".member-card-v2"));

// ==========================
// UPDATE COUNT
// ==========================
function updateMemberCount() {
  const visibleCards = cards.filter(card => card.style.display !== "none");

  if (totalCount) {
    totalCount.textContent = visibleCards.length;
  }
}

// ==========================
// SEARCH FUNCTION
// ==========================
function filterMembers() {
  const query = searchInput.value.toLowerCase();

  cards.forEach(card => {
    const text = card.innerText.toLowerCase();

    if (text.includes(query)) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });

  updateMemberCount();
}

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", function () {
  if (!searchInput) return;

  // initial count (all visible)
  updateMemberCount();

  // live search
  searchInput.addEventListener("input", filterMembers);
});
