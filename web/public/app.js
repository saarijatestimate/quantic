const form = document.querySelector("#reservation-form");
const message = document.querySelector("#form-message");
const reservationInput = form?.elements.reservationAt;
const submitButton = form?.querySelector('button[type="submit"]');

function localDateTimeString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const earliestReservation = new Date();
earliestReservation.setMinutes(Math.ceil(earliestReservation.getMinutes() / 30) * 30, 0, 0);
const defaultReservation = new Date();
defaultReservation.setDate(defaultReservation.getDate() + 1);
defaultReservation.setHours(19, 0, 0, 0);
if (reservationInput) {
  reservationInput.min = localDateTimeString(earliestReservation);
  reservationInput.value = localDateTimeString(defaultReservation);
}
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  message.classList.remove("error");
  message.setAttribute("role", "status");
  submitButton.disabled = true;
  submitButton.querySelector("span:first-child").textContent = "Saving your table…";

  const values = new FormData(form);
  const reservationAt = new Date(values.get("reservationAt"));

  try {
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.get("name"),
        email: values.get("email"),
        phone: values.get("phone"),
        partySize: Number(values.get("partySize")),
        reservationAt: reservationAt.toISOString(),
        newsletterSignup: values.get("newsletterSignup") === "on",
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "We couldn’t save your reservation. Please try again.");

    const savedTime = new Date(result.reservationAt);
    const formattedTime = new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(savedTime);
    message.textContent = `${result.message} Party of ${result.partySize} for ${formattedTime}.`;
    form.reset();
    reservationInput.value = localDateTimeString(defaultReservation);
    form.elements.partySize.value = "2";
  } catch (error) {
    message.setAttribute("role", "alert");
    message.textContent = error.message || "We couldn’t reach the reservation service. Please try again.";
    message.classList.add("error");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span:first-child").textContent = "Find my table";
  }
});

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox?.querySelector(".lightbox-image");
const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
const lightboxClose = lightbox?.querySelector(".lightbox-close");

menuToggle?.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});
navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  }
});

function closeLightbox() {
  lightbox?.classList.remove("open");
  lightbox?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

document.querySelectorAll(".gallery-item img").forEach((image) => {
  image.addEventListener("click", () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    const caption = image.closest("figure")?.querySelector("figcaption")?.textContent || "";
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = caption;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("open")) {
    closeLightbox();
  }
});
