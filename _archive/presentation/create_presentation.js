const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5

// Color palette
const C = {
  PRIMARY: "065A82",
  SECONDARY: "1C7293",
  ACCENT: "f39c12",
  LIGHT_BG: "F0F6FA",
  WHITE: "FFFFFF",
  LIGHT_BLUE: "a8d4e8",
  DARK_TEXT: "333333",
  GRAY: "666666",
  RED: "e74c3c",
  GREEN: "27ae60",
  YELLOW: "f1c40f",
  ORANGE: "e67e22",
  PURPLE: "8e44ad",
};

const FONT = "Calibri";
const W = 13.33;
const H = 7.5;

// Helper: left accent bar for content slides
function addLeftBar(slide) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: H,
    fill: { color: C.PRIMARY }, line: { color: C.PRIMARY }
  });
}

// Helper: section divider bars
function addDividerBars(slide) {
  // Top bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: 0.08,
    fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
  });
  // Bottom bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 7.42, w: W, h: 0.08,
    fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
  });
}

// ─────────────────────────────────────────────
// SLIDE 1 — Title
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.PRIMARY };

  addDividerBars(sl);

  // Title
  sl.addText("Marine Litter Hazard Assessment\nin the Sardinian Sea", {
    x: 0.5, y: 1.8, w: W - 1, h: 1.4,
    fontFace: FONT, fontSize: 40, bold: true,
    color: C.WHITE, align: "center", valign: "middle"
  });

  // Subtitle
  sl.addText("HHE Data Science Laboratory · Politecnico di Milano", {
    x: 0.5, y: 3.6, w: W - 1, h: 0.55,
    fontFace: FONT, fontSize: 20,
    color: C.LIGHT_BLUE, align: "center", valign: "middle"
  });

  // Bottom label
  sl.addText("MSFD Descriptor 10  ·  ISPRA Data 2020–2023", {
    x: 0.5, y: 5.2, w: W - 1, h: 0.45,
    fontFace: FONT, fontSize: 16,
    color: C.ACCENT, align: "center", valign: "middle"
  });

  // 3 stat boxes
  const boxes = [
    { top: "6 BEACHES", bot: "41 surveys" },
    { top: "14 STATIONS", bot: "710 observations" },
    { top: "4 YEARS", bot: "2020–2023" },
  ];
  const bw = 3.0, bh = 0.8, by = 5.9;
  const totalW = bw * 3 + 0.3 * 2;
  const startX = (W - totalW) / 2;

  boxes.forEach((b, i) => {
    const bx = startX + i * (bw + 0.3);
    sl.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: bx, y: by, w: bw, h: bh,
      fill: { color: C.SECONDARY }, line: { color: C.SECONDARY },
      rectRadius: 0.08
    });
    sl.addText([
      { text: b.top, options: { bold: true, fontSize: 22, color: C.WHITE, breakLine: true } },
      { text: b.bot, options: { fontSize: 13, color: C.LIGHT_BLUE } }
    ], {
      x: bx, y: by, w: bw, h: bh,
      fontFace: FONT, align: "center", valign: "middle"
    });
  });
}

// ─────────────────────────────────────────────
// SLIDE 2 — Research Question
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  // Title
  sl.addText("Research Question", {
    x: 0.5, y: 0.35, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 28, bold: true,
    color: C.PRIMARY
  });

  // Quote box background
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 12.3, h: 1.2,
    fill: { color: C.LIGHT_BG }, line: { color: C.LIGHT_BG }
  });
  // Left border accent
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 0.06, h: 1.2,
    fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
  });
  // Quote text
  sl.addText("How is marine litter hazard spatially distributed along the Sardinian coast,\nand what temporal patterns emerge from ISPRA monitoring data (2020–2023)?", {
    x: 0.7, y: 1.0, w: 12.0, h: 1.2,
    fontFace: FONT, fontSize: 16, italic: true,
    color: C.PRIMARY, valign: "middle"
  });

  // 3 columns
  const cols = [
    {
      x: 0.5, color: C.PRIMARY,
      header: "WHY IT MATTERS",
      body: "Mediterranean: 7% of global marine plastic, <1% of ocean surface\n\nSardinia: 1,849km coastline\n3.5M tourists/year\nFragile marine ecosystems\n(Posidonia, coralligenous)"
    },
    {
      x: 4.65, color: C.SECONDARY,
      header: "KNOWLEDGE GAP",
      body: "No unified spatial hazard map for Sardinian coast\n\nISPRA data collected since 2015 but never spatially analyzed at sub-regional scale"
    },
    {
      x: 8.8, color: C.ACCENT,
      header: "OUR APPROACH",
      body: "IPCC hazard framework at sub-regional scale\n\nIDW interpolation on 10km grid\n\n2 compartments:\nbeach + floating litter"
    },
  ];
  const cw = 3.9, ch = 3.8, cy = 2.5;

  cols.forEach(col => {
    // Body background
    sl.addShape(pres.shapes.RECTANGLE, {
      x: col.x, y: cy, w: cw, h: ch,
      fill: { color: C.LIGHT_BG }, line: { color: "E0ECF4" }
    });
    // Header strip
    sl.addShape(pres.shapes.RECTANGLE, {
      x: col.x, y: cy, w: cw, h: 0.4,
      fill: { color: col.color }, line: { color: col.color }
    });
    sl.addText(col.header, {
      x: col.x, y: cy, w: cw, h: 0.4,
      fontFace: FONT, fontSize: 13, bold: true,
      color: C.WHITE, align: "center", valign: "middle"
    });
    // Body text
    sl.addText(col.body, {
      x: col.x + 0.12, y: cy + 0.48, w: cw - 0.24, h: ch - 0.56,
      fontFace: FONT, fontSize: 13,
      color: C.DARK_TEXT, valign: "top"
    });
  });
}

