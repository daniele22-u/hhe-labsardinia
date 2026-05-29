const pptxgen = require('pptxgenjs');
const path = require('path');

const FIG = path.join(__dirname, 'data', 'figures');
const OUT = path.join(__dirname, 'Marine_Litter_Hazard_Sardinia.pptx');

// ── Palette (Ocean) ──
const NAVY  = '065A82';
const TEAL  = '1C7293';
const AMBER = 'F39C12';
const INK   = '0A1628';
const WHITE = 'FFFFFF';
const LIGHT = 'F4F7F9';
const GREY  = '6B7B8C';
const DARKTX= '1A2A38';
const RED   = 'D7191C';
const BLUE  = '2C7BB6';
const GREEN = '1A9641';

const p = new pptxgen();
p.defineLayout({ name: 'W', width: 13.33, height: 7.5 });
p.layout = 'W';
p.theme = { headFontFace: 'Calibri', bodyFontFace: 'Calibri' };

const W = 13.33, H = 7.5;
const f = name => path.join(FIG, name);

function fit(img, ar, bx, by, bw, bh) {
  let w = bw, h = bw / ar;
  if (h > bh) { h = bh; w = bh * ar; }
  return { path: img, x: bx + (bw - w) / 2, y: by + (bh - h) / 2, w, h };
}

function footer(s, n) {
  s.addText('Marine Litter Hazard · Sardinia · MSFD D10', {
    x: 0.5, y: H - 0.4, w: 8, h: 0.3, fontSize: 8, color: GREY, align: 'left' });
  s.addText(String(n), {
    x: W - 1.0, y: H - 0.4, w: 0.5, h: 0.3, fontSize: 8, color: GREY, align: 'right' });
}

function header(s, title, kicker) {
  s.background = { color: WHITE };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: H, fill: { color: AMBER } });
  if (kicker) s.addText(kicker.toUpperCase(), {
    x: 0.6, y: 0.42, w: 11, h: 0.3, fontSize: 11, color: TEAL, bold: true, charSpacing: 2 });
  s.addText(title, {
    x: 0.6, y: kicker ? 0.72 : 0.5, w: 12, h: 0.7, fontSize: 28, color: NAVY, bold: true });
}

function divider(num, title, sub) {
  const s = p.addSlide();
  s.background = { color: NAVY };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: NAVY } });
  s.addText(num, { x: 0.4, y: 0.2, w: 6, h: 6, fontSize: 300, color: TEAL,
    bold: true, align: 'left', valign: 'middle', transparency: 70 });
  s.addText(title, { x: 0.9, y: 3.0, w: 11.5, h: 1.0, fontSize: 40, color: WHITE, bold: true });
  s.addShape(p.ShapeType.line, { x: 1.0, y: 4.05, w: 2.2, h: 0, line: { color: AMBER, width: 3 } });
  s.addText(sub, { x: 0.95, y: 4.2, w: 11.5, h: 0.6, fontSize: 16, color: 'CADCFC' });
  return s;
}

function stat(s, x, y, big, label, col, w = 2.2) {
  s.addText(big, { x, y, w, h: 0.8, fontSize: 38, color: col || AMBER, bold: true, align: 'center' });
  s.addText(label, { x, y: y + 0.78, w, h: 0.5, fontSize: 11, color: WHITE, align: 'center' });
}

let N = 0;

/* ═══ 1. TITLE ═══ */
{
  const s = p.addSlide();
  s.background = { color: NAVY };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.25, fill: { color: AMBER } });
  s.addText('HHE DATA SCIENCE LABORATORY · POLITECNICO DI MILANO', {
    x: 0.9, y: 1.3, w: 11, h: 0.4, fontSize: 13, color: AMBER, bold: true, charSpacing: 2 });
  s.addText('Marine Litter Hazard Assessment', {
    x: 0.9, y: 1.9, w: 11.5, h: 1.0, fontSize: 46, color: WHITE, bold: true });
  s.addText('in the Sardinian Sea', {
    x: 0.9, y: 2.85, w: 11.5, h: 0.8, fontSize: 36, color: 'CADCFC', italic: true });
  s.addText('A multi-compartment spatial hazard index from ISPRA monitoring data, 2018–2023', {
    x: 0.95, y: 3.85, w: 11, h: 0.5, fontSize: 15, color: 'CADCFC' });
  const sy = 5.0;
  s.addShape(p.ShapeType.line, { x: 0.95, y: sy - 0.2, w: 11.4, h: 0, line: { color: TEAL, width: 1 } });
  stat(s, 0.95, sy, '6', 'BEACH SITES');
  stat(s, 3.25, sy, '21', 'OFFSHORE STATIONS');
  stat(s, 5.55, sy, '6 yrs', '2018 – 2023');
  stat(s, 7.85, sy, '8', 'DATA COMPARTMENTS');
  stat(s, 10.15, sy, 'MSFD', 'DESCRIPTOR 10', WHITE);
  s.addText('ISPRA — Sistema Nazionale Protezione Ambiente · EU Marine Strategy Framework Directive', {
    x: 0.9, y: 6.7, w: 11.5, h: 0.4, fontSize: 11, color: GREY });
  s.addNotes('Opening. This project builds a spatial hazard index for marine litter along the Sardinian coast using six years of ISPRA monitoring data (2018–2023). Eight data compartments feed the index: beach litter, floating litter, microplastics, biological impact on sea turtles, sea currents and tourism pressure. The work aligns with MSFD Descriptor 10 (marine litter). Headline numbers: 6 beach monitoring sites, 21 offshore stations, six annual cycles. Goal today: show how the data was integrated, what spatial patterns emerged, and how spatial statistics confirm them.');
}

