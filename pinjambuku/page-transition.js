/**
 * Smooth page transition on navigation
 * Add fade-out animation sebelum navigasi ke halaman baru
 */

// Handle navigation links
document.addEventListener("DOMContentLoaded", () => {
  // Get all internal navigation links
  const navLinks = document.querySelectorAll(
    "a[href]:not([href^='http']):not([href^='#']):not([onclick])"
  );

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");

      // Jangan intercept jika link membuka di tab baru
      if (e.ctrlKey || e.metaKey) return;

      e.preventDefault();

      // Apply fade out animation
      document.body.style.animation = "pageOut 0.3s ease-out forwards";

      // Navigate setelah animasi selesai
      setTimeout(() => {
        window.location.href = href;
      }, 300);
    });
  });

  // Also handle logo clicks
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.addEventListener("click", () => {
      document.body.style.animation = "pageOut 0.3s ease-out forwards";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 300);
    });
  }
});