// ─────────────────────────────────────────────
// SLIDE 3 — Section Divider: DATA
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.PRIMARY };

  // Amber accent line (above the big text)
  sl.addShape(pres.shapes.RECTANGLE, {
    x: (W - 1.5) / 2, y: 2.1, w: 1.5, h: 0.05,
    fill: { color: C.ACCENT }, line: { color: C.ACCENT }
  });

  // Large text
  sl.addText("01 — DATA", {
    x: 0.5, y: 2.2, w: W - 1, h: 1.1,
    fontFace: FONT, fontSize: 54, bold: true,
    color: C.WHITE, align: "center"
  });

  // Teal separator line
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 3.6, w: W, h: 0.06,
    fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
  });

  // Subtitle
  sl.addText("Sources · Structure · Cleaning", {
    x: 0.5, y: 3.8, w: W - 1, h: 0.55,
    fontFace: FONT, fontSize: 22,
    color: C.LIGHT_BLUE, align: "center"
  });
}

// ─────────────────────────────────────────────
// SLIDE 4 — Dataset
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("ISPRA MSFD Monitoring Data", {
    x: 0.5, y: 0.35, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 28, bold: true,
    color: C.PRIMARY
  });

  const cards = [
    {
      x: 0.5, w: 5.9,
      headerColor: C.PRIMARY,
      headerText: "MODULO 4  ·  Beach Litter",
      stats: [
        { num: "6", label: "beaches" },
        { num: "41", label: "surveys" },
        { num: "2020–2023", label: "years" },
      ],
      bullets: [
        "2 surveys/year (spring + autumn)",
        "Metric: items / 100m transect",
        "EU JointListCategory standard",
        "6 sites along Sardinian coast",
      ]
    },
    {
      x: 6.6, w: 5.9,
      headerColor: C.SECONDARY,
      headerText: "MODULO 2BIS  ·  Floating Litter",
      stats: [
        { num: "14", label: "stations" },
        { num: "710", label: "observations" },
        { num: "2021–2023", label: "years" },
      ],
      bullets: [
        "Bimonthly surveys",
        "Metric: observations per station",
        "Ship-based visual transect",
        "Offshore monitoring network",
      ]
    }
  ];

  const cardH = 5.8, cardY = 1.0;

  cards.forEach(card => {
    // Card background
    sl.addShape(pres.shapes.RECTANGLE, {
      x: card.x, y: cardY, w: card.w, h: cardH,
      fill: { color: C.LIGHT_BG }, line: { color: "DDE8F0" }
    });
    // Header strip
    sl.addShape(pres.shapes.RECTANGLE, {
      x: card.x, y: cardY, w: card.w, h: 0.5,
      fill: { color: card.headerColor }, line: { color: card.headerColor }
    });
    sl.addText(card.headerText, {
      x: card.x, y: cardY, w: card.w, h: 0.5,
      fontFace: FONT, fontSize: 14, bold: true,
      color: C.WHITE, align: "center", valign: "middle"
    });

    // Stats row
    const statW = card.w / 3;
    card.stats.forEach((s, i) => {
      const sx = card.x + i * statW;
      const sy = cardY + 0.65;
      sl.addText(s.num, {
        x: sx, y: sy, w: statW, h: 0.5,
        fontFace: FONT, fontSize: 28, bold: true,
        color: C.ACCENT, align: "center"
      });
      sl.addText(s.label, {
        x: sx, y: sy + 0.48, w: statW, h: 0.25,
        fontFace: FONT, fontSize: 11,
        color: C.DARK_TEXT, align: "center"
      });
    });

    // Divider line
    sl.addShape(pres.shapes.RECTANGLE, {
      x: card.x + 0.15, y: cardY + 1.55, w: card.w - 0.3, h: 0.02,
      fill: { color: "C8DCE8" }, line: { color: "C8DCE8" }
    });

    // Bullets
    const bulletItems = card.bullets.map((b, i) => ({
      text: b,
      options: {
        bullet: true,
        fontSize: 13,
        color: C.DARK_TEXT,
        breakLine: i < card.bullets.length - 1
      }
    }));
    sl.addText(bulletItems, {
      x: card.x + 0.2, y: cardY + 1.65, w: card.w - 0.35, h: cardH - 1.75,
      fontFace: FONT, valign: "top"
    });
  });
}