/* ═══ 2. RESEARCH QUESTION ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Research Question');
  s.addShape(p.ShapeType.roundRect, { x: 0.9, y: 1.5, w: 11.5, h: 1.55, rectRadius: 0.1, fill: { color: NAVY } });
  s.addText('How is marine-litter hazard spatially distributed along the Sardinian coast, and what temporal and statistical patterns emerge from ISPRA monitoring data (2018–2023)?',
    { x: 1.2, y: 1.6, w: 10.9, h: 1.35, fontSize: 18, color: WHITE, italic: true, valign: 'middle' });
  const cols = [
    ['WHY IT MATTERS', TEAL, [
      'Mediterranean: 7% of global marine plastic, <1% of ocean surface',
      'Sardinia: 1,849 km coastline, 13–16 M tourist-nights/year',
      'Fragile habitats: Posidonia meadows, coralligenous reefs, Caretta caretta',
    ]],
    ['KNOWLEDGE GAP', AMBER, [
      'No unified spatial hazard map for the Sardinian coast',
      'ISPRA data collected but never integrated across compartments',
      'No statistical test of spatial clustering at sub-regional scale',
    ]],
    ['OUR APPROACH', NAVY, [
      'IPCC hazard framework at 12 km grid resolution',
      'IDW interpolation + 8 data compartments → composite index',
      'LISA / Moran\'s I / Getis-Ord GI* spatial statistics',
    ]],
  ];
  cols.forEach((c, i) => {
    const x = 0.9 + i * 3.95;
    s.addShape(p.ShapeType.rect, { x, y: 3.5, w: 3.7, h: 0.12, fill: { color: c[1] } });
    s.addText(c[0], { x, y: 3.7, w: 3.7, h: 0.4, fontSize: 14, color: c[1], bold: true });
    s.addText(c[2].map(t => ({ text: t, options: { bullet: { code: '2022' }, color: DARKTX } })),
      { x, y: 4.15, w: 3.7, h: 2.6, fontSize: 12.5, color: DARKTX, lineSpacingMultiple: 1.1, paraSpaceAfter: 8 });
  });
  footer(s, N);
  s.addNotes('The research question is both spatial (where is hazard concentrated) and temporal (how does it change 2018–2023). Why it matters: the Mediterranean is a plastic hotspot and Sardinia combines a very long coastline with heavy seasonal tourism and sensitive habitats. The gap: ISPRA collects rich data but it had never been integrated across compartments or tested statistically at sub-regional scale. Our approach borrows the IPCC hazard framing, interpolates each compartment onto a common 12 km grid, builds a weighted composite, then validates the spatial pattern with Moran\'s I, LISA and Getis-Ord GI*.');
}

/* ═══ 3. SECTION 01 DATA ═══ */
{
  const s = divider('1', 'Data', 'Sources · Compartments · Harmonisation'); N++;
  s.addNotes('Section 1 — Data. We cover where the data comes from, the eight compartments, and the harmonisation work needed because ISPRA file schemas drifted between 2018 and 2023.');
}

/* ═══ 4. DATA SOURCES ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'ISPRA MSFD Monitoring Data', '8 data compartments');
  const cards = [
    ['🏖', 'Beach Litter', 'Modulo 4', '6 sites · 36 surveys · items/100 m transect · EU JointList categories'],
    ['🌊', 'Floating Litter', 'Modulo 2-bis', '21 stations · ship-based visual transect · material composition'],
    ['🔬', 'Microplastics', 'Modulo 2', '336 trawl cells/yr (2018–22) · IDW concentration grid'],
    ['🦎', 'Bio Impact', 'D10 strandings', 'Entanglement + ingestion · Caretta caretta · CNR-IAS Oristano'],
    ['🌀', 'Sea Currents', 'CMEMS reanalysis', 'Monthly u/v fields · transport driver · 72 monthly records'],
    ['🧳', 'Tourism', 'ISTAT', 'Annual tourist-nights · anthropogenic pressure proxy'],
  ];
  cards.forEach((c, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.15, y = 1.7 + row * 2.45;
    s.addShape(p.ShapeType.roundRect, { x, y, w: 3.9, h: 2.2, rectRadius: 0.08, fill: { color: LIGHT }, line: { color: 'D8E1E8', width: 1 } });
    s.addShape(p.ShapeType.ellipse, { x: x + 0.25, y: y + 0.25, w: 0.7, h: 0.7, fill: { color: NAVY } });
    s.addText(c[0], { x: x + 0.25, y: y + 0.27, w: 0.7, h: 0.66, fontSize: 22, align: 'center', valign: 'middle' });
    s.addText(c[1], { x: x + 1.1, y: y + 0.28, w: 2.7, h: 0.4, fontSize: 16, color: NAVY, bold: true });
    s.addText(c[2], { x: x + 1.1, y: y + 0.68, w: 2.7, h: 0.3, fontSize: 10, color: AMBER, bold: true });
    s.addText(c[3], { x: x + 0.25, y: y + 1.1, w: 3.45, h: 1.0, fontSize: 11, color: DARKTX, valign: 'top' });
  });
  footer(s, N);
  s.addNotes('Eight compartments, each tied to an ISPRA MSFD module or an open dataset. Beach litter (Modulo 4) is the backbone: items per 100 m transect at 6 sites. Floating litter (Modulo 2-bis) adds offshore signal from 21 stations. Microplastics come from Modulo 2 trawls. Biological impact uses turtle stranding records (entanglement + ingestion) from CNR-IAS Oristano. Sea currents (CMEMS reanalysis) and tourism (ISTAT) are the physical and anthropogenic drivers. Together they let us separate "where litter is" from "what moves or produces it".');
}

/* ═══ 5. DATA HARMONISATION ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Data Harmonisation', 'schema drift 2018 → 2023');
  const hc = t => ({ text: t, options: { bold: true, color: WHITE, fill: { color: NAVY } } });
  const rows = [
    [hc('Issue'), hc('Early format'), hc('Late format'), hc('Unified field')],
    ['Survey ID', 'SampleID', 'CodiceCampionamento', '→ survey_id'],
    ['Item count', 'NumeroItems', 'NumeroOggetti', '→ n_items'],
    ['Transect length', 'Lunghezza', 'LunghezzaTransetto', '→ transect_m'],
    ['Material names', 'Polimeri artificiali', 'Artificial polymer', '→ normalized EN'],
    ['Coordinates', 'missing per row', 'station table', '→ filled per beach_id'],
  ];
  s.addTable(rows, { x: 0.9, y: 1.7, w: 11.5, colW: [2.6, 3.2, 3.4, 2.3],
    border: { type: 'solid', color: 'D8E1E8', pt: 1 }, fill: { color: LIGHT },
    fontSize: 12.5, color: DARKTX, valign: 'middle', rowH: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5], align: 'left' });
  s.addText([{ text: '✓  ', options: { color: TEAL, bold: true } }, { text: 'All beach files normalised to transect_m = 100 m (fixed MSFD protocol)', options: {} }],
    { x: 0.9, y: 5.0, w: 11.5, h: 0.35, fontSize: 13, color: DARKTX });
  s.addText([{ text: '✓  ', options: { color: TEAL, bold: true } }, { text: 'Non-Sardinia records filtered by lat/lon bbox (38.5–41.6 N, 7.8–10.2 E) across all ISPRA modules', options: {} }],
    { x: 0.9, y: 5.4, w: 11.5, h: 0.35, fontSize: 13, color: DARKTX });
  s.addText('Raw XLSX  →  pandas normalize()  →  unified per-compartment CSV  →  dashboard_data.json',
    { x: 0.9, y: 6.1, w: 11.5, h: 0.4, fontSize: 12, color: TEAL, italic: true, bold: true });
  footer(s, N);
  s.addNotes('The biggest practical hurdle was schema drift: column names changed across years (SampleID vs CodiceCampionamento, NumeroItems vs NumeroOggetti) and material names switched between Italian and English. A pandas normalize() step maps every variant to a single unified field. We also fixed the protocol denominator (all transects to 100 m) and filtered out non-Sardinia records by bounding box, because some ISPRA module files mixed regions. End product is one tidy dashboard_data.json that every downstream analysis reads.');
}

/* ═══ 6. SECTION 02 EXPLORATORY ═══ */
{
  const s = divider('2', 'Exploratory Analysis', 'Beach · Floating · Micro · Bio · Pressures'); N++;
  s.addNotes('Section 2 — Exploratory analysis. Compartment by compartment: beach litter trends and composition, floating litter, microplastics, biological impact, and the anthropogenic pressure / COVID natural experiment.');
}

