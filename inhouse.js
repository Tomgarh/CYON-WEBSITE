function updateCountdown() {
  const timer = document.querySelector(".big-countdown");

  if (!timer) return;

  const eventDate = new Date(timer.getAttribute("data-date")).getTime();
  const now = new Date().getTime();

  const diff = eventDate - now;

  if (diff <= 0) {
    timer.innerHTML = "🎉 Event Started!";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  timer.innerHTML = `⏳ ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// IMPORTANT: wait for page to load
document.addEventListener("DOMContentLoaded", function () {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  
});
const toggleBtn = document.getElementById("toggleFixtures");
const fixturesBox = document.getElementById("fixturesBox");

toggleBtn.addEventListener("click", () => {
  fixturesBox.classList.toggle("hidden");

  if (fixturesBox.classList.contains("hidden")) {
    toggleBtn.textContent = "View Fixtures 🔥";
  } else {
    toggleBtn.textContent = "Hide Fixtures ❌";
  }
});