// ─────────────────────────────────────────────
// SLIDE 5 — Data Cleaning / Harmonization
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Data Harmonization", {
    x: 0.5, y: 0.35, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 28, bold: true,
    color: C.PRIMARY
  });

  sl.addText("Schema differences between 2020 and 2023 file formats", {
    x: 0.5, y: 0.85, w: 12.3, h: 0.3,
    fontFace: FONT, fontSize: 14,
    color: C.GRAY
  });

  // Table
  const tableRows = [
    [
      { text: "Issue", options: { bold: true, color: C.WHITE, fill: { color: C.PRIMARY }, fontSize: 13, fontFace: FONT } },
      { text: "2020 Format", options: { bold: true, color: C.WHITE, fill: { color: C.PRIMARY }, fontSize: 13, fontFace: FONT } },
      { text: "2023 Format", options: { bold: true, color: C.WHITE, fill: { color: C.PRIMARY }, fontSize: 13, fontFace: FONT } },
      { text: "Solution", options: { bold: true, color: C.WHITE, fill: { color: C.PRIMARY }, fontSize: 13, fontFace: FONT } },
    ],
    [
      { text: "Survey ID", options: { fill: { color: C.LIGHT_BG }, fontSize: 13, fontFace: FONT } },
      { text: "SampleID", options: { fill: { color: C.LIGHT_BG }, fontSize: 13, fontFace: FONT } },
      { text: "CodiceCampionamento", options: { fill: { color: C.LIGHT_BG }, fontSize: 13, fontFace: FONT } },
      { text: "→ survey_id", options: { fill: { color: C.LIGHT_BG }, fontSize: 13, fontFace: FONT } },
    ],
    [
      { text: "Item count", options: { fill: { color: C.WHITE }, fontSize: 13, fontFace: FONT } },
      { text: "NumeroItems", options: { fill: { color: C.WHITE }, fontSize: 13, fontFace: FONT } },
      { text: "NumeroOggetti", options: { fill: { color: C.WHITE }, fontSize: 13, fontFace: FONT } },
      { text: "→ n_items", options: { fill: { color: C.WHITE }, fontSize: 13, fontFace: FONT } },
    ],
    [
      { text: "Transect length", options: { fill: { color: C.LIGHT_BG }, fontSize: 13, fontFace: FONT } },
      { text: "Lunghezza", options: { fill: { color: C.LIGHT_BG }, fontSize: 13, fontFace: FONT } },
      { text: "LunghezzaTransetto", options: { fill: { color: C.LIGHT_BG }, fontSize: 13, fontFace: FONT } },
      { text: "→ transect_m", options: { fill: { color: C.LIGHT_BG }, fontSize: 13, fontFace: FONT } },
    ],
    [
      { text: "Material names", options: { fill: { color: C.WHITE }, fontSize: 13, fontFace: FONT } },
      { text: "Italian (Polimeri artificiali)", options: { fill: { color: C.WHITE }, fontSize: 13, fontFace: FONT } },
      { text: "English (Artificial polymer)", options: { fill: { color: C.WHITE }, fontSize: 13, fontFace: FONT } },
      { text: "→ normalized EN", options: { fill: { color: C.WHITE }, fontSize: 13, fontFace: FONT } },
    ],
  ];

  sl.addTable(tableRows, {
    x: 0.5, y: 1.3, w: 12.3, h: 2.8,
    border: { pt: 1, color: "C8DCE8" },
    colW: [2.8, 3.0, 3.2, 3.3],
    rowH: 0.52
  });

  // Info box background
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 4.4, w: 12.3, h: 1.0,
    fill: { color: "e8f4f8" }, line: { color: C.SECONDARY, width: 2 }
  });
  sl.addText([
    { text: "✓  All files: transect_m = 100m (fixed MSFD protocol)", options: { breakLine: true } },
    { text: "✓  Missing lat/lon: filled from known station coordinates per beach_id" }
  ], {
    x: 0.65, y: 4.4, w: 12.0, h: 1.0,
    fontFace: FONT, fontSize: 13,
    color: C.PRIMARY, valign: "middle"
  });

  // Flow diagram
  const flowY = 5.65;
  const flowItems = [
    { label: "Raw XLS files", color: C.ACCENT },
    { label: "pandas normalize()", color: C.SECONDARY },
    { label: "Unified CSV", color: "27ae60" },
  ];
  const fwBox = 2.4, fhBox = 0.55;
  const flowStart = (W - (fwBox * 3 + 0.6 * 2)) / 2;

  flowItems.forEach((item, i) => {
    const fx = flowStart + i * (fwBox + 0.6);
    sl.addShape(pres.shapes.RECTANGLE, {
      x: fx, y: flowY, w: fwBox, h: fhBox,
      fill: { color: item.color }, line: { color: item.color }
    });
    sl.addText(item.label, {
      x: fx, y: flowY, w: fwBox, h: fhBox,
      fontFace: FONT, fontSize: 12, bold: true,
      color: C.WHITE, align: "center", valign: "middle"
    });
    // Arrow between boxes
    if (i < flowItems.length - 1) {
      sl.addShape(pres.shapes.RECTANGLE, {
        x: fx + fwBox + 0.05, y: flowY + fhBox / 2 - 0.02, w: 0.5, h: 0.04,
        fill: { color: C.DARK_TEXT }, line: { color: C.DARK_TEXT }
      });
      sl.addText("▶", {
        x: fx + fwBox + 0.35, y: flowY + fhBox / 2 - 0.15, w: 0.25, h: 0.3,
        fontFace: FONT, fontSize: 12,
        color: C.DARK_TEXT, align: "center"
      });
    }
  });
}