/* ═══ 7. BEACH TRENDS ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Beach Litter — Trend per Station', '2018–2023');
  s.addImage(fit(f('beach_trend_per_station.png'), 1.83, 0.6, 1.5, 7.6, 5.4));
  const x = 8.5;
  s.addText('KEY FINDINGS', { x, y: 1.6, w: 4.3, h: 0.4, fontSize: 13, color: TEAL, bold: true });
  s.addText([
    'Oristano Is Arenas: highest density (avg 1,255 items/100 m)',
    'Alghero Lido: second (avg 734)',
    'San Teodoro La Cinta: lowest (avg 85)',
    'EU indicative threshold: 150 items/100 m',
    'West coast consistently > east coast',
    'Strong inter-annual variability — survey timing & storm events',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 2.1, w: 4.4, h: 4.5, fontSize: 13, color: DARKTX, lineSpacingMultiple: 1.15, paraSpaceAfter: 10 });
  footer(s, N);
  s.addNotes('Beach litter per station over time. The west-coast sites Oristano Is Arenas and Alghero Lido dominate, both far above the EU indicative threshold of 150 items/100 m. East-coast San Teodoro is the cleanest. The west-vs-east gradient is the single most persistent pattern in the whole project and reappears later in the spatial statistics. Note the strong year-to-year swings: these are partly real (storm deposition) and partly survey-timing artefacts, so we avoid over-reading single-year changes.');
}

/* ═══ 8. BEACH COMPOSITION ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Beach Litter — Composition & Source', 'category + sector attribution');
  s.addImage(fit(f('beach_top_categories.png'), 2.20, 0.6, 1.6, 6.0, 2.4));
  s.addImage(fit(f('beach_source_attribution.png'), 2.00, 0.6, 4.1, 6.0, 2.4));
  s.addImage(fit(f('beach_category_by_year.png'), 1.80, 6.9, 1.7, 6.0, 4.6));
  s.addText('Single-use plastics & fishing-related items dominate; shoreline/recreational sources lead the attribution split.',
    { x: 0.6, y: 6.55, w: 6.0, h: 0.45, fontSize: 10, color: GREY, italic: true });
  footer(s, N);
  s.addNotes('Composition: the top categories are dominated by plastic fragments and single-use / fishing-related items, coded with the EU JointList scheme (G79, J79, etc.). The source-attribution chart assigns items to likely origin — shoreline and recreational activities lead, with a sizeable "indeterminate" share that is typical for beached litter. The right-hand stacked chart shows the category mix shifting year to year while plastics remain dominant throughout.');
}

/* ═══ 9. FLOATING ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Floating Litter — Material & Seasonality');
  s.addImage(fit(f('floating_material_pie.png'), 1.14, 0.6, 1.5, 5.0, 4.2));
  s.addImage(fit(f('floating_seasonality.png'), 2.50, 5.9, 1.7, 7.0, 2.3));
  s.addShape(p.ShapeType.roundRect, { x: 5.9, y: 4.3, w: 7.0, h: 1.9, rectRadius: 0.08, fill: { color: LIGHT } });
  s.addText([{ text: '70% ', options: { bold: true, color: NAVY, fontSize: 22 } }, { text: 'of floating litter is artificial polymer (2021–2023)', options: { color: DARKTX, fontSize: 14 } }],
    { x: 6.2, y: 4.5, w: 6.5, h: 0.5 });
  s.addText('Observations stay elevated from late spring through autumn, with secondary peaks driven by seasonal wind & current transport. Beach litter is even more plastic-dominated (84% artificial polymer in 2023).',
    { x: 6.2, y: 5.05, w: 6.5, h: 1.1, fontSize: 13, color: DARKTX, valign: 'top' });
  footer(s, N);
  s.addNotes('Floating litter from the offshore visual transects. About 70% is artificial polymer (plastic), with natural matter making up most of the rest. The monthly observation curve stays high from late spring through autumn, with peaks consistent with wind- and current-driven transport rather than purely local input. For context, beach litter is even more plastic-dominated — 84% artificial polymer in 2023 — so plastics are the common denominator across compartments.');
}

/* ═══ 10. MICROPLASTICS ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Microplastics — IDW Concentration Grid', 'Modulo 2 · 2018–2022');
  s.addImage(fit(f('microplastics_map.png'), 1.76, 0.6, 1.6, 8.3, 5.4));
  const x = 9.2;
  s.addText([
    'Modulo 2 trawl samples interpolated to 336 cells/year',
    'IDW on regular 0.12° grid, coastal-masked',
    'Higher concentrations off west & south coasts',
    'Coverage 2018–2022 (2023 not yet released)',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 1.8, w: 3.7, h: 4.5, fontSize: 13, color: DARKTX, lineSpacingMultiple: 1.2, paraSpaceAfter: 12 });
  footer(s, N);
  s.addNotes('Microplastics from Modulo 2 trawl sampling, interpolated with inverse-distance weighting onto the same 0.12-degree grid and masked to coastal waters. Concentrations are higher off the west and south coasts, broadly echoing the beach-litter gradient. Coverage runs 2018–2022; the 2023 module was not yet released at analysis time. This layer is included in the dashboard as a standalone toggle rather than in the composite, because sampling density is uneven.');
}

/* ═══ 11. BIO IMPACT ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Biological Impact — Sea Turtles', 'entanglement + ingestion · Caretta caretta');
  s.addImage(fit(f('entanglement_map.png'), 0.80, 0.6, 1.6, 3.4, 5.2));
  s.addImage(fit(f('ingestion_map.png'), 0.80, 4.0, 1.6, 3.4, 5.2));
  const x = 7.7;
  s.addShape(p.ShapeType.roundRect, { x, y: 1.7, w: 5.1, h: 2.0, rectRadius: 0.08, fill: { color: NAVY } });
  s.addText('Bio Score = (ENT + ING) / N_max', { x: x + 0.3, y: 1.85, w: 4.6, h: 0.4, fontSize: 16, color: AMBER, bold: true });
  s.addText('Combines entanglement and plastic-ingestion events recorded on stranded loggerhead turtles (~99% Caretta caretta), normalised across years.',
    { x: x + 0.3, y: 2.3, w: 4.6, h: 1.3, fontSize: 12.5, color: WHITE, valign: 'top' });
  s.addText('PEAK 2021', { x, y: 3.95, w: 5.1, h: 0.4, fontSize: 13, color: TEAL, bold: true });
  s.addText([
    '2021: 46 combined events → score 1.00 (peak)',
    '2022: 38 events → 0.72',
    '2018 & 2023: lowest impact (≤18 events)',
    'Ingestion dominated by sheet plastic (SHE) & fragments (FRA)',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 4.4, w: 5.0, h: 2.2, fontSize: 12.5, color: DARKTX, lineSpacingMultiple: 1.15, paraSpaceAfter: 8 });
  footer(s, N);
  s.addNotes('Biological impact translates litter into harm to wildlife. We combine entanglement and ingestion events on stranded loggerhead turtles (about 99% Caretta caretta) into a normalised Bio Score. The signal peaks sharply in 2021 (46 combined events, score 1.0) and stays high in 2022, then drops in 2023. Ingestion is dominated by sheet plastic and fragments. This compartment carries 20% of the composite weight, giving the index a direct ecological dimension rather than counting litter alone.');
}

/* ═══ 12. TOURISM PRESSURE ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Anthropogenic Pressure — Tourism', 'pressure vs. litter signal');
  s.addImage(fit(f('tourism_correlation.png'), 2.85, 0.6, 1.7, 12.1, 3.8));
  const yb = 5.4;
  s.addShape(p.ShapeType.roundRect, { x: 0.9, y: yb, w: 11.5, h: 1.3, rectRadius: 0.08, fill: { color: LIGHT } });
  s.addText([
    { text: 'Tourism is a pressure proxy, not a clean predictor.  ', options: { bold: true, color: NAVY } },
    { text: 'Annual tourist-nights and beach litter are weakly / negatively correlated (Spearman r ≈ −0.44) — high-litter west-coast sites are not the busiest tourist beaches. This points to transport and legacy litter, not just local input.', options: { color: DARKTX } },
  ], { x: 1.2, y: yb + 0.15, w: 10.9, h: 1.0, fontSize: 13, valign: 'middle', lineSpacingMultiple: 1.1 });
  footer(s, N);
  s.addNotes('Tourism is the main anthropogenic pressure, proxied by annual tourist-nights. Intuitively more tourists should mean more litter, but the data shows a weak, even negative correlation (Spearman about −0.44): the dirtiest west-coast beaches are not the busiest tourist destinations. That mismatch is important — it tells us beach litter on this coast is driven substantially by currents and accumulated legacy litter, not only by on-site visitor input. This sets up the COVID natural experiment on the next slides.');
}

/* ═══ 13. CORRELATIONS ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Cross-Compartment Correlations');
  s.addImage(fit(f('correlation_matrix.png'), 1.11, 0.8, 1.6, 5.5, 5.2));
  const x = 7.0;
  s.addText('READING THE MATRIX', { x, y: 1.9, w: 5.5, h: 0.4, fontSize: 13, color: TEAL, bold: true });
  s.addText([
    'Spearman rank correlation across hazard components (annual, all beaches pooled)',
    'Beach litter ↔ tourists: moderate negative (−0.44)',
    'Current speed ↔ floating litter: strong negative (−0.66)',
    'Tourism not a dominant positive driver — supports transport hypothesis',
    'Justifies a weighted composite rather than a single proxy',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 2.4, w: 5.6, h: 4.0, fontSize: 13.5, color: DARKTX, lineSpacingMultiple: 1.2, paraSpaceAfter: 12 });
  footer(s, N);
  s.addNotes('The Spearman correlation matrix quantifies how the compartments relate. Two relationships stand out: beach litter is moderately negatively correlated with tourists (−0.44), reinforcing the previous slide, and current speed is strongly negatively correlated with floating litter (−0.66) — faster currents disperse floating material away from the transects. No single variable dominates positively, which is exactly why we use a weighted composite rather than picking one proxy for hazard.');
}

/* ═══ COVID DIVIDER ═══ */
{
  const s = p.addSlide(); N++;
  s.background = { color: NAVY };
  s.addText('🦠', { x: 0.4, y: 0.6, w: 5.5, h: 5.5, fontSize: 230, align: 'left', valign: 'middle', transparency: 78 });
  s.addText('COVID-19 — A Natural Experiment', { x: 0.9, y: 3.0, w: 11.8, h: 1.0, fontSize: 38, color: WHITE, bold: true });
  s.addShape(p.ShapeType.line, { x: 1.0, y: 4.05, w: 2.2, h: 0, line: { color: AMBER, width: 3 } });
  s.addText('Pre · During · Post — isolating human vs. natural drivers (2018–2023)', { x: 0.95, y: 4.2, w: 11.5, h: 0.6, fontSize: 16, color: 'CADCFC' });
  s.addNotes('Special focus. The 2020 lockdown created an unplanned natural experiment: tourism collapsed for one season while the physical ocean kept running. By splitting the timeline into pre-COVID (2018–19), COVID (2020) and post-COVID (2021–23) we can separate the human-driven part of the litter signal from the current-driven part. The next three slides walk through the period definitions, the measured changes, and what they imply.');
}

