// Revolution - a wheel carousel beside the selected table's art, title and features.
//
// This file does four things, in this order: read the options, draw the wheel, draw the
// selection, and hand every message to core. Input, audio, preloading, layout, the
// loading indicator, attract mode and the backglass and score view pages are core's.

const vpin = new VPinFECore();
window.vpin = vpin;                  // core and its overlays look for this name
window.receiveEvent = receiveEvent;  // core delivers every message through this one

const stage = document.querySelector(".stage");

async function start() {
  vpin.init();

  // Core turns a playfield picture only when asked; this is where it is asked. It is
  // watching before ready: core draws the first table's art before ready resolves.
  new MutationObserver(() => {
    for (const node of artEl.children) {
      node.classList.add("art-media");
      vpin.applyPlayfieldMediaRotation(node);
    }
  }).observe(artEl, { childList: true });

  await vpin.ready;                  // the tables, the options and the layout are in

  // Input. Core moves the wheel, pages it and opens the menu and the collection picker.
  // Select is the one action it leaves to a theme.
  vpin.registerInputHandler((action) => {
    if (action === "select") vpin.launchTable(vpin.getCurrentTableIndex());
  });

  // openCollectionPicker() answers null when there is nothing to pick between.
  if (option("startCollectionSelection", false)) await vpin.openCollectionPicker();

  draw({ reason: "enter" });
  document.body.dataset.ready = "true";
}

// --- 1. Options ---------------------------------------------------------------------
// options.json declares them and carries their defaults; core merges in what the person
// chose. Read them where they are used, so the number always matches what the person sees.

function option(key, fallback) {
  const value = vpin.themeConfig ? vpin.themeConfig[key] : undefined;
  return value === undefined ? fallback : value;
}

// --- 2. The wheel -------------------------------------------------------------------
// Seven cards, five of them in view; the middle card is the selection. The same seven
// are refilled on every move, so a step is the cards slid back into place from where
// their pictures were a moment ago. A list shorter than seven leaves the outer cards
// invisible and keeps the selection in the middle.

const SLOTS = 7;
const MIDDLE = 3;
const SLIDE_MS = 520;
const SLIDE_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";

const trackEl = document.getElementById("track");
const cards = Array.from({ length: SLOTS }, (_, slot) => {
  const el = document.createElement("li");
  el.dataset.offset = String(slot - MIDDLE);
  const img = document.createElement("img");
  img.alt = "";
  const text = document.createElement("span");
  el.append(img, text);
  trackEl.appendChild(el);
  return { el, img, text };
});

function drawWheel(list) {
  const shown = Math.min(SLOTS, list.length);
  const before = Math.min(MIDDLE, Math.floor((shown - 1) / 2));
  const after = shown - 1 - before;

  cards.forEach((card, slot) => {
    const offset = slot - MIDDLE;
    const used = offset >= -before && offset <= after;
    card.el.style.visibility = used ? "visible" : "hidden";
    if (!used) return;

    const index = list.indexAfter(offset);
    const art = cardArt(list, index);
    card.img.hidden = !art;
    if (art && card.img.getAttribute("src") !== art) card.img.src = art;
    card.text.hidden = Boolean(art);
    card.text.textContent = art ? "" : labelOf(list, index);
  });
}

// What a card shows: the table's wheel, or a collection's picture, or the first wheel in
// the collection. Empty means the card shows the name instead.
function cardArt(list, index) {
  const item = list.items[index];
  if (list.kind === "collection") return item.image_url || (item.game_wheel_urls || [])[0] || "";
  return item.media.includes("wheel") ? vpin.getMediaURL(index, "wheel") : "";
}

function labelOf(list, index) {
  const item = list.items[index];
  return list.kind === "collection" ? item.label : item.game.name;
}