// ─────────────────────────────────────────────
// SLIDE 6 — Section Divider: EDA
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.PRIMARY };

  sl.addShape(pres.shapes.RECTANGLE, {
    x: (W - 1.5) / 2, y: 1.7, w: 1.5, h: 0.05,
    fill: { color: C.ACCENT }, line: { color: C.ACCENT }
  });

  sl.addText("02 — EXPLORATORY\nANALYSIS", {
    x: 0.5, y: 1.8, w: W - 1, h: 1.7,
    fontFace: FONT, fontSize: 48, bold: true,
    color: C.WHITE, align: "center"
  });

  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 3.6, w: W, h: 0.06,
    fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
  });

  sl.addText("Beach litter · Floating litter · Patterns", {
    x: 0.5, y: 3.8, w: W - 1, h: 0.55,
    fontFace: FONT, fontSize: 22,
    color: C.LIGHT_BLUE, align: "center"
  });
}

// ─────────────────────────────────────────────
// SLIDE 7 — Beach Litter Trends
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Beach Litter Trend per Stazione (2020–2023)", {
    x: 0.5, y: 0.3, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 26, bold: true,
    color: C.PRIMARY
  });

  sl.addImage({
    path: "/Users/danieleuras/Documents/GitHub/hhe-labsardinia/data/figures/beach_trend_per_station.png",
    x: 0.5, y: 0.85, w: 7.8, h: 5.5
  });

  // Right panel
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 8.5, y: 0.85, w: 4.5, h: 5.5,
    fill: { color: C.LIGHT_BG }, line: { color: "DDE8F0" }
  });
  sl.addText("Key Findings", {
    x: 8.55, y: 0.9, w: 4.35, h: 0.35,
    fontFace: FONT, fontSize: 14, bold: true,
    color: C.PRIMARY
  });

  const findings = [
    "Oristano: 539 items/100m (highest)",
    "Alghero: 508 items/100m",
    "S.Teodoro: 58 items/100m (lowest)",
    "EU threshold: 150 items/100m",
    "4/6 beaches exceed threshold",
    "West coast > East coast",
  ];

  findings.forEach((f, i) => {
    sl.addText("▶  " + f, {
      x: 8.6, y: 1.35 + i * 0.53, w: 4.3, h: 0.45,
      fontFace: FONT, fontSize: 12,
      color: C.DARK_TEXT
    });
  });

  // Red callout
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 8.55, y: 4.9, w: 4.3, h: 0.7,
    fill: { color: C.RED }, line: { color: C.RED }
  });
  sl.addText("⚠ West coast significantly above EU threshold", {
    x: 8.55, y: 4.9, w: 4.3, h: 0.7,
    fontFace: FONT, fontSize: 12, bold: true,
    color: C.WHITE, align: "center", valign: "middle"
  });
}