/* ═══ COVID 1 — periods & tourism drop ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Three Periods — The Tourism Shock', 'definition & exposure');
  const periods = [
    ['PRE-COVID', '2018 – 2019', TEAL, '14.3 M', 'tourist-nights / yr (baseline)'],
    ['COVID', '2020', RED, '8.7 M', '−39% vs. baseline (lockdown)'],
    ['POST-COVID', '2021 – 2023', GREEN, '13.4 M', 'recovery to ~94% of baseline'],
  ];
  periods.forEach((c, i) => {
    const x = 0.9 + i * 3.95;
    s.addShape(p.ShapeType.roundRect, { x, y: 1.7, w: 3.7, h: 3.0, rectRadius: 0.1, fill: { color: LIGHT }, line: { color: 'D8E1E8', width: 1 } });
    s.addShape(p.ShapeType.rect, { x, y: 1.7, w: 3.7, h: 0.75, fill: { color: c[2] } });
    s.addText(c[0], { x, y: 1.78, w: 3.7, h: 0.35, fontSize: 17, color: WHITE, bold: true, align: 'center' });
    s.addText(c[1], { x, y: 2.12, w: 3.7, h: 0.3, fontSize: 12, color: WHITE, align: 'center' });
    s.addText(c[3], { x, y: 2.75, w: 3.7, h: 0.9, fontSize: 40, color: c[2], bold: true, align: 'center' });
    s.addText(c[4], { x: x + 0.2, y: 3.7, w: 3.3, h: 0.8, fontSize: 12.5, color: DARKTX, align: 'center', valign: 'top' });
  });
  s.addShape(p.ShapeType.roundRect, { x: 0.9, y: 5.05, w: 11.5, h: 1.5, rectRadius: 0.08, fill: { color: NAVY } });
  s.addText([
    { text: 'The design.  ', options: { bold: true, color: AMBER } },
    { text: 'Tourism (the main human pressure) dropped sharply in 2020 while sea currents — the natural transport driver — stayed almost constant (13.2 → 12.4 → 11.8 cm/s). Any litter change that tracks tourism is human-driven; anything that persists is transport / legacy.', options: { color: WHITE } },
  ], { x: 1.2, y: 5.2, w: 10.9, h: 1.2, fontSize: 14, valign: 'middle', lineSpacingMultiple: 1.15 });
  footer(s, N);
  s.addNotes('The setup. Tourist-nights fell from a ~14.3 million baseline to 8.7 million in 2020 — a 39% drop — then recovered to 13.4 million by 2021–23. Crucially, mean current speed barely moved across the three periods (13.2, 12.4, 11.8 cm/s), so the natural transport engine was effectively held constant. That is what makes 2020 a clean lever: if beach litter falls with tourism, the litter has a strong local-human component; if it persists, it is dominated by transport and legacy accumulation. The next slide shows what actually happened.');
}

/* ═══ COVID 2 — measured response ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'COVID Response — What Changed', 'pre · during · post by compartment');
  s.addImage(fit(f('covid_comparison.png'), 2.73, 0.55, 1.55, 7.3, 3.4));
  const hc = t => ({ text: t, options: { bold: true, color: WHITE, fill: { color: NAVY } } });
  const rows = [
    [hc('Metric'), hc('Pre'), hc('COVID'), hc('Post')],
    ['Beach litter (mean items/100 m)', '830', '269', '298'],
    ['Beach litter (median)', '324', '176', '288'],
    ['Floating obs (count)', '226', '124', '687'],
    ['Bio events (ENT+ING)', '44', '20', '101'],
    ['Current speed (cm/s)', '13.2', '12.4', '11.8'],
  ];
  s.addTable(rows, { x: 0.6, y: 4.85, w: 8.0, colW: [3.5, 1.5, 1.5, 1.5],
    border: { type: 'solid', color: 'D8E1E8', pt: 1 }, fill: { color: LIGHT },
    fontSize: 11.5, color: DARKTX, valign: 'middle', rowH: 0.31, align: 'center' });
  const x = 9.0;
  s.addText('SIGNAL', { x, y: 4.85, w: 3.8, h: 0.35, fontSize: 13, color: TEAL, bold: true });
  s.addText([
    'Beach litter fell with tourism (−68% mean during COVID)',
    'Currents ~unchanged — natural driver held constant',
    'Floating-obs rise post-COVID is mostly sampling effort',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 5.25, w: 3.9, h: 1.3, fontSize: 11.5, color: DARKTX, lineSpacingMultiple: 1.1, paraSpaceAfter: 5 });
  footer(s, N);
  s.addNotes('The measured response. Beach litter dropped hard during 2020 — mean from 830 to 269 items/100 m, a 68% fall, with the median also down — closely tracking the tourism collapse. Currents were essentially flat, our held-constant control. Floating observations and bio events look higher post-COVID, but a large part of the floating jump (226 → 124 → 687) reflects increased sampling effort in later years, so we read it cautiously. Read the table left to right per row against the period definitions from the previous slide.');
}

/* ═══ COVID 3 — interpretation ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'COVID — Interpretation', 'human vs. natural drivers');
  const cols = [
    ['WHAT IT CONFIRMS', GREEN, [
      'Beach litter has a real local-human component — it fell ~68% when tourism collapsed',
      'Currents (natural driver) stayed constant → good experimental control',
      'Litter did NOT return to pre-COVID mean → legacy litter & transport persist',
    ]],
    ['CAVEATS', AMBER, [
      'Pre-COVID mean inflated by a few extreme surveys (median drop smaller: 324 → 176)',
      'Floating & bio rises post-2020 partly reflect more sampling, not more litter',
      'Single lockdown year → low statistical power, treat as indicative',
    ]],
  ];
  cols.forEach((c, i) => {
    const x = 0.9 + i * 6.1;
    s.addShape(p.ShapeType.rect, { x, y: 1.8, w: 5.6, h: 0.12, fill: { color: c[1] } });
    s.addText(c[0], { x, y: 2.0, w: 5.6, h: 0.5, fontSize: 17, color: c[1], bold: true });
    s.addText(c[2].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
      { x, y: 2.6, w: 5.6, h: 3.6, fontSize: 14, color: DARKTX, lineSpacingMultiple: 1.2, paraSpaceAfter: 12 });
  });
  s.addShape(p.ShapeType.roundRect, { x: 0.9, y: 6.15, w: 11.5, h: 0.7, rectRadius: 0.06, fill: { color: NAVY } });
  s.addText([
    { text: 'Take-away:  ', options: { bold: true, color: AMBER } },
    { text: 'beach litter is partly human-driven and partly transported — which is exactly why a multi-compartment, current-aware hazard index is needed.', options: { color: WHITE } },
  ], { x: 1.2, y: 6.22, w: 10.9, h: 0.55, fontSize: 13.5, valign: 'middle' });
  footer(s, N);
  s.addNotes('Interpretation. The experiment confirms beach litter has a genuine local-human component: it dropped about 68% when tourism collapsed, against a constant-current control. But it did not fall to zero and did not rebound to the pre-COVID mean, so legacy litter and current transport clearly persist. Caveats matter: the pre-COVID mean is inflated by a few extreme surveys (the median fall is gentler, 324 to 176), the post-2020 floating and bio increases partly reflect more sampling, and one lockdown year gives limited statistical power. Bottom line — both human and natural drivers operate, which justifies the multi-compartment, current-aware index.');
}

/* ═══ SECTION 03 HAZARD INDEX ═══ */
{
  const s = divider('3', 'Composite Hazard Index', 'Methodology · Maps · Coastal segments'); N++;
  s.addNotes('Section 3 — the composite hazard index itself: how it is built, what the maps show, and how we refine it from grid cells to coastal municipalities.');
}

