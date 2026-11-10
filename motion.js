// Navigation waits for the animation timeline instead of guessing a timeout.
export function initProjectScenes({ container, previous, next, home, announcement, markers }) {
  const scenes = [...container.children];
  if (!scenes.length) return;
  const stage = container.closest(".stage");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const surface = stage.querySelector(".surface-shape");
  initSurfacePointer(stage, reduced);
  const markerButtons = [];
  let active = 0;
  let transitioning = false;
  let inFlight = [];
  let introAnimations = [];
  let wheelTotal = 0;
  let wheelLocked = false;
  let wheelResetTimer;
  let touchStart = null;
  const base = "translate(-50%, -50%)";
  const easing = "cubic-bezier(.45, 0, .2, 1)";

  function updateControls() {
    previous.disabled = active === 0;
    next.disabled = active === scenes.length - 1;
    markerButtons.forEach((button, index) => {
      if (index === active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  async function goTo(index, source = "wheel") {
    if (transitioning || index === active || index < 0 || index >= scenes.length) return;
    transitioning = true;
    const outgoing = scenes[active];
    const incoming = scenes[index];
    const capture = (selector) => {
      const style = getComputedStyle(outgoing.querySelector(selector));
      return { opacity: style.opacity, transform: style.transform };
    };
    // A quick first gesture continues from the intro's current position.
    const frameStart = capture(".scene-frame");
    const wordStart = capture(".scene-word");
    const captionStart = capture(".scene-caption");
    introAnimations.forEach((animation) => animation.cancel());
    introAnimations = [];
    stage.setAttribute("aria-busy", "true");
    const direction = index > active ? 1 : -1;
    const hadSceneFocus = outgoing.contains(document.activeElement);
    outgoing.querySelector("video")?.pause();
    outgoing.classList.remove("is-current");
    outgoing.classList.add("is-leaving");
    outgoing.inert = true;
    outgoing.setAttribute("aria-hidden", "true");
    incoming.hidden = false;
    incoming.inert = true;
    incoming.setAttribute("aria-hidden", "false");
    incoming.classList.add("is-entering");
    active = index;
    updateControls();

    // Reduced motion keeps a short directional slide without zoom or rotation.
    // Both paths remain continuous instead of becoming a quick page swap.
    const small = reduced.matches;
    const outDuration = small ? 280 : 420;
    const inDuration = small ? 760 : 1040;
    const delay = small ? 120 : 180;
    const travel = (small ? 48 : 110) * direction;
    const exit = (small ? 24 : 68) * direction;
    const animations = [];
    function animate(element, frames, options) {
      const animation = element.animate(frames, { fill: "both", easing, ...options });
      animations.push(animation);
      return animation;
    }
    const outgoingFrame = animate(outgoing.querySelector(".scene-frame"), [
      frameStart,
      { opacity: 0, transform: base + " translateY(" + -exit + "px)" },
    ], { duration: outDuration });
    animate(outgoing.querySelector(".scene-word"), [
      wordStart,
      { opacity: 0, transform: "translateY(" + -exit * 0.5 + "px)" },
    ], { duration: outDuration });
    animate(outgoing.querySelector(".scene-caption"), [
      captionStart,
      { opacity: 0, transform: "translateY(" + -direction * 8 + "px)" },
    ], { duration: outDuration * 0.8 });

    animate(incoming.querySelector(".scene-frame"), [
      { opacity: 0, transform: base + " translateY(" + travel + "px)" },
      { opacity: 1, transform: base },
    ], { duration: inDuration, delay });
    animate(incoming.querySelector(".scene-word"), [
      { opacity: 0, transform: "translateY(" + travel * 0.4 + "px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: inDuration, delay: delay * 0.5 });
    animate(incoming.querySelector(".scene-caption"), [
      { opacity: 0, transform: "translateY(" + direction * 12 + "px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: inDuration * 0.85, delay: delay + 100 });

    // Pointer movement uses the outer layer, so scene motion stays independent.
    if (surface) {
      const resting = { transform: "rotate(-7deg)", borderRadius: "48% 52% 46% 54%" };
      const moving = small
        ? { transform: "translateY(" + -direction * 6 + "px) rotate(-7deg)" }
        : {
          transform: "translateY(" + -direction * 14 + "px) rotate(" + (-7 - direction * 4) + "deg) scale(1.045, .96)",
          borderRadius: direction > 0 ? "43% 57% 53% 47%" : "53% 47% 42% 58%",
        };
      animate(surface, [resting, { ...moving, offset: .45 }, resting], { duration: inDuration + delay });
    }

    inFlight = animations;
    outgoingFrame.finished.then(() => { outgoing.hidden = true; }, () => {});
    await Promise.allSettled(animations.map((animation) => animation.finished));
    outgoing.hidden = true;
    outgoing.classList.remove("is-leaving");
    incoming.classList.remove("is-entering");
    incoming.classList.add("is-current");
    incoming.inert = false;
    animations.forEach((animation) => animation.cancel());
    inFlight = [];
    stage.removeAttribute("aria-busy");
    transitioning = false;
    updateControls();
    announcement.textContent = incoming.querySelector("h2").textContent;
    if (source === "keyboard" || hadSceneFocus) {
      incoming.querySelector("video, .intro-copy, [data-scene-focus]")?.focus({ preventScroll: true });
    } else if (source === "button" && document.activeElement === document.body) {
      (next.disabled ? previous : next).focus({ preventScroll: true });
    }
  }

  scenes.forEach((scene, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", scene.querySelector("h2").textContent);
    button.setAttribute("aria-controls", scene.id);
    button.title = scene.querySelector("h2").textContent;
    button.addEventListener("click", () => goTo(index, "button"));
    item.append(button);
    markers.append(item);
    markerButtons.push(button);
  });

  function onVideoControls(event) {
    const video = event.target.closest && event.target.closest("video");
    if (!video) return false;
    const bounds = video.getBoundingClientRect();
    return event.clientY >= bounds.bottom - Math.min(60, bounds.height * 0.25);
  }

  addEventListener("wheel", (event) => {
    if (event.ctrlKey || event.metaKey || document.fullscreenElement ||
        document.pictureInPictureElement || Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        onVideoControls(event)) return;
    event.preventDefault();
    clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => {
      wheelTotal = 0;
      wheelLocked = false;
    }, 190);
    if (transitioning || wheelLocked) return;
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const delta = event.deltaY * multiplier;
    if (wheelTotal && Math.sign(wheelTotal) !== Math.sign(delta)) wheelTotal = 0;
    wheelTotal += delta;
    if (Math.abs(wheelTotal) < 40) return;
    const target = active + Math.sign(wheelTotal);
    wheelTotal = 0;
    if (target < 0 || target >= scenes.length) return;
    wheelLocked = true;
    goTo(target, "wheel");
  }, { passive: false });

  stage.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1 || document.fullscreenElement) {
      touchStart = null;
      return;
    }
    const touch = event.touches[0];
    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      controls: onVideoControls({ target: event.target, clientY: touch.clientY }),
    };
  }, { passive: true });
  stage.addEventListener("touchend", (event) => {
    if (!touchStart || !event.changedTouches.length) return;
    const start = touchStart;
    touchStart = null;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = start.y - touch.clientY;
    if (start.controls || Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx) * 1.25) return;
    if (event.cancelable) event.preventDefault();
    goTo(active + Math.sign(dy), "touch");
  }, { passive: false });
  stage.addEventListener("touchcancel", () => { touchStart = null; });

  addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || document.fullscreenElement ||
        event.target.closest("video, button, a, input, textarea, select, [contenteditable]")) return;
    let target;
    if (["ArrowDown", "ArrowRight", "PageDown"].includes(event.key)) target = active + 1;
    else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) target = active - 1;
    else if (event.key === " ") target = active + (event.shiftKey ? -1 : 1);
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = scenes.length - 1;
    else return;
    event.preventDefault();
    goTo(target, "keyboard");
  });

  previous.addEventListener("click", () => goTo(active - 1, "button"));
  next.addEventListener("click", () => goTo(active + 1, "button"));
  home.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goTo(0, "button");
  });
  reduced.addEventListener("change", () => {
    if (reduced.matches) inFlight.forEach((animation) => animation.finish());
  });

  scenes[0].classList.add("is-current");
  const introTravel = reduced.matches ? 16 : 30;
  introAnimations = [
    scenes[0].querySelector(".scene-frame").animate([
      { opacity: 0, transform: base + " translateY(" + introTravel + "px)" },
      { opacity: 1, transform: base },
    ], { duration: 850, easing, fill: "both" }),
    scenes[0].querySelector(".scene-word").animate([
      { opacity: 0, transform: "translateY(12px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 850, easing, fill: "both" }),
  ];
  const initial = introAnimations;
  Promise.allSettled(initial.map((animation) => animation.finished))
    .then(() => initial.forEach((animation) => animation.cancel()));
  updateControls();
}

function initSurfacePointer(stage, reduced) {
  const surface = stage.querySelector(".stage-surface");
  if (!surface) return;
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  let frame = 0;
  let x = 0;
  let y = 0;

  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    surface.style.removeProperty("transform");
  };
  stage.addEventListener("pointermove", (event) => {
    if (reduced.matches || !pointer.matches || event.pointerType === "touch") return;
    const bounds = stage.getBoundingClientRect();
    x = ((event.clientX - bounds.left) / bounds.width - .5) * 36;
    y = ((event.clientY - bounds.top) / bounds.height - .5) * 24;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      surface.style.transform = "translate3d(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px, 0)";
      frame = 0;
    });
  }, { passive: true });
  stage.addEventListener("pointerleave", reset);
  addEventListener("blur", reset);
  addEventListener("resize", reset);
  reduced.addEventListener("change", reset);
  pointer.addEventListener("change", reset);
}