// ─────────────────────────────────────────────
// SLIDE 8 — Categories
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Composition & Source Attribution", {
    x: 0.5, y: 0.3, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 28, bold: true,
    color: C.PRIMARY
  });

  sl.addImage({
    path: "/Users/danieleuras/Documents/GitHub/hhe-labsardinia/data/figures/beach_top_categories.png",
    x: 0.4, y: 0.85, w: 6.3, h: 5.8
  });
  sl.addText("Top 10 categories (JointListCategory)", {
    x: 0.4, y: 6.72, w: 6.3, h: 0.25,
    fontFace: FONT, fontSize: 11,
    color: C.GRAY, align: "center"
  });

  sl.addImage({
    path: "/Users/danieleuras/Documents/GitHub/hhe-labsardinia/data/figures/beach_source_attribution.png",
    x: 6.9, y: 0.85, w: 6.0, h: 5.8
  });
  sl.addText("Source attribution (land / sea / fishing)", {
    x: 6.9, y: 6.72, w: 6.0, h: 0.25,
    fontFace: FONT, fontSize: 11,
    color: C.GRAY, align: "center"
  });
}

// ─────────────────────────────────────────────
// SLIDE 9 — Floating Litter
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Floating Litter — Composition & Seasonality", {
    x: 0.5, y: 0.3, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 26, bold: true,
    color: C.PRIMARY
  });

  sl.addImage({
    path: "/Users/danieleuras/Documents/GitHub/hhe-labsardinia/data/figures/floating_material_pie.png",
    x: 0.4, y: 0.85, w: 6.0, h: 5.2
  });

  sl.addImage({
    path: "/Users/danieleuras/Documents/GitHub/hhe-labsardinia/data/figures/floating_seasonality.png",
    x: 6.7, y: 0.85, w: 6.3, h: 5.2
  });

  // Caption bar
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 6.2, w: 12.5, h: 0.7,
    fill: { color: C.LIGHT_BG }, line: { color: "DDE8F0" }
  });
  sl.addText("59% of floating litter is artificial polymer (plastic).  Peak obs: autumn/winter — consistent with seasonal wind/current patterns.", {
    x: 0.4, y: 6.2, w: 12.5, h: 0.7,
    fontFace: FONT, fontSize: 13,
    color: C.PRIMARY, align: "center", valign: "middle"
  });
}

// ─────────────────────────────────────────────
// SLIDE 10 — Section Divider: Hazard Index
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.PRIMARY };

  sl.addShape(pres.shapes.RECTANGLE, {
    x: (W - 1.5) / 2, y: 1.5, w: 1.5, h: 0.05,
    fill: { color: C.ACCENT }, line: { color: C.ACCENT }
  });

  sl.addText("03 — SPATIAL HAZARD\nINDEX", {
    x: 0.5, y: 1.6, w: W - 1, h: 1.9,
    fontFace: FONT, fontSize: 46, bold: true,
    color: C.WHITE, align: "center"
  });

  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 3.6, w: W, h: 0.06,
    fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
  });

  sl.addText("Methodology · Results · Hotspots", {
    x: 0.5, y: 3.9, w: W - 1, h: 0.55,
    fontFace: FONT, fontSize: 22,
    color: C.LIGHT_BLUE, align: "center"
  });
}