// Slides the wheel one card in the direction the selection moved. The card that is now
// in a slot was in the next slot over a moment ago, so each card also eases from that
// slot's look to its own.
function slide(direction) {
  const sign = direction === "next" ? 1 : -1;
  const animations = [trackEl, ...cards.map((card) => card.el)].flatMap((el) => el.getAnimations());
  animations.forEach((animation) => animation.cancel());

  const down = cards[1].el.offsetTop - cards[0].el.offsetTop;
  const across = cards[1].el.offsetLeft - cards[0].el.offsetLeft;
  const axis = down ? "Y" : "X";
  const step = down || across;

  const looks = cards.map((card) => {
    const { opacity, transform, filter } = getComputedStyle(card.el);
    return { opacity, transform, filter };
  });

  const timing = { duration: SLIDE_MS, easing: SLIDE_EASING };
  trackEl.animate([{ transform: `translate${axis}(${sign * step}px)` }, { transform: "none" }], timing);
  cards.forEach((card, slot) => {
    const from = looks[slot + sign];
    if (from) card.el.animate([from, looks[slot]], timing);
  });
}

// --- 3. The selection ---------------------------------------------------------------
// Everything about the selected table is on its entry. A collection in the picker is a
// row with a name, a count and pictures.

const nameEl = document.getElementById("name");
const eyebrowEl = document.getElementById("eyebrow");
const metaEl = document.getElementById("meta");
const cabEl = document.getElementById("cab");
const artEl = document.getElementById("art");
const featuresEl = document.getElementById("features");
const addonsEl = document.getElementById("addons");
const emptyEl = document.getElementById("empty");

function drawSelection(list) {
  const empty = list.length === 0;
  emptyEl.hidden = !empty;
  emptyEl.textContent = vpin.t("frontend.theme.no_tables_found", "No tables found");
  document.getElementById("features-heading").textContent =
    vpin.t("frontend.theme.detected_features", "Features");
  document.getElementById("addons-heading").textContent = "Add-ons";
  document.getElementById("selection").hidden = empty;
  if (empty) return;

  const picking = list.kind === "collection";
  stage.dataset.view = picking ? "collections" : "tables";
  if (picking) drawCollection(list.current);
  else drawTable(list.current, list.cursor);
}

function drawTable(entry, index) {
  const { game, table, assets } = entry;
  nameEl.textContent = game.name;
  eyebrowEl.textContent = [game.manufacturer, game.year, game.type].filter(Boolean).join(" / ");

  metaEl.textContent = table.authors.join(", ");
  metaEl.hidden = table.authors.length === 0;

  const hasCab = entry.media.includes("cab");
  cabEl.hidden = !hasCab;
  if (hasCab) cabEl.src = vpin.getMediaURL(index, "cab");

  drawTags(featuresEl, [
    ["Nfozzy", table.detects.nfozzy],
    ["Fleep", table.detects.fleep],
    ["SSF", table.detects.ssf],
    ["FastFlips", table.detects.fastflips],
    ["LUT", table.detects.lut],
    ["Scorbit", table.detects.scorbit],
    ["FlexDMD", table.detects.flex],
  ]);
  drawTags(addonsEl, [
    ["AltSound", assets.alt_sound],
    ["AltColor", assets.alt_color],
    ["PuP-Pack", assets.pup_pack],
  ]);
}

function drawCollection(row) {
  nameEl.textContent = row.label;
  eyebrowEl.textContent = row.is_filter ? "Filter collection" : "Collection";
  metaEl.textContent = `${row.table_count} ${row.table_count === 1 ? "Table" : "Tables"}`;
  metaEl.hidden = false;
  cabEl.hidden = true;
}

// Every tag is drawn and the ones the table lacks are dimmed, so the row reads the same
// from table to table.
function drawTags(listEl, tags) {
  listEl.replaceChildren(...tags.map(([label, on]) => {
    const tag = document.createElement("li");
    tag.textContent = label;
    tag.classList.toggle("on", Boolean(on));
    return tag;
  }));
}

// --- 4. Messages --------------------------------------------------------------------
// Core needs to see every message first: it keeps the selection, the audio and the
// loading indicator in step with them. After that the theme draws.
//
// reason says why the wheel moved: "step" is one press and slides, anything else cuts.

async function receiveEvent(message) {
  await vpin.handleEvent(message);

  if (message.type === "TableIndexUpdate") {
    draw(message);
  } else if (message.type === "TableDataChange") {
    draw({ reason: "enter" });
  }
}

function draw(message) {
  const list = vpin.activeList();
  drawWheel(list);
  drawSelection(list);
  if (message.reason === "step" && message.direction && list.length > 1) slide(message.direction);
}

// Last, so every const above is set before start() reads it.
start();
