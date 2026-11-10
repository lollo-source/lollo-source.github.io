import { portfolio } from "./projects.js";
import { initProjectScenes } from "./motion.js";

const projects = document.querySelector("#projects");
const players = [];
const supportsAac = document.createElement("audio")
  .canPlayType('audio/mp4; codecs="mp4a.40.2"') !== "";

document.querySelector("#portfolio-name").textContent = portfolio.name;
document.querySelector("#portfolio-role").textContent = portfolio.role;
document.title = portfolio.name + " " + portfolio.role;

if (portfolio.introduction) {
  const scene = document.createElement("article");
  scene.id = "introduction";
  scene.className = "scene scene--intro";
  scene.setAttribute("aria-labelledby", "introduction-title");
  scene.setAttribute("aria-hidden", "false");

  const word = document.createElement("div");
  word.className = "scene-word";
  word.textContent = portfolio.introduction.displayTitle;
  word.setAttribute("aria-hidden", "true");

  const copy = document.createElement("div");
  copy.className = "scene-frame intro-copy";
  copy.tabIndex = -1;
  portfolio.introduction.paragraphs.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    copy.append(paragraph);
  });

  const caption = document.createElement("div");
  caption.className = "scene-caption sr-only";
  const title = document.createElement("h2");
  title.id = "introduction-title";
  title.textContent = portfolio.introduction.displayTitle || portfolio.name;
  caption.append(title);
  scene.append(word, copy, caption);
  projects.append(scene);
}

portfolio.projects.forEach((project) => {
  const initial = projects.children.length === 0;
  const scene = document.createElement("article");
  scene.id = project.id;
  scene.className = "scene " + (project.width > project.height ? "scene--landscape" : "scene--portrait");
  scene.setAttribute("aria-labelledby", project.id + "-title");
  scene.hidden = !initial;
  scene.inert = !initial;
  scene.setAttribute("aria-hidden", String(!initial));
  scene.style.setProperty("--media-ratio", String(project.width / project.height));

  const word = document.createElement("div");
  word.className = "scene-word";
  word.textContent = project.displayTitle || project.title;
  word.setAttribute("aria-hidden", "true");
  if (word.textContent.length <= 4) scene.classList.add("scene--short-word");

  const frame = document.createElement("div");
  frame.className = "scene-frame";
  const video = document.createElement("video");
  video.className = "project-video";
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.width = project.width;
  video.height = project.height;
  video.style.aspectRatio = project.width + " / " + project.height;
  video.poster = project.poster;
  video.muted = false;
  video.defaultMuted = false;
  video.volume = 1;
  video.setAttribute("aria-label", [project.title, project.context].filter(Boolean).join(" "));

  // Embedded browsers without AAC support receive the MP3-audio version.
  const mediaPaths = project.previewVideo
    ? (supportsAac ? [project.video, project.previewVideo] : [project.previewVideo, project.video])
    : [project.video];
  const sources = mediaPaths.map((path) => {
    const source = document.createElement("source");
    source.src = path;
    source.type = "video/mp4";
    video.append(source);
    return source;
  });
  const directLink = document.createElement("a");
  directLink.href = project.video;
  directLink.textContent = "Open " + project.title + " as an MP4";
  video.append(directLink);

  const caption = document.createElement("div");
  caption.className = "scene-caption";
  const title = document.createElement("h2");
  title.id = project.id + "-title";
  const name = document.createElement("span");
  name.className = "project-name";
  name.textContent = project.title;
  title.append(name);
  if (project.context) {
    const context = document.createElement("span");
    context.className = "project-context";
    context.textContent = project.context;
    title.append(" ", context);
  }
  caption.append(title);

  const fallback = document.createElement("p");
  fallback.className = "media-error";
  fallback.id = project.id + "-fallback";
  fallback.hidden = true;
  const retryLink = document.createElement("a");
  retryLink.href = project.video;
  retryLink.textContent = "Open the MP4 directly";
  fallback.append("Unable to load this film. ", retryLink, ".");
  caption.append(fallback);
  const showError = () => {
    fallback.hidden = false;
    video.setAttribute("aria-describedby", fallback.id);
  };
  video.addEventListener("error", showError);
  let failedSources = 0;
  sources.forEach((source) => source.addEventListener("error", () => {
    failedSources += 1;
    if (failedSources === sources.length) showError();
  }));
  video.addEventListener("loadedmetadata", () => {
    fallback.hidden = true;
    video.removeAttribute("aria-describedby");
  });
  video.addEventListener("play", () => {
    if (scene.hidden || scene.getAttribute("aria-hidden") === "true") {
      video.pause();
      return;
    }
    players.forEach((other) => { if (other !== video) other.pause(); });
  });
  players.push(video);
  frame.append(video);
  scene.append(word, frame, caption);
  projects.append(scene);
});

if (portfolio.productions) {
  const production = portfolio.productions;
  const scene = document.createElement("article");
  scene.id = "productions";
  scene.className = "scene scene--music";
  scene.hidden = true;
  scene.inert = true;
  scene.setAttribute("aria-hidden", "true");
  scene.setAttribute("aria-labelledby", "productions-title");

  const word = document.createElement("div");
  word.className = "scene-word";
  word.textContent = production.title;
  word.setAttribute("aria-hidden", "true");

  let destination = null;
  try {
    const url = new URL(production.spotifyUrl);
    if (url.origin === "https://open.spotify.com") destination = url.href;
  } catch {
    // A missing or invalid URL keeps this section visibly noninteractive.
  }

  const frame = document.createElement("div");
  frame.className = "scene-frame";
  const link = document.createElement(destination ? "a" : "div");
  link.className = "spotify-link";
  link.setAttribute("data-scene-focus", "");
  link.setAttribute("aria-describedby", "productions-description");
  if (destination) {
    link.href = destination;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Listen to " + production.title + " on Spotify (opens in a new tab)");
  } else {
    link.tabIndex = -1;
  }

  const orbit = document.createElement("span");
  orbit.className = "spotify-orbit";
  const logo = document.createElement("img");
  logo.className = "spotify-logo";
  logo.src = "./assets/brands/spotify-logo-black.svg";
  logo.alt = "Spotify";
  logo.width = 823;
  logo.height = 225;
  orbit.append(logo);

  const invitation = document.createElement("span");
  invitation.className = "spotify-invitation";
  invitation.append(destination ? "Listen on Spotify" : "Spotify link coming soon");
  if (destination) {
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("viewBox", "0 0 24 24");
    arrow.setAttribute("aria-hidden", "true");
    arrow.setAttribute("focusable", "false");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M6 18 18 6M6 6h12v12");
    arrow.append(path);
    invitation.append(arrow);
  }
  link.append(orbit, invitation);
  frame.append(link);

  const caption = document.createElement("div");
  caption.className = "scene-caption";
  const title = document.createElement("h2");
  title.id = "productions-title";
  title.className = "project-name";
  title.textContent = production.title;
  const description = document.createElement("p");
  description.id = "productions-description";
  description.className = "productions-copy";
  description.textContent = production.description;
  frame.prepend(description);
  caption.classList.add("sr-only");
  caption.append(title);
  scene.append(word, frame, caption);
  projects.append(scene);
}

initProjectScenes({
  container: projects,
  previous: document.querySelector("#previous-project"),
  next: document.querySelector("#next-project"),
  home: document.querySelector("#portfolio-home"),
  announcement: document.querySelector("#scene-announcement"),
  markers: document.querySelector("#project-markers"),
});