// ─────────────────────────────────────────────
// SLIDE 11 — Methodology
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Hazard Index — Methodology", {
    x: 0.5, y: 0.3, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 28, bold: true,
    color: C.PRIMARY
  });

  const steps = [
    {
      x: 0.5, num: "1", title: "NORMALIZE",
      body: "Min-max score 0–1 per station. Global normalization across all years."
    },
    {
      x: 3.6, num: "2", title: "INTERPOLATE",
      body: "IDW on 10km grid. Radius 1.0° beach, 1.2° floating. 289 grid cells."
    },
    {
      x: 6.7, num: "3", title: "COMPOSITE",
      body: "Hazard = mean(beach, floating) per cell. Equal weights."
    },
    {
      x: 9.8, num: "4", title: "CLASSIFY",
      body: "5 classes from Very Low to Very High."
    },
  ];
  const sw = 2.9, sh = 4.2, sy = 1.1;

  steps.forEach(step => {
    // Card
    sl.addShape(pres.shapes.RECTANGLE, {
      x: step.x, y: sy, w: sw, h: sh,
      fill: { color: C.WHITE }, line: { color: "DDE8F0", width: 1 }
    });
    // Top border accent
    sl.addShape(pres.shapes.RECTANGLE, {
      x: step.x, y: sy, w: sw, h: 0.06,
      fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
    });
    // Number circle (amber background)
    sl.addShape(pres.shapes.OVAL, {
      x: step.x + (sw - 0.65) / 2, y: sy + 0.2, w: 0.65, h: 0.65,
      fill: { color: C.ACCENT }, line: { color: C.ACCENT }
    });
    sl.addText(step.num, {
      x: step.x + (sw - 0.65) / 2, y: sy + 0.2, w: 0.65, h: 0.65,
      fontFace: FONT, fontSize: 28, bold: true,
      color: C.WHITE, align: "center", valign: "middle"
    });
    // Title
    sl.addText(step.title, {
      x: step.x + 0.1, y: sy + 1.05, w: sw - 0.2, h: 0.4,
      fontFace: FONT, fontSize: 14, bold: true,
      color: C.PRIMARY, align: "center"
    });
    // Body
    sl.addText(step.body, {
      x: step.x + 0.15, y: sy + 1.55, w: sw - 0.3, h: sh - 1.65,
      fontFace: FONT, fontSize: 12,
      color: C.DARK_TEXT, valign: "top"
    });
  });

  // Legend bar
  const legendItems = [
    { color: C.GREEN, label: "Very Low <0.2" },
    { color: C.YELLOW, label: "Low 0.2–0.4" },
    { color: C.ORANGE, label: "Medium 0.4–0.6" },
    { color: C.RED, label: "High 0.6–0.8" },
    { color: C.PURPLE, label: "V.High >0.8" },
  ];
  const lw = 12.3 / 5, ly = 5.6, lh = 0.7;
  legendItems.forEach((item, i) => {
    sl.addShape(pres.shapes.RECTANGLE, {
      x: 0.5 + i * lw, y: ly, w: lw, h: lh,
      fill: { color: item.color }, line: { color: item.color }
    });
    sl.addText(item.label, {
      x: 0.5 + i * lw, y: ly, w: lw, h: lh,
      fontFace: FONT, fontSize: 12, bold: true,
      color: C.WHITE, align: "center", valign: "middle"
    });
  });
}

// ─────────────────────────────────────────────
// SLIDE 12 — Hazard Map
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Composite Hazard Index — Sardinia 2020–2023", {
    x: 0.5, y: 0.25, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 26, bold: true,
    color: C.PRIMARY
  });

  sl.addImage({
    path: "/Users/danieleuras/Documents/GitHub/hhe-labsardinia/data/figures/hazard_index_map.png",
    x: 0.3, y: 0.85, w: 12.7, h: 5.7
  });

  // Caption strip
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 6.65, w: 12.7, h: 0.6,
    fill: { color: C.LIGHT_BG }, line: { color: "DDE8F0" }
  });
  sl.addText("Left: beach litter score  ·  Center: floating litter score  ·  Right: composite hazard index  |  ● beach stations  ·  ▲ floating stations", {
    x: 0.3, y: 6.65, w: 12.7, h: 0.6,
    fontFace: FONT, fontSize: 12,
    color: C.PRIMARY, align: "center", valign: "middle"
  });
}

// ─────────────────────────────────────────────
// SLIDE 13 — Temporal Evolution
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Temporal Evolution — Hazard Index 2020–2023", {
    x: 0.5, y: 0.25, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 26, bold: true,
    color: C.PRIMARY
  });

  sl.addImage({
    path: "/Users/danieleuras/Documents/GitHub/hhe-labsardinia/data/figures/hazard_temporal_2x2.png",
    x: 0.3, y: 0.85, w: 12.7, h: 5.55
  });

  // Caption strip with amber border
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 6.5, w: 12.7, h: 0.75,
    fill: { color: "fff3cd" }, line: { color: C.ACCENT, width: 2 }
  });
  sl.addText("⚠  Globally normalized scores — colors comparable across years.  2020: beach compartment only.  2021–2023: beach + floating composite.", {
    x: 0.3, y: 6.5, w: 12.7, h: 0.75,
    fontFace: FONT, fontSize: 12,
    color: "856404", align: "center", valign: "middle"
  });
}

