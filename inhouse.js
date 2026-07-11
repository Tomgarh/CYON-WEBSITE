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

document.addEventListener("DOMContentLoaded", function () {

  const btn = document.getElementById("toggleFixtures");
  const box = document.getElementById("fixturesBox");

  if (!btn || !box) return;

  btn.addEventListener("click", () => {
    box.classList.toggle("show");
  });

});