/* ═══ METHODOLOGY ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Composite Hazard — Methodology');
  const steps = [
    ['1', 'NORMALISE', 'Min-max each compartment → 0–1 per station. Global normalisation across all years for temporal comparability.'],
    ['2', 'INTERPOLATE', 'IDW on regular 0.12° (~12 km) grid over Sardinia + buffer. 289 cells, coastal-masked.'],
    ['3', 'COMPOSITE', 'Weighted mean: Beach 35% · Plastic 25% · Currents 20% · Bio 20% → hazard score per cell.'],
    ['4', 'CLASSIFY', '5 classes: Very Low <0.2 · Low · Medium · High · Very High >0.8.'],
  ];
  steps.forEach((st, i) => {
    const y = 1.7 + i * 1.25;
    s.addShape(p.ShapeType.ellipse, { x: 0.8, y, w: 0.85, h: 0.85, fill: { color: NAVY } });
    s.addText(st[0], { x: 0.8, y, w: 0.85, h: 0.85, fontSize: 28, color: AMBER, bold: true, align: 'center', valign: 'middle' });
    s.addText(st[1], { x: 1.9, y: y + 0.02, w: 3.0, h: 0.45, fontSize: 17, color: NAVY, bold: true });
    s.addText(st[2], { x: 1.9, y: y + 0.45, w: 10.5, h: 0.7, fontSize: 13, color: DARKTX, valign: 'top' });
  });
  const ly = 6.75, lw = 2.35;
  const leg = [['Very Low', '1A9641'], ['Low', 'A6D96A'], ['Medium', 'FFFFBF'], ['High', 'FDAE61'], ['Very High', 'D7191C']];
  leg.forEach((l, i) => {
    const x = 0.8 + i * lw;
    s.addShape(p.ShapeType.rect, { x, y: ly, w: 0.35, h: 0.3, fill: { color: l[1] }, line: { color: 'CCCCCC', width: 0.5 } });
    s.addText(l[0], { x: x + 0.42, y: ly - 0.02, w: lw - 0.5, h: 0.35, fontSize: 11, color: DARKTX, valign: 'middle' });
  });
  footer(s, N);
  s.addNotes('Four steps. One: normalise every compartment to 0–1 with global min-max, so colours are comparable across years. Two: interpolate each station network onto a common 0.12-degree (~12 km) grid with inverse-distance weighting, 289 cells, masked to the coast. Three: combine with fixed weights — beach 35%, plastic 25%, currents 20%, bio 20% — chosen to keep beach litter primary while giving the ecological and transport signals real influence. Four: classify into five hazard bands. The weights are a defensible default, not a fitted model — easy to adjust in the dashboard.');
}

/* ═══ HAZARD MAP ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Composite Hazard Index — Map', 'beach · floating · composite');
  s.addImage(fit(f('hazard_index_map.png'), 1.96, 0.6, 1.55, 11.5, 5.0));
  s.addText('Beach score · Floating score · Composite hazard.   ● beach stations   ▲ offshore stations',
    { x: 0.6, y: 6.75, w: 12.2, h: 0.4, fontSize: 12, color: GREY, italic: true, align: 'center' });
  footer(s, N);
  s.addNotes('The composite map, shown as three panels: beach score, floating score, and the combined hazard index. The beach panel drives the strong west-coast signal; floating is more diffuse. In the composite (right), the high-hazard zone sits clearly along the west coast around Alghero and Oristano, with the east coast much lower. Markers show the actual station locations so the audience can see where the interpolation is well-supported versus extrapolated.');
}

/* ═══ TEMPORAL ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Temporal Evolution — Hazard 2018–2023');
  s.addImage(fit(f('hazard_temporal_2x2.png'), 0.96, 4.3, 1.5, 5.0, 5.4));
  const x = 0.7;
  s.addText('PATTERNS OVER TIME', { x, y: 1.8, w: 3.4, h: 0.4, fontSize: 13, color: TEAL, bold: true });
  s.addText([
    'Globally-normalised → colours comparable across years',
    'West-coast corridor persists every year',
    'Bio compartment lifts 2021–2022 hazard',
    'No clear monotonic trend — inter-annual variability dominates',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 2.3, w: 3.5, h: 4.0, fontSize: 13, color: DARKTX, lineSpacingMultiple: 1.2, paraSpaceAfter: 12 });
  footer(s, N);
  s.addNotes('Year-by-year hazard maps, globally normalised so colours mean the same thing every year. The headline is stability: the west-coast corridor lights up in every single year. The 2021–2022 maps run a little hotter, lifted by the biological-impact peak. There is no clean upward or downward trend — inter-annual variability dominates over any six-year signal, which is consistent with what we saw in the raw beach data.');
}

/* ═══ COASTAL SEGMENTS ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Coastal Segment Refinement', '126 coastal comuni');
  s.addImage(fit(f('comuni_hazard_map.png'), 1.33, 0.6, 1.55, 7.4, 5.2));
  const x = 8.4;
  s.addText('FROM GRID TO ADMIN UNITS', { x, y: 1.8, w: 4.5, h: 0.4, fontSize: 13, color: TEAL, bold: true });
  s.addText([
    'Grid cells aggregated into 126 coastal municipalities',
    'Shapely point-in-polygon + nearest-centroid fallback',
    'Translates hazard into actionable management units',
    'Supports local policy & clean-up prioritisation',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 2.3, w: 4.5, h: 4.0, fontSize: 13, color: DARKTX, lineSpacingMultiple: 1.2, paraSpaceAfter: 12 });
  footer(s, N);
  s.addNotes('A grid is good for analysis but not for management. Here we aggregate the grid hazard into 126 coastal municipalities using Shapely point-in-polygon assignment, with a nearest-centroid fallback for cells just offshore. The result speaks the language of decision-makers: each comune gets a hazard value per year, so clean-up resources and policy can be prioritised by administrative unit rather than abstract cells.');
}

/* ═══ SECTION 04 SPATIAL STATS ═══ */
{
  const s = divider('4', 'Spatial Autocorrelation', 'Moran’s I · LISA · Getis-Ord GI*'); N++;
  s.addNotes('Section 4 — the statistical core. So far the west-coast pattern is visual. Now we test it: is the clustering real or could it arise by chance? Global Moran\'s I, LISA, and Getis-Ord GI* answer where and how strongly.');
}