// ─────────────────────────────────────────────
// SLIDE 14 — Key Findings
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Key Findings", {
    x: 0.5, y: 0.3, w: 12.5, h: 0.5,
    fontFace: FONT, fontSize: 32, bold: true,
    color: C.PRIMARY
  });

  // Left column: HOTSPOTS
  const lcX = 0.5, lcW = 5.9, lcH = 5.8, lcY = 1.0;
  sl.addShape(pres.shapes.RECTANGLE, {
    x: lcX, y: lcY, w: lcW, h: lcH,
    fill: { color: C.LIGHT_BG }, line: { color: "DDE8F0" }
  });
  sl.addShape(pres.shapes.RECTANGLE, {
    x: lcX, y: lcY, w: lcW, h: 0.45,
    fill: { color: C.PRIMARY }, line: { color: C.PRIMARY }
  });
  sl.addText("HOTSPOTS", {
    x: lcX, y: lcY, w: lcW, h: 0.45,
    fontFace: FONT, fontSize: 14, bold: true,
    color: C.WHITE, align: "center", valign: "middle"
  });

  const hotspots = [
    { dot: "🔴", text: "West coast (Alghero–Oristano): highest hazard" },
    { dot: "🔴", text: "Oristano Is Arenas: beach score 1.00" },
    { dot: "🟠", text: "Alghero Lido: beach score 0.94" },
    { dot: "🟢", text: "San Teodoro La Cinta: score 0.00 (lowest)" },
    { dot: "🔵", text: "3 grid cells: HIGH class (hazard >0.6)" },
  ];
  hotspots.forEach((h, i) => {
    sl.addText(h.dot + "  " + h.text, {
      x: lcX + 0.15, y: lcY + 0.55 + i * 0.5, w: lcW - 0.3, h: 0.45,
      fontFace: FONT, fontSize: 13,
      color: C.DARK_TEXT
    });
  });

  // Stat callout inside left column
  sl.addShape(pres.shapes.RECTANGLE, {
    x: lcX + 0.3, y: lcY + 3.5, w: lcW - 0.6, h: 1.1,
    fill: { color: "EEF5FB" }, line: { color: C.SECONDARY }
  });
  sl.addText("539", {
    x: lcX + 0.3, y: lcY + 3.5, w: lcW - 0.6, h: 0.65,
    fontFace: FONT, fontSize: 42, bold: true,
    color: C.ACCENT, align: "center"
  });
  sl.addText("items/100m  (Oristano peak)", {
    x: lcX + 0.3, y: lcY + 4.1, w: lcW - 0.6, h: 0.35,
    fontFace: FONT, fontSize: 11,
    color: C.DARK_TEXT, align: "center"
  });

  // Right column: PATTERNS
  const rcX = 6.6, rcW = 6.4, rcH = 5.8, rcY = 1.0;
  sl.addShape(pres.shapes.RECTANGLE, {
    x: rcX, y: rcY, w: rcW, h: rcH,
    fill: { color: C.LIGHT_BG }, line: { color: "DDE8F0" }
  });
  sl.addShape(pres.shapes.RECTANGLE, {
    x: rcX, y: rcY, w: rcW, h: 0.45,
    fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
  });
  sl.addText("PATTERNS", {
    x: rcX, y: rcY, w: rcW, h: 0.45,
    fontFace: FONT, fontSize: 14, bold: true,
    color: C.WHITE, align: "center", valign: "middle"
  });

  const patterns = [
    "59% floating litter = artificial polymer",
    "Beach litter peaks: west coast year-round",
    "Floating peaks: autumn/winter",
    "4/6 beaches exceed EU 150 items/100m threshold",
    "Trend: apparent reduction 2020→2021 partly methodological",
  ];
  patterns.forEach((p, i) => {
    sl.addText([{ text: p, options: { bullet: true } }], {
      x: rcX + 0.2, y: rcY + 0.55 + i * 0.5, w: rcW - 0.35, h: 0.45,
      fontFace: FONT, fontSize: 13,
      color: C.DARK_TEXT
    });
  });

  // Stat callout inside right column
  sl.addShape(pres.shapes.RECTANGLE, {
    x: rcX + 0.3, y: rcY + 3.5, w: rcW - 0.6, h: 1.1,
    fill: { color: "EEF5FB" }, line: { color: C.SECONDARY }
  });
  sl.addText("4/6", {
    x: rcX + 0.3, y: rcY + 3.5, w: rcW - 0.6, h: 0.65,
    fontFace: FONT, fontSize: 42, bold: true,
    color: C.ACCENT, align: "center"
  });
  sl.addText("beaches above EU threshold", {
    x: rcX + 0.3, y: rcY + 4.1, w: rcW - 0.6, h: 0.35,
    fontFace: FONT, fontSize: 11,
    color: C.DARK_TEXT, align: "center"
  });
}

