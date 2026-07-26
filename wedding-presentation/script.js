(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const currentEl = document.getElementById("current");
  const totalEl = document.getElementById("total");
  const progressBar = document.getElementById("progressBar");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let index = 0;
  let touching = null;

  totalEl.textContent = String(total);

  function goTo(next) {
    const clamped = Math.max(0, Math.min(total - 1, next));
    if (clamped === index && slides[clamped].classList.contains("is-active")) {
      updateChrome();
      return;
    }

    slides[index]?.classList.remove("is-active");
    index = clamped;
    slides[index].classList.add("is-active");
    slides[index].scrollTop = 0;
    updateChrome();
  }

  function updateChrome() {
    currentEl.textContent = String(index + 1);
    progressBar.style.width = `${((index + 1) / total) * 100}%`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    prevBtn.style.opacity = index === 0 ? "0.4" : "1";
    nextBtn.style.opacity = index === total - 1 ? "0.4" : "1";
  }

  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  document.querySelectorAll("[data-jump]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = Number(el.getAttribute("data-jump"));
      if (!Number.isNaN(target)) goTo(target);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      goTo(index + 1);
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      goTo(index - 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      goTo(total - 1);
    }
  });

  window.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) < 40) return;
      const active = slides[index];
      const atTop = active.scrollTop <= 0;
      const atBottom = active.scrollTop + active.clientHeight >= active.scrollHeight - 2;
      if (event.deltaY > 0 && atBottom) goTo(index + 1);
      if (event.deltaY < 0 && atTop) goTo(index - 1);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchstart",
    (event) => {
      touching = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    (event) => {
      if (touching == null) return;
      const dx = event.changedTouches[0].clientX - touching;
      touching = null;
      if (Math.abs(dx) < 50) return;
      if (dx < 0) goTo(index + 1);
      else goTo(index - 1);
    },
    { passive: true }
  );

  goTo(0);
})();