/* ═══ SPATIAL METHODOLOGY ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Spatial Statistics — Why & How', 'LEC12 geospatial models');
  const cards = [
    ['Global Moran’s I', NAVY, 'One scalar per year. Tests whether high-hazard cells cluster in space vs. random. Queen contiguity, row-standardised W, 999-permutation p-value.'],
    ['Local Moran’s I (LISA)', TEAL, 'Per-cell statistic → HH / LL / HL / LH. Locates exactly where clustering occurs and flags spatial outliers.'],
    ['Getis-Ord GI*', AMBER, 'Per-cell z-score of local concentration. Grades hotspot / coldspot intensity in standard-deviation units.'],
  ];
  cards.forEach((c, i) => {
    const x = 0.7 + i * 4.15;
    s.addShape(p.ShapeType.roundRect, { x, y: 1.8, w: 3.9, h: 4.3, rectRadius: 0.08, fill: { color: LIGHT }, line: { color: 'D8E1E8', width: 1 } });
    s.addShape(p.ShapeType.rect, { x, y: 1.8, w: 3.9, h: 0.7, fill: { color: c[1] } });
    s.addText(c[0], { x: x + 0.15, y: 1.8, w: 3.6, h: 0.7, fontSize: 16, color: WHITE, bold: true, valign: 'middle' });
    s.addText(c[2], { x: x + 0.3, y: 2.7, w: 3.35, h: 3.2, fontSize: 13.5, color: DARKTX, valign: 'top', lineSpacingMultiple: 1.2 });
  });
  s.addText('Built from scratch in NumPy (no PySAL dependency) — scripts/analysis_10_spatial_models.py',
    { x: 0.7, y: 6.35, w: 12, h: 0.4, fontSize: 12, color: TEAL, italic: true });
  footer(s, N);
  s.addNotes('Three complementary tools, all from the LEC12 geospatial lecture. Global Moran\'s I gives one number per year: is hazard clustered or random? LISA breaks that down per cell into High-High, Low-Low and the two outlier types, so we see exactly where clustering happens. Getis-Ord GI* grades hotspot intensity as a z-score. We use Queen contiguity weights on the grid, row-standardised, with a 999-permutation test for significance. All implemented from scratch in NumPy — no PySAL dependency — in analysis_10_spatial_models.py.');
}

/* ═══ GLOBAL MORAN ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Global Moran’s I — Significant Clustering');
  s.addImage(fit(f('moran_scatter.png'), 1.89, 0.6, 1.5, 7.3, 5.4));
  const x = 8.1;
  const hc = t => ({ text: t, options: { bold: true, color: WHITE, fill: { color: NAVY } } });
  const rows = [
    [hc('Year'), hc("Moran's I"), hc('z'), hc('p')],
    ['2018', '0.965', '31.4', '0.000'],
    ['2019', '0.936', '31.1', '0.000'],
    ['2020', '0.948', '32.0', '0.000'],
    ['2021', '0.943', '30.0', '0.000'],
    ['2022', '0.951', '30.4', '0.000'],
    ['2023', '0.948', '30.4', '0.000'],
  ];
  s.addTable(rows, { x, y: 1.8, w: 4.7, colW: [1.2, 1.7, 0.9, 0.9],
    border: { type: 'solid', color: 'D8E1E8', pt: 1 }, fill: { color: LIGHT },
    fontSize: 13, color: DARKTX, align: 'center', valign: 'middle', rowH: 0.42 });
  s.addText([
    { text: 'I ≈ 0.95 every year, p = 0.000.\n', options: { bold: true, color: NAVY } },
    { text: 'Hazard is strongly and significantly clustered in space — not random noise. The pattern is stable across all six years.', options: { color: DARKTX } },
  ], { x, y: 5.0, w: 4.7, h: 1.6, fontSize: 13.5, valign: 'top', lineSpacingMultiple: 1.15 });
  footer(s, N);
  s.addNotes('Global Moran\'s I is essentially 0.95 every year with p = 0.000 from the permutation test — about 30 standard deviations above the random expectation. In plain terms: the chance that this west-coast clustering is a fluke is effectively zero, and it is remarkably stable across all six years. The Moran scatterplots show the steep positive slope that corresponds to a high I. One caveat to mention: IDW interpolation itself smooths neighbouring cells, so part of this very high autocorrelation is inherited from the interpolation — the direction and significance are robust, the exact magnitude less so.');
}

/* ═══ LISA ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'LISA Cluster Map — Local Moran’s I');
  s.addImage(fit(f('lisa_cluster_map.png'), 1.80, 0.55, 1.5, 8.0, 5.4));
  const x = 8.9;
  const chips = [['HH', RED, 'Hotspot'], ['LL', BLUE, 'Coldspot'], ['HL', 'FDAE61', 'Outlier'], ['LH', 'ABD9E9', 'Outlier']];
  chips.forEach((c, i) => {
    const y = 1.75 + i * 0.5;
    s.addShape(p.ShapeType.rect, { x, y, w: 0.35, h: 0.35, fill: { color: c[1] } });
    s.addText([{ text: c[0] + '  ', options: { bold: true, color: DARKTX } }, { text: c[2], options: { color: GREY } }],
      { x: x + 0.45, y: y - 0.02, w: 3.8, h: 0.4, fontSize: 13, valign: 'middle' });
  });
  s.addText([
    'West coast = HH hotspot (Alghero–Oristano corridor)',
    'East coast = LL coldspot',
    'Zero HL/LH outliers → coherent spatial pattern',
    '~77 HH + ~63 LL significant cells (2023)',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 4.0, w: 4.0, h: 2.5, fontSize: 13, color: DARKTX, lineSpacingMultiple: 1.2, paraSpaceAfter: 10 });
  footer(s, N);
  s.addNotes('LISA localises the clustering. Red cells are High-High hotspots — high hazard surrounded by high hazard — and they form a continuous corridor down the west coast from Alghero to Oristano. Blue Low-Low coldspots cover the east coast. The striking result is zero HL or LH outliers: there are no isolated anomalies, the pattern is spatially coherent. In 2023 roughly 77 hotspot and 63 coldspot cells reach significance. This is the statistical confirmation of the visual story we have been telling since the beach-trend slide.');
}

/* ═══ GI* ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Getis-Ord GI* — Hotspot Intensity');
  s.addImage(fit(f('gi_star_map.png'), 1.74, 0.6, 1.5, 8.2, 5.4));
  const x = 9.1;
  s.addText([
    'Per-cell z-score of local concentration',
    'z > 1.96 → significant hotspot (red)',
    'z < −1.96 → significant coldspot (blue)',
    '~80 hotspot / ~65 coldspot cells per year',
    'Confirms & grades the LISA HH corridor',
  ].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
    { x, y: 1.9, w: 3.8, h: 4.3, fontSize: 13, color: DARKTX, lineSpacingMultiple: 1.2, paraSpaceAfter: 12 });
  footer(s, N);
  s.addNotes('Getis-Ord GI* adds intensity. Where LISA classifies cells into types, GI* gives each cell a continuous z-score of local concentration: above +1.96 is a significant hotspot (red), below −1.96 a significant coldspot (blue). Around 80 hotspot and 65 coldspot cells per year. It tells the same west-vs-east story but lets you rank severity — a hotspot at z = 4 is more intense than one at z = 2 — which is useful for prioritising the worst cells within the corridor.');
}

/* ═══ KEY FINDINGS ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Key Findings');
  const cols = [
    ['HOTSPOTS', RED, [
      'West-coast corridor (Alghero–Oristano) = highest hazard',
      'Oristano Is Arenas: max beach litter (1,255 items/100 m)',
      'East coast (San Teodoro) = statistically-confirmed coldspot',
      'Clustering significant every year (Moran I ≈ 0.95, p < 0.001)',
    ]],
    ['PATTERNS', TEAL, [
      '84% of beach litter is artificial polymer',
      'Floating litter elevated late spring–autumn — current-driven',
      'Bio impact peaks 2021 (turtle strandings)',
      'COVID: beach litter −68% with tourism → human + transport drivers',
    ]],
  ];
  cols.forEach((c, i) => {
    const x = 0.9 + i * 6.1;
    s.addShape(p.ShapeType.rect, { x, y: 1.8, w: 5.6, h: 0.12, fill: { color: c[1] } });
    s.addText(c[0], { x, y: 2.0, w: 5.6, h: 0.5, fontSize: 18, color: c[1], bold: true });
    s.addText(c[2].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
      { x, y: 2.6, w: 5.6, h: 3.8, fontSize: 15, color: DARKTX, lineSpacingMultiple: 1.25, paraSpaceAfter: 14 });
  });
  footer(s, N);
  s.addNotes('Pulling it together. Hotspots: a clear west-coast corridor from Alghero to Oristano, with Oristano Is Arenas the single worst beach, and a statistically-confirmed east-coast coldspot; the clustering is significant every year. Patterns: plastics dominate every compartment, floating litter is seasonal and current-driven, biological impact peaked in 2021, and the COVID experiment showed beach litter is both human- and transport-driven. The novelty versus prior work is the integration of eight compartments plus formal spatial-statistics confirmation.');
}

/* ═══ LIMITATIONS ═══ */
{
  const s = p.addSlide(); N++;
  header(s, 'Limitations & Next Steps');
  const cols = [
    ['LIMITATIONS', AMBER, [
      '6 beach stations → sparse coverage, IDW smooths heavily',
      'Seafloor compartment synthetic (no ISPRA Sardinia module yet)',
      'Scores are relative (min-max), not absolute concentrations',
      'IDW interpolates over land — mitigated by coastal mask',
      'Strong autocorrelation partly inherited from IDW smoothing',
    ]],
    ['NEXT STEPS', NAVY, [
      'Replace synthetic seafloor with real MEDITS trawl data',
      'Bi-variate Moran (beach vs. floating) coupling',
      'Spatial regression: SAR / SEM / GWR for drivers',
      'Validate vs. citizen-science beach clean-ups',
      'Policy brief per coastal comune',
    ]],
  ];
  cols.forEach((c, i) => {
    const x = 0.9 + i * 6.1;
    s.addShape(p.ShapeType.rect, { x, y: 1.8, w: 5.6, h: 0.12, fill: { color: c[1] } });
    s.addText(c[0], { x, y: 2.0, w: 5.6, h: 0.5, fontSize: 18, color: c[1], bold: true });
    s.addText(c[2].map(t => ({ text: t, options: { bullet: { code: '2022' } } })),
      { x, y: 2.6, w: 5.6, h: 4.0, fontSize: 14, color: DARKTX, lineSpacingMultiple: 1.2, paraSpaceAfter: 12 });
  });
  footer(s, N);
  s.addNotes('Honest limitations. Only six beach stations means IDW smooths aggressively and the autocorrelation is partly an artefact of that smoothing. The seafloor compartment is currently synthetic because no Sardinia ISPRA seafloor module was available. Scores are relative, not absolute concentrations, so they compare within this dataset rather than to external thresholds. Next steps: bring in real MEDITS trawl data for seafloor, add bi-variate Moran to couple beach and floating, move to spatial regression (SAR/SEM/GWR) to model drivers, validate against citizen-science clean-up data, and produce a per-comune policy brief.');
}