// ─────────────────────────────────────────────
// SLIDE 15 — Limitations & Next Steps
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.WHITE };
  addLeftBar(sl);

  sl.addText("Limitations & Next Steps", {
    x: 0.5, y: 0.3, w: 12.5, h: 0.45,
    fontFace: FONT, fontSize: 28, bold: true,
    color: C.PRIMARY
  });

  // Left: Limitations
  const limX = 0.5, limW = 5.9, limH = 5.6, limY = 1.0;
  sl.addShape(pres.shapes.RECTANGLE, {
    x: limX, y: limY, w: limW, h: limH,
    fill: { color: "fff5f5" }, line: { color: "ffd0d0", width: 1 }
  });
  // Top border
  sl.addShape(pres.shapes.RECTANGLE, {
    x: limX, y: limY, w: limW, h: 0.05,
    fill: { color: C.RED }, line: { color: C.RED }
  });
  sl.addText("⚠ LIMITATIONS", {
    x: limX + 0.15, y: limY + 0.1, w: limW - 0.3, h: 0.38,
    fontFace: FONT, fontSize: 14, bold: true,
    color: "c0392b"
  });

  const limitations = [
    "6 beach stations → sparse, IDW smooths aggressively",
    "Seafloor compartment missing (no MSFD module locally)",
    "Score is relative, not absolute scale",
    "2020 beach-only ≠ 2021–23 composite",
    "obs count ≠ standardized density",
  ];
  const limItems = limitations.map((t, i) => ({
    text: t,
    options: { bullet: true, fontSize: 13, color: C.DARK_TEXT, breakLine: i < limitations.length - 1 }
  }));
  sl.addText(limItems, {
    x: limX + 0.2, y: limY + 0.6, w: limW - 0.35, h: limH - 0.7,
    fontFace: FONT, valign: "top"
  });

  // Right: Next Steps
  const nstX = 6.6, nstW = 6.4, nstH = 5.6, nstY = 1.0;
  sl.addShape(pres.shapes.RECTANGLE, {
    x: nstX, y: nstY, w: nstW, h: nstH,
    fill: { color: "f0fff4" }, line: { color: "b8e8c8", width: 1 }
  });
  // Top border
  sl.addShape(pres.shapes.RECTANGLE, {
    x: nstX, y: nstY, w: nstW, h: 0.05,
    fill: { color: C.GREEN }, line: { color: C.GREEN }
  });
  sl.addText("→ NEXT STEPS", {
    x: nstX + 0.15, y: nstY + 0.1, w: nstW - 0.3, h: 0.38,
    fontFace: FONT, fontSize: 14, bold: true,
    color: "1a7a3a"
  });

  const nextSteps = [
    "Retrieve seafloor data (MEDITS) from ISPRA DB",
    "Add 3rd compartment → complete hazard index",
    "Replace grid with coastal administrative segments",
    "Validate vs citizen science beach cleanup data",
    "Final presentation + policy implications (Phase 4)",
  ];
  const nstItems = nextSteps.map((t, i) => ({
    text: t,
    options: { bullet: true, fontSize: 13, color: C.DARK_TEXT, breakLine: i < nextSteps.length - 1 }
  }));
  sl.addText(nstItems, {
    x: nstX + 0.2, y: nstY + 0.6, w: nstW - 0.35, h: nstH - 0.7,
    fontFace: FONT, valign: "top"
  });
}

// ─────────────────────────────────────────────
// SLIDE 16 — Closing (dark)
// ─────────────────────────────────────────────
{
  const sl = pres.addSlide();
  sl.background = { color: C.PRIMARY };

  addDividerBars(sl);

  sl.addText("Thank You", {
    x: 0.5, y: 1.5, w: W - 1, h: 1.0,
    fontFace: FONT, fontSize: 48, bold: true,
    color: C.WHITE, align: "center"
  });

  // Teal separator line
  sl.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 2.8, w: W - 3, h: 0.05,
    fill: { color: C.SECONDARY }, line: { color: C.SECONDARY }
  });

  // Info lines
  sl.addText("GitHub: daniele22-u/hhe-labsardinia", {
    x: 0.5, y: 3.2, w: W - 1, h: 0.4,
    fontFace: FONT, fontSize: 16,
    color: C.LIGHT_BLUE, align: "center"
  });
  sl.addText("Data: ISPRA — Sistema Nazionale per la Protezione dell'Ambiente", {
    x: 0.5, y: 3.75, w: W - 1, h: 0.35,
    fontFace: FONT, fontSize: 14,
    color: C.WHITE, align: "center"
  });
  sl.addText("Framework: EU Marine Strategy Framework Directive (MSFD) · Descriptor 10", {
    x: 0.5, y: 4.2, w: W - 1, h: 0.35,
    fontFace: FONT, fontSize: 14,
    color: C.WHITE, align: "center"
  });
  sl.addText("HHE Data Science Laboratory · Politecnico di Milano · 2026", {
    x: 0.5, y: 5.0, w: W - 1, h: 0.4,
    fontFace: FONT, fontSize: 16,
    color: C.ACCENT, align: "center"
  });
}

// Save
pres.writeFile({ fileName: "/Users/danieleuras/Documents/GitHub/hhe-labsardinia/Marine_Litter_Hazard_Sardinia.pptx" })
  .then(() => console.log("Presentation saved."))
  .catch(err => { console.error("Error:", err); process.exit(1); });