/* ═══ CLOSING ═══ */
{
  const s = p.addSlide();
  s.background = { color: NAVY };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.25, fill: { color: AMBER } });
  s.addText('Thank You', { x: 0.9, y: 2.2, w: 11.5, h: 1.0, fontSize: 50, color: WHITE, bold: true });
  s.addShape(p.ShapeType.line, { x: 1.0, y: 3.35, w: 2.2, h: 0, line: { color: AMBER, width: 3 } });
  s.addText([
    { text: 'GitHub: ', options: { color: AMBER, bold: true } },
    { text: 'daniele22-u/hhe-labsardinia\n', options: { color: WHITE } },
    { text: 'Data: ', options: { color: AMBER, bold: true } },
    { text: 'ISPRA — Sistema Nazionale per la Protezione dell’Ambiente\n', options: { color: WHITE } },
    { text: 'Framework: ', options: { color: AMBER, bold: true } },
    { text: 'EU Marine Strategy Framework Directive · Descriptor 10\n', options: { color: WHITE } },
    { text: 'Methods: ', options: { color: AMBER, bold: true } },
    { text: 'IDW · Composite Hazard Index · Moran’s I · LISA · Getis-Ord GI*', options: { color: WHITE } },
  ], { x: 0.95, y: 3.7, w: 11.5, h: 2.0, fontSize: 16, lineSpacingMultiple: 1.5 });
  s.addText('HHE Data Science Laboratory · Politecnico di Milano · 2026', {
    x: 0.95, y: 6.4, w: 11.5, h: 0.4, fontSize: 13, color: 'CADCFC' });
  s.addNotes('Closing. To recap: we integrated eight ISPRA compartments into a single spatial hazard index for the Sardinian coast, used a COVID natural experiment to separate human from natural drivers, and confirmed a stable, statistically significant west-coast hotspot corridor with Moran\'s I, LISA and GI*. Everything — data, scripts and an interactive dashboard — is on GitHub. Happy to take questions.');
}

p.writeFile({ fileName: OUT }).then(() => console.log('SAVED:', OUT));
