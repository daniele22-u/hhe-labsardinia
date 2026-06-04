const pptxgen = require('pptxgenjs');
const path = require('path');

const FIG = path.join(__dirname, 'data', 'figures');
const OUT = path.join(__dirname, 'Marine_Litter_Hazard_Sardinia.pptx');

// ─── Marine palette ──────────────────────────────────────────
const DEEP   = '0B2340';   // deep ocean
const MID    = '123456';   // mid water
const SURF   = '1A4F72';   // surface
const PANEL  = '0F2C47';   // card bg
const SEAFM  = '4DD9AC';   // seafoam accent (bright)
const WAVE   = '7ECEE3';   // light wave blue
const CORAL  = 'E8654A';   // coral accent
const SAND   = 'F2E6C8';   // sand
const WHITE  = 'EEF6FA';   // off-white text
const MUT    = '8BAFC8';   // muted
const LINE   = '1E4060';   // panel border
const RED    = 'EF4444';
const GREEN  = '34D399';
const AMBER  = 'F59E0B';

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

// Wave decoration — soft undulating line via series of thin rects
function waveBar(s, y, color, opacity = 30) {
  s.addShape(p.ShapeType.rect, {
    x: 0, y, w: W, h: 0.08,
    fill: { color, transparency: opacity },
    line: { type: 'none' }
  });
}

function seaBackground(s) {
  s.background = { color: DEEP };
  // subtle gradient bands (bottom lighter)
  s.addShape(p.ShapeType.rect, { x:0, y:0, w:W, h:H, fill:{color: DEEP} });
  s.addShape(p.ShapeType.rect, { x:0, y:H*0.65, w:W, h:H*0.35, fill:{color:'0D2845', transparency:60} });
  // top wave accent band
  s.addShape(p.ShapeType.rect, { x:0, y:0, w:W, h:0.065, fill:{color:SEAFM} });
  s.addShape(p.ShapeType.rect, { x:W*0.4, y:0, w:W*0.6, h:0.065, fill:{color:WAVE} });
  // bottom footer line
  s.addShape(p.ShapeType.rect, { x:0, y:H-0.52, w:W, h:0.001, fill:{color:LINE} });
}

function footer(s, n) {
  s.addText('Marine Litter Hazard Assessment · Sardinia · MSFD D10', {
    x: 0.6, y: H-0.44, w: 9, h: 0.3, fontSize: 8, color: MUT });
  s.addText(String(n).padStart(2,'0'), {
    x: W-1.1, y: H-0.44, w: 0.8, h: 0.3, fontSize: 9, color: SEAFM, bold: true, align:'right' });
}

// Content slide header — left seafoam rule + title
function header(s, title, kicker) {
  seaBackground(s);
  // left accent bar
  s.addShape(p.ShapeType.rect, { x:0, y:0.065, w:0.12, h:H-0.065, fill:{color:SEAFM} });
  s.addShape(p.ShapeType.rect, { x:0, y:H*0.5, w:0.12, h:H*0.5, fill:{color:WAVE, transparency:30} });
  if (kicker) s.addText(kicker.toUpperCase(), {
    x:0.55, y:0.38, w:12, h:0.3, fontSize:10, color:SEAFM, bold:true, charSpacing:3 });
  s.addText(title, {
    x:0.52, y: kicker ? 0.68 : 0.45, w:12.2, h:0.8, fontSize:30, color:WHITE, bold:true });
  s.addShape(p.ShapeType.rect, { x:0.56, y: kicker ? 1.48 : 1.25, w:1.4, h:0.055, fill:{color:SEAFM} });
}

// Glass panel card
function card(s, x, y, w, h, border) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius:0.07,
    fill:{color:PANEL, transparency:15},
    line:{color: border||LINE, width: border?1.5:1} });
}

// Section divider (full dark + wave motif)
function divider(num, title, sub) {
  const s = p.addSlide();
  seaBackground(s);
  // decorative wave lines
  [1.8, 2.4, 3.0, 3.6].forEach((wy, i) =>
    s.addShape(p.ShapeType.rect, {x:0, y:wy, w:W, h:0.04,
      fill:{color:WAVE, transparency:70+i*6} }));
  // big muted number
  s.addText(num.padStart(2,'0'), { x:7.5, y:0.2, w:5.5, h:6.8,
    fontSize:340, color:SURF, bold:true, align:'right', valign:'middle', transparency:78 });
  // section label
  s.addText('SECTION ' + num.padStart(2,'0'), {
    x:0.9, y:2.4, w:8, h:0.45, fontSize:13, color:SEAFM, bold:true, charSpacing:4 });
  s.addText(title, { x:0.85, y:2.9, w:10, h:1.1, fontSize:46, color:WHITE, bold:true });
  // wave underline
  s.addShape(p.ShapeType.rect, { x:0.92, y:4.1, w:3.0, h:0.07, fill:{color:SEAFM} });
  s.addShape(p.ShapeType.rect, { x:3.92, y:4.1, w:1.5, h:0.07, fill:{color:WAVE, transparency:30} });
  s.addText(sub, { x:0.88, y:4.3, w:11, h:0.6, fontSize:16, color:MUT });
  return s;
}

// Stat number
function stat(s, x, y, big, label, col) {
  s.addText(big, {x, y, w:2.2, h:0.82, fontSize:40, color:col||SEAFM, bold:true, align:'center'});
  s.addText(label, {x, y:y+0.8, w:2.2, h:0.38, fontSize:10, color:MUT, align:'center', charSpacing:1});
}

// Table header cell
const hc = t => ({ text:t, options:{bold:true, color:SEAFM, fill:{color:MID}} });
const tStyle = (extra={}) => ({
  border:{type:'solid', color:LINE, pt:1}, fill:{color:PANEL},
  color:WHITE, valign:'middle', ...extra });

let N = 0;

/* ══════════════════════════════════════════════════════════════
   1. TITLE — clean hero
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide();
  s.background = { color: DEEP };
  s.addShape(p.ShapeType.rect, {x:0, y:0, w:W, h:H, fill:{color:DEEP}});
  // top accent
  s.addShape(p.ShapeType.rect, {x:0, y:0, w:W, h:0.065, fill:{color:SEAFM}});
  s.addShape(p.ShapeType.rect, {x:W*0.45, y:0, w:W*0.55, h:0.065, fill:{color:WAVE}});
  // subtle wave bands mid-slide
  [4.4, 4.9, 5.4].forEach((wy, i) =>
    s.addShape(p.ShapeType.rect, {x:0, y:wy, w:W, h:0.05, fill:{color:WAVE, transparency:76+i*4}}));
  // institution label
  s.addText('HHE Data Science Laboratory · Politecnico di Milano', {
    x:0.9, y:1.1, w:11.5, h:0.38, fontSize:13, color:SEAFM, charSpacing:1.5 });
  // main title — big, spaced
  s.addText('Marine Litter', {
    x:0.85, y:1.65, w:11.6, h:1.15, fontSize:64, color:WHITE, bold:true });
  s.addText('Hazard Assessment', {
    x:0.85, y:2.75, w:11.6, h:0.95, fontSize:48, color:WAVE, bold:true });
  // divider line
  s.addShape(p.ShapeType.rect, {x:0.9, y:3.85, w:2.8, h:0.06, fill:{color:SEAFM}});
  s.addShape(p.ShapeType.rect, {x:3.7, y:3.85, w:1.4, h:0.06, fill:{color:CORAL}});
  // subtitle
  s.addText('Sardinian Sea · ISPRA Monitoring Data 2018–2023 · MSFD Descriptor 10', {
    x:0.9, y:4.1, w:11.5, h:0.5, fontSize:16, color:MUT });
  // footer
  s.addShape(p.ShapeType.rect, {x:0, y:H-0.52, w:W, h:0.001, fill:{color:LINE}});
  s.addText('ISPRA — Sistema Nazionale Protezione Ambiente · EU Marine Strategy Framework Directive', {
    x:0.9, y:6.75, w:11.5, h:0.38, fontSize:10, color:MUT });
  s.addNotes('Opening. This project builds a spatial hazard index for marine litter along the Sardinian coast using six years of ISPRA monitoring data (2018–2023). Eight data compartments were collected: beach litter, floating litter, microplastics, biological impact on sea turtles, sea currents and tourism pressure. The work aligns with MSFD Descriptor 10 (marine litter). Goal today: show how the data was integrated, what spatial patterns emerged, and how spatial statistics confirm them.');
}

/* ══════════════════════════════════════════════════════════════
   2. RESEARCH QUESTION
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Research Question');
  // quote box
  card(s, 0.88, 1.55, 11.55, 1.6, SEAFM);
  s.addText('How is marine-litter hazard distributed along the Sardinian coast, and what temporal and statistical patterns emerge from ISPRA monitoring data (2018–2023)?',
    {x:1.2, y:1.65, w:10.9, h:1.38, fontSize:18.5, color:WHITE, italic:true, valign:'middle'});
  // 3 columns
  const cols = [
    ['WHY IT MATTERS', SEAFM, [
      'Mediterranean: 7% of global marine plastic, <1% of ocean surface',
      'Sardinia: 1,849 km coastline · 13–16 M tourist-nights/year',
      'Fragile habitats: Posidonia meadows, coralligenous reefs, Caretta caretta',
    ]],
    ['KNOWLEDGE GAP', CORAL, [
      'No unified spatial hazard map for the Sardinian coast',
      'ISPRA data collected but never integrated across compartments',
      'No statistical test of spatial clustering at sub-regional scale',
    ]],
    ['OUR APPROACH', WAVE, [
      'IPCC hazard framework at 12 km grid resolution',
      'IDW interpolation + multi-compartment composite index',
      'Moran\'s I · LISA · Getis-Ord GI* spatial statistics',
    ]],
  ];
  cols.forEach((c, i) => {
    const x = 0.88 + i*4.05;
    card(s, x, 3.4, 3.82, 3.3);
    s.addShape(p.ShapeType.rect, {x, y:3.4, w:3.82, h:0.075, fill:{color:c[1]}});
    s.addText(c[0], {x:x+0.22, y:3.58, w:3.45, h:0.42, fontSize:13, color:c[1], bold:true});
    s.addText(c[2].map(t => ({text:t, options:{bullet:{code:'25BA'}, color:WHITE}})),
      {x:x+0.22, y:4.05, w:3.45, h:2.5, fontSize:12.5, color:WHITE, lineSpacingMultiple:1.12, paraSpaceAfter:8});
  });
  footer(s, N);
  s.addNotes('The research question is both spatial (where is hazard concentrated) and temporal (how does it change 2018–2023). Why it matters: the Mediterranean is a plastic hotspot and Sardinia combines a very long coastline with heavy seasonal tourism and sensitive habitats. The gap: ISPRA collects rich data but it had never been integrated across compartments or tested statistically at sub-regional scale. Our approach borrows the IPCC hazard framing, interpolates each compartment onto a common 12 km grid, builds a weighted composite, then validates the spatial pattern with Moran\'s I, LISA and Getis-Ord GI*.');
}

/* ══════════════════════════════════════════════════════════════
   3. SECTION 01
══════════════════════════════════════════════════════════════ */
{
  const s = divider('1', 'Data', 'sources · compartments · harmonisation'); N++;
  s.addNotes('Section 1 — Data. We cover where the data comes from, the eight compartments, and the harmonisation work needed because ISPRA file schemas drifted between 2018 and 2023.');
}

/* ══════════════════════════════════════════════════════════════
   4. DATA SOURCES
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'ISPRA MSFD Monitoring Data', '8 data compartments');
  const items = [
    ['Beach Litter', 'Modulo 4', '6 sites · 36 surveys · items/100 m · EU JointList', SEAFM],
    ['Floating Litter', 'Modulo 2-bis', '21 stations · ship-based visual transect · material composition', WAVE],
    ['Microplastics', 'Modulo 2', '336 trawl cells/yr (2018–22) · IDW concentration grid', SEAFM],
    ['Bio Impact', 'D10 strandings', 'Entanglement + ingestion · Caretta caretta · CNR-IAS Oristano', CORAL],
    ['Sea Currents', 'CMEMS reanalysis', 'Monthly u/v fields · transport driver · 72 records', WAVE],
    ['Tourism', 'ISTAT', 'Annual tourist-nights · anthropogenic pressure proxy', SAND],
  ];
  items.forEach((c, i) => {
    const col = i%3, row = Math.floor(i/3);
    const x = 0.6+col*4.2, y = 1.7+row*2.5;
    card(s, x, y, 3.95, 2.25);
    // top color bar
    s.addShape(p.ShapeType.rect, {x, y, w:3.95, h:0.07, fill:{color:c[3]}});
    s.addText(`0${i+1}`, {x:x+0.2, y:y+0.2, w:0.8, h:0.6, fontSize:28, color:c[3], bold:true, align:'center'});
    s.addText(c[0], {x:x+1.05, y:y+0.22, w:2.7, h:0.4, fontSize:16, color:WHITE, bold:true});
    s.addText(c[1], {x:x+1.05, y:y+0.62, w:2.7, h:0.3, fontSize:10, color:c[3], bold:true});
    s.addText(c[2], {x:x+0.25, y:y+1.08, w:3.5, h:1.0, fontSize:11.5, color:MUT, valign:'top'});
  });
  footer(s, N);
  s.addNotes('Eight compartments, each tied to an ISPRA MSFD module or an open dataset. Beach litter (Modulo 4) is the backbone: items per 100 m transect at 6 sites. Floating litter (Modulo 2-bis) adds offshore signal from 21 stations. Microplastics come from Modulo 2 trawls. Biological impact uses turtle stranding records (entanglement + ingestion) from CNR-IAS Oristano. Sea currents (CMEMS reanalysis) and tourism (ISTAT) are the physical and anthropogenic drivers.');
}

/* ══════════════════════════════════════════════════════════════
   5. HARMONISATION
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Data Harmonisation', 'schema drift 2018 → 2023');
  const rows = [
    [hc('Issue'), hc('Early format'), hc('Late format'), hc('Unified field')],
    ['Survey ID', 'SampleID', 'CodiceCampionamento', '→ survey_id'],
    ['Item count', 'NumeroItems', 'NumeroOggetti', '→ n_items'],
    ['Transect length', 'Lunghezza', 'LunghezzaTransetto', '→ transect_m'],
    ['Material names', 'Polimeri artificiali', 'Artificial polymer', '→ normalized EN'],
    ['Coordinates', 'missing per row', 'station table', '→ filled per beach_id'],
  ];
  s.addTable(rows, tStyle({x:0.88, y:1.72, w:11.55, colW:[2.6,3.2,3.4,2.35],
    fontSize:12.5, rowH:[0.5,0.5,0.5,0.5,0.5,0.5], align:'left'}));
  [[SEAFM,'All beach files normalised to transect_m = 100 m (fixed MSFD protocol)'],
   [WAVE,'Non-Sardinia records filtered by lat/lon bbox (38.5–41.6 N, 7.8–10.2 E) across all modules']
  ].forEach(([col,txt], i) => {
    s.addText([{text:'▸  ', options:{color:col, bold:true}}, {text:txt, options:{color:WHITE}}],
      {x:0.88, y:5.05+i*0.42, w:11.55, h:0.38, fontSize:13});
  });
  card(s, 0.88, 6.08, 11.55, 0.55, SEAFM);
  s.addText('raw XLSX  →  pandas normalize()  →  unified CSV  →  dashboard_data.json',
    {x:1.1, y:6.1, w:11.2, h:0.52, fontSize:12.5, color:SEAFM, italic:true, valign:'middle'});
  footer(s, N);
  s.addNotes('The biggest practical hurdle was schema drift: column names changed across years and material names switched between Italian and English. A pandas normalize() step maps every variant to a single unified field. We also fixed the protocol denominator (all transects to 100 m) and filtered out non-Sardinia records by bounding box. End product is one tidy dashboard_data.json that every downstream analysis reads.');
}

/* ══════════════════════════════════════════════════════════════
   6. SECTION 02
══════════════════════════════════════════════════════════════ */
{
  const s = divider('2', 'Exploratory Analysis', 'beach · floating · micro · bio · pressures'); N++;
  s.addNotes('Section 2 — Exploratory analysis. Compartment by compartment: beach litter trends and composition, floating litter, microplastics, biological impact, and the anthropogenic pressure / COVID natural experiment.');
}

/* ══════════════════════════════════════════════════════════════
   7. BEACH TRENDS
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Beach Litter — Trend per Station', '2018–2023');
  s.addImage(fit(f('beach_trend_per_station.png'), 1.83, 0.55, 1.55, 7.6, 5.4));
  const x = 8.55;
  s.addText('Key Findings', {x, y:1.62, w:4.3, h:0.42, fontSize:14, color:SEAFM, bold:true});
  s.addText([
    'Oristano Is Arenas: highest density (avg 1,255 items/100 m)',
    'Alghero Lido: second (avg 734)',
    'San Teodoro La Cinta: lowest (avg 85)',
    'EU indicative threshold: 150 items/100 m',
    'West coast consistently > east coast',
    'Strong inter-annual variability — survey timing & storms',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}, color:WHITE}})),
    {x, y:2.15, w:4.4, h:4.5, fontSize:13, color:WHITE, lineSpacingMultiple:1.15, paraSpaceAfter:10});
  footer(s, N);
  s.addNotes('Beach litter per station over time. The west-coast sites Oristano Is Arenas and Alghero Lido dominate, both far above the EU indicative threshold of 150 items/100 m. East-coast San Teodoro is the cleanest. The west-vs-east gradient is the single most persistent pattern in the whole project and reappears later in the spatial statistics.');
}

/* ══════════════════════════════════════════════════════════════
   8. BEACH COMPOSITION
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Beach Litter — Composition & Source', 'category + sector attribution');
  s.addImage(fit(f('beach_top_categories.png'), 2.20, 0.55, 1.62, 6.0, 2.35));
  s.addImage(fit(f('beach_source_attribution.png'), 2.00, 0.55, 4.1, 6.0, 2.35));
  s.addImage(fit(f('beach_category_by_year.png'), 1.80, 6.85, 1.68, 6.1, 4.6));
  s.addText('Single-use plastics & fishing-related items dominate; shoreline/recreational sources lead the attribution split.',
    {x:0.55, y:6.55, w:6.0, h:0.45, fontSize:10.5, color:MUT, italic:true});
  footer(s, N);
  s.addNotes('Composition: the top categories are dominated by plastic fragments and single-use / fishing-related items, coded with the EU JointList scheme (G79, J79, etc.). The source-attribution chart assigns items to likely origin — shoreline and recreational activities lead, with a sizeable indeterminate share that is typical for beached litter.');
}

/* ══════════════════════════════════════════════════════════════
   9. FLOATING
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Floating Litter — Material & Seasonality');
  s.addImage(fit(f('floating_material_pie.png'), 1.14, 0.55, 1.52, 5.0, 4.2));
  s.addImage(fit(f('floating_seasonality.png'), 2.50, 5.88, 1.68, 7.0, 2.3));
  card(s, 5.88, 4.28, 7.05, 1.98, SEAFM);
  s.addText([{text:'70%  ', options:{bold:true, color:SEAFM, fontSize:24}},
             {text:'of floating litter is artificial polymer (2021–2023)', options:{color:WHITE, fontSize:14}}],
    {x:6.18, y:4.48, w:6.5, h:0.5});
  s.addText('Observations stay elevated from late spring through autumn, driven by seasonal wind & current transport. Beach litter is even more plastic-dominated — 84% artificial polymer in 2023.',
    {x:6.18, y:5.04, w:6.5, h:1.1, fontSize:13, color:MUT, valign:'top'});
  footer(s, N);
  s.addNotes('Floating litter from the offshore visual transects. About 70% is artificial polymer (plastic). The monthly observation curve stays high from late spring through autumn, with peaks consistent with wind- and current-driven transport rather than purely local input. Beach litter is even more plastic-dominated — 84% artificial polymer in 2023.');
}

/* ══════════════════════════════════════════════════════════════
   10. MICROPLASTICS
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Microplastics — IDW Concentration Grid', 'Modulo 2 · 2018–2022');
  s.addImage(fit(f('microplastics_map.png'), 1.76, 0.55, 1.6, 8.3, 5.4));
  const x = 9.2;
  s.addText([
    'Modulo 2 trawl samples interpolated to 336 cells/year',
    'IDW on regular 0.12° grid, coastal-masked',
    'Higher concentrations off west & south coasts',
    'Coverage 2018–2022 (2023 not yet released)',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
    {x, y:1.85, w:3.7, h:4.5, fontSize:13, color:WHITE, lineSpacingMultiple:1.2, paraSpaceAfter:12});
  footer(s, N);
  s.addNotes('Microplastics from Modulo 2 trawl sampling, interpolated with IDW onto the same 0.12-degree grid and masked to coastal waters. Concentrations are higher off the west and south coasts. Coverage runs 2018–2022; the 2023 module was not yet released. This layer is kept as a standalone toggle rather than in the composite because sampling density is uneven.');
}

/* ══════════════════════════════════════════════════════════════
   11. BIO IMPACT
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Biological Impact — Sea Turtles', 'entanglement + ingestion · Caretta caretta');
  s.addImage(fit(f('entanglement_map.png'), 0.80, 0.55, 1.62, 3.4, 5.2));
  s.addImage(fit(f('ingestion_map.png'), 0.80, 3.98, 1.62, 3.4, 5.2));
  const x = 7.7;
  card(s, x, 1.7, 5.15, 2.05, CORAL);
  s.addText('Bio Score = (ENT + ING) / N_max', {x:x+0.3, y:1.85, w:4.65, h:0.42, fontSize:16, color:CORAL, bold:true});
  s.addText('Combines entanglement and plastic-ingestion events on stranded loggerhead turtles (~99% Caretta caretta), normalised across years.',
    {x:x+0.3, y:2.32, w:4.65, h:1.3, fontSize:12.5, color:WHITE, valign:'top'});
  s.addText('Peak 2021', {x, y:3.98, w:5.15, h:0.4, fontSize:13, color:SEAFM, bold:true});
  s.addText([
    '2021: 46 combined events → score 1.00 (peak)',
    '2022: 38 events → 0.72',
    '2018 & 2023: lowest impact (≤18 events)',
    'Ingestion dominated by sheet plastic (SHE) & fragments (FRA)',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
    {x:x+0.15, y:4.45, w:4.9, h:2.22, fontSize:12.5, color:WHITE, lineSpacingMultiple:1.15, paraSpaceAfter:8});
  footer(s, N);
  s.addNotes('Biological impact translates litter into harm to wildlife. We combine entanglement and ingestion events on stranded loggerhead turtles into a normalised Bio Score. The signal peaks sharply in 2021 (46 combined events, score 1.0) and stays high in 2022, then drops in 2023. Ingestion is dominated by sheet plastic and fragments. This compartment carries 20% of the composite weight.');
}

/* ══════════════════════════════════════════════════════════════
   12. TOURISM
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Anthropogenic Pressure — Tourism', 'pressure vs. litter signal');
  s.addImage(fit(f('tourism_correlation.png'), 2.85, 0.55, 1.72, 12.1, 3.78));
  card(s, 0.88, 5.42, 11.55, 1.32, SEAFM);
  s.addText([
    {text:'Tourism is a pressure proxy, not a clean predictor.  ', options:{bold:true, color:SEAFM}},
    {text:'Annual tourist-nights and beach litter are weakly / negatively correlated (Spearman r ≈ −0.44) — high-litter west-coast sites are not the busiest tourist beaches. This points to transport and legacy litter, not just local input.', options:{color:WHITE}},
  ], {x:1.15, y:5.56, w:10.9, h:1.08, fontSize:13, valign:'middle', lineSpacingMultiple:1.1});
  footer(s, N);
  s.addNotes('Tourism is the main anthropogenic pressure, proxied by annual tourist-nights. Intuitively more tourists should mean more litter, but the data shows a weak, even negative correlation (Spearman about −0.44): the dirtiest west-coast beaches are not the busiest tourist destinations. That mismatch tells us beach litter on this coast is driven substantially by currents and accumulated legacy litter, not only by on-site visitor input.');
}

/* ══════════════════════════════════════════════════════════════
   13. CORRELATIONS
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Cross-Compartment Correlations');
  s.addImage(fit(f('correlation_matrix.png'), 1.11, 0.72, 1.62, 5.5, 5.2));
  const x = 7.0;
  s.addText('Reading the matrix', {x, y:1.88, w:5.5, h:0.4, fontSize:14, color:SEAFM, bold:true});
  s.addText([
    'Spearman rank correlation across hazard components (annual, pooled)',
    'Beach litter ↔ tourists: moderate negative (−0.44)',
    'Current speed ↔ floating litter: strong negative (−0.66)',
    'Tourism not a dominant positive driver — supports transport hypothesis',
    'Justifies a weighted composite rather than a single proxy',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
    {x, y:2.38, w:5.6, h:4.0, fontSize:13.5, color:WHITE, lineSpacingMultiple:1.2, paraSpaceAfter:12});
  footer(s, N);
  s.addNotes('The Spearman correlation matrix. Two relationships stand out: beach litter is moderately negatively correlated with tourists (−0.44) and current speed is strongly negatively correlated with floating litter (−0.66) — faster currents disperse floating material away from the transects. No single variable dominates positively, which is exactly why we use a weighted composite.');
}

/* ══════════════════════════════════════════════════════════════
   14. COVID DIVIDER
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  seaBackground(s);
  // wave bands
  [1.8,2.5,3.2,3.9].forEach((wy,i) =>
    s.addShape(p.ShapeType.rect, {x:0, y:wy, w:W, h:0.05, fill:{color:WAVE, transparency:70+i*5}}));
  s.addText('Special Focus', {x:0.9, y:2.38, w:8, h:0.45, fontSize:13, color:SEAFM, bold:true, charSpacing:3});
  s.addText('COVID-19', {x:0.85, y:2.88, w:10, h:1.1, fontSize:46, color:WHITE, bold:true});
  s.addText('A Natural Experiment', {x:0.85, y:3.95, w:10, h:0.88, fontSize:32, color:WAVE});
  s.addShape(p.ShapeType.rect, {x:0.92, y:5.0, w:3.0, h:0.07, fill:{color:SEAFM}});
  s.addShape(p.ShapeType.rect, {x:3.92, y:5.0, w:1.5, h:0.07, fill:{color:CORAL, transparency:20}});
  s.addText('pre · during · post — isolating human vs. natural drivers (2018–2023)',
    {x:0.88, y:5.2, w:11, h:0.6, fontSize:16, color:MUT});
  s.addNotes('Special focus. The 2020 lockdown created an unplanned natural experiment: tourism collapsed for one season while the physical ocean kept running. By splitting the timeline into pre-COVID (2018–19), COVID (2020) and post-COVID (2021–23) we can separate the human-driven part of the litter signal from the current-driven part.');
}

/* ══════════════════════════════════════════════════════════════
   15. COVID PERIODS
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Three Periods — The Tourism Shock', 'definition & exposure');
  const periods = [
    ['PRE-COVID', '2018–2019', WAVE, '14.3M', 'tourist-nights / yr (baseline)'],
    ['COVID', '2020', CORAL, '8.7M', '−39% vs. baseline (lockdown)'],
    ['POST-COVID', '2021–2023', SEAFM, '13.4M', 'recovery to ~94% of baseline'],
  ];
  periods.forEach((c, i) => {
    const x = 0.88+i*4.05;
    card(s, x, 1.7, 3.82, 3.08, c[2]);
    s.addShape(p.ShapeType.rect, {x, y:1.7, w:3.82, h:0.72, fill:{color:c[2]}});
    s.addText(c[0], {x, y:1.76, w:3.82, h:0.35, fontSize:16, color:DEEP, bold:true, align:'center'});
    s.addText(c[1], {x, y:2.1, w:3.82, h:0.3, fontSize:12, color:DEEP, align:'center'});
    s.addText(c[3], {x, y:2.7, w:3.82, h:0.95, fontSize:46, color:c[2], bold:true, align:'center'});
    s.addText(c[4], {x:x+0.18, y:3.72, w:3.5, h:0.8, fontSize:12.5, color:MUT, align:'center', valign:'top'});
  });
  card(s, 0.88, 5.08, 11.55, 1.55, WAVE);
  s.addText([
    {text:'The design.  ', options:{bold:true, color:SEAFM}},
    {text:'Tourism (the main human pressure) dropped sharply in 2020 while sea currents — the natural transport driver — stayed almost constant (13.2 → 12.4 → 11.8 cm/s). Any litter change that tracks tourism is human-driven; anything that persists is transport / legacy.', options:{color:WHITE}},
  ], {x:1.2, y:5.24, w:10.9, h:1.22, fontSize:14, valign:'middle', lineSpacingMultiple:1.15});
  footer(s, N);
  s.addNotes('The setup. Tourist-nights fell from a ~14.3 million baseline to 8.7 million in 2020 — a 39% drop — then recovered to 13.4 million by 2021–23. Crucially, mean current speed barely moved across the three periods (13.2, 12.4, 11.8 cm/s), so the natural transport engine was effectively held constant. That is what makes 2020 a clean lever.');
}

/* ══════════════════════════════════════════════════════════════
   16. COVID RESPONSE
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'COVID Response — What Changed', 'pre · during · post by compartment');
  s.addImage(fit(f('covid_comparison.png'), 2.73, 0.5, 1.52, 7.3, 3.35));
  const rows = [
    [hc('Metric'), hc('Pre'), hc('COVID'), hc('Post')],
    ['Beach litter (mean items/100 m)', '830', '269', '298'],
    ['Beach litter (median)', '324', '176', '288'],
    ['Floating obs (count)', '226', '124', '687'],
    ['Bio events (ENT+ING)', '44', '20', '101'],
    ['Current speed (cm/s)', '13.2', '12.4', '11.8'],
  ];
  s.addTable(rows, tStyle({x:0.58, y:4.88, w:8.05, colW:[3.5,1.5,1.5,1.55],
    fontSize:11.5, rowH:0.31, align:'center'}));
  const x = 9.0;
  s.addText('Signal', {x, y:4.85, w:3.85, h:0.38, fontSize:14, color:SEAFM, bold:true});
  s.addText([
    'Beach litter fell −68% with tourism collapse',
    'Currents ~unchanged — natural driver held constant',
    'Floating rise post-COVID = mostly sampling effort',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
    {x, y:5.3, w:3.9, h:1.35, fontSize:12, color:WHITE, lineSpacingMultiple:1.1, paraSpaceAfter:6});
  footer(s, N);
  s.addNotes('The measured response. Beach litter dropped hard during 2020 — mean from 830 to 269 items/100 m, a 68% fall — closely tracking the tourism collapse. Currents were essentially flat, our held-constant control. Floating observations and bio events look higher post-COVID, but a large part of the floating jump reflects increased sampling effort in later years.');
}

/* ══════════════════════════════════════════════════════════════
   17. COVID INTERPRETATION
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'COVID — Interpretation', 'human vs. natural drivers');
  const cols = [
    ['What it confirms', GREEN, [
      'Beach litter has a real local-human component — it fell ~68% when tourism collapsed',
      'Currents (natural driver) stayed constant → good experimental control',
      'Litter did NOT return to pre-COVID mean → legacy litter & transport persist',
    ]],
    ['Caveats', AMBER, [
      'Pre-COVID mean inflated by a few extreme surveys (median drop smaller: 324 → 176)',
      'Floating & bio rises post-2020 partly reflect more sampling, not more litter',
      'Single lockdown year → low statistical power, treat as indicative',
    ]],
  ];
  cols.forEach((c, i) => {
    const x = 0.88+i*6.15;
    card(s, x, 1.78, 5.62, 4.08);
    s.addShape(p.ShapeType.rect, {x, y:1.78, w:5.62, h:0.07, fill:{color:c[1]}});
    s.addText(c[0], {x:x+0.25, y:1.97, w:5.22, h:0.5, fontSize:17, color:c[1], bold:true});
    s.addText(c[2].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
      {x:x+0.25, y:2.57, w:5.22, h:3.12, fontSize:14, color:WHITE, lineSpacingMultiple:1.2, paraSpaceAfter:12});
  });
  card(s, 0.88, 6.08, 11.55, 0.72, SEAFM);
  s.addText([
    {text:'Take-away:  ', options:{bold:true, color:SEAFM}},
    {text:'beach litter is partly human-driven and partly transported — which is exactly why a multi-compartment, current-aware hazard index is needed.', options:{color:WHITE}},
  ], {x:1.18, y:6.15, w:10.9, h:0.58, fontSize:13.5, valign:'middle'});
  footer(s, N);
  s.addNotes('Interpretation. The experiment confirms beach litter has a genuine local-human component: it dropped about 68% when tourism collapsed, against a constant-current control. But it did not fall to zero and did not rebound to the pre-COVID mean, so legacy litter and current transport clearly persist. Bottom line — both human and natural drivers operate, which justifies the multi-compartment, current-aware index.');
}

/* ══════════════════════════════════════════════════════════════
   18. SECTION 03
══════════════════════════════════════════════════════════════ */
{
  const s = divider('3', 'Composite Hazard Index', 'methodology · maps · coastal segments'); N++;
  s.addNotes('Section 3 — the composite hazard index itself: how it is built, what the maps show, and how we refine it from grid cells to coastal municipalities.');
}

/* ══════════════════════════════════════════════════════════════
   19. METHODOLOGY
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Composite Hazard — Methodology');
  const steps = [
    ['1','NORMALISE','Min-max each compartment → 0–1 per station. Global normalisation across all years for temporal comparability.', SEAFM],
    ['2','INTERPOLATE','IDW on regular 0.12° (~12 km) grid over Sardinia + buffer. 289 cells, coastal-masked.', WAVE],
    ['3','COMPOSITE','Weighted mean: Beach+Float 35% · Plastic 25% · Currents 20% · Bio 20%.', CORAL],
    ['4','CLASSIFY','5 classes: Very Low <0.2 · Low · Medium · High · Very High >0.8.', AMBER],
  ];
  steps.forEach((st, i) => {
    const y = 1.7+i*1.22;
    // number bubble
    s.addShape(p.ShapeType.ellipse, {x:0.72, y:y+0.0, w:0.88, h:0.88, fill:{color:SURF}});
    s.addText(st[0], {x:0.72, y:y+0.0, w:0.88, h:0.88, fontSize:30, color:st[3], bold:true, align:'center', valign:'middle'});
    s.addShape(p.ShapeType.line, {x:1.78, y:y+0.06, w:0, h:0.76, line:{color:st[3], width:2}});
    s.addText(st[1], {x:1.98, y:y+0.02, w:3.1, h:0.44, fontSize:17, color:st[3], bold:true});
    s.addText(st[2], {x:1.98, y:y+0.46, w:10.4, h:0.7, fontSize:13, color:WHITE, valign:'top'});
  });
  // legend
  const leg=[['Very Low','1A9641'],['Low','A6D96A'],['Medium','FFFFBF'],['High','FDAE61'],['Very High','D7191C']];
  leg.forEach((l, i) => {
    const lx = 0.82+i*2.38;
    s.addShape(p.ShapeType.roundRect, {x:lx, y:6.68, w:0.34, h:0.3, rectRadius:0.04, fill:{color:l[1]}});
    s.addText(l[0], {x:lx+0.42, y:6.64, w:2.0, h:0.38, fontSize:11, color:WHITE, valign:'middle'});
  });
  footer(s, N);
  s.addNotes('Four steps. One: normalise every compartment to 0–1 with global min-max, so colours are comparable across years. Two: interpolate each station network onto a common 0.12-degree (~12 km) grid with IDW, 289 cells, masked to the coast. Three: combine with fixed weights — beach+floating 35%, plastic 25%, currents 20%, bio 20%. Four: classify into five hazard bands. The weights are a defensible default, not a fitted model — easy to adjust in the dashboard.');
}

/* ══════════════════════════════════════════════════════════════
   20. HAZARD MAP
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Composite Hazard Index — Map', 'beach · floating · composite');
  s.addImage(fit(f('hazard_index_map.png'), 1.96, 0.55, 1.55, 11.5, 5.0));
  s.addText('Beach score · Floating score · Composite hazard.   ● beach stations   ▲ offshore stations',
    {x:0.55, y:6.72, w:12.2, h:0.42, fontSize:11.5, color:MUT, italic:true, align:'center'});
  footer(s, N);
  s.addNotes('The composite map, shown as three panels: beach score, floating score, and the combined hazard index. The beach panel drives the strong west-coast signal; floating is more diffuse. In the composite (right), the high-hazard zone sits clearly along the west coast around Alghero and Oristano, with the east coast much lower.');
}

/* ══════════════════════════════════════════════════════════════
   21. TEMPORAL
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Temporal Evolution — Hazard 2018–2023');
  s.addImage(fit(f('hazard_temporal_2x2.png'), 0.96, 4.28, 1.52, 5.02, 5.4));
  const x = 0.65;
  s.addText('Patterns over time', {x, y:1.85, w:3.4, h:0.42, fontSize:14, color:SEAFM, bold:true});
  s.addText([
    'Globally-normalised → colours comparable across years',
    'West-coast corridor persists every year',
    'Bio compartment lifts 2021–2022 hazard',
    'No clear monotonic trend — inter-annual variability dominates',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
    {x, y:2.38, w:3.5, h:4.0, fontSize:13, color:WHITE, lineSpacingMultiple:1.2, paraSpaceAfter:12});
  footer(s, N);
  s.addNotes('Year-by-year hazard maps, globally normalised so colours mean the same thing every year. The headline is stability: the west-coast corridor lights up in every single year. The 2021–2022 maps run a little hotter, lifted by the biological-impact peak. There is no clean upward or downward trend — inter-annual variability dominates over any six-year signal.');
}

/* ══════════════════════════════════════════════════════════════
   22. COASTAL SEGMENTS
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Coastal Segment Refinement', '126 coastal comuni');
  s.addImage(fit(f('comuni_hazard_map.png'), 1.33, 0.55, 1.55, 7.4, 5.2));
  const x = 8.38;
  s.addText('From grid to admin units', {x, y:1.85, w:4.5, h:0.42, fontSize:14, color:SEAFM, bold:true});
  s.addText([
    'Grid cells aggregated into 126 coastal municipalities',
    'Shapely point-in-polygon + nearest-centroid fallback',
    'Translates hazard into actionable management units',
    'Supports local policy & clean-up prioritisation',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
    {x, y:2.38, w:4.5, h:4.0, fontSize:13, color:WHITE, lineSpacingMultiple:1.2, paraSpaceAfter:12});
  footer(s, N);
  s.addNotes('A grid is good for analysis but not for management. Here we aggregate the grid hazard into 126 coastal municipalities using Shapely point-in-polygon assignment, with a nearest-centroid fallback for cells just offshore. The result speaks the language of decision-makers: each comune gets a hazard value per year, so clean-up resources and policy can be prioritised by administrative unit rather than abstract cells.');
}

/* ══════════════════════════════════════════════════════════════
   23. SECTION 04
══════════════════════════════════════════════════════════════ */
{
  const s = divider('4', 'Spatial Autocorrelation', "moran's I · LISA · getis-ord GI*"); N++;
  s.addNotes('Section 4 — the statistical core. So far the west-coast pattern is visual. Now we test it: is the clustering real or could it arise by chance? Global Moran\'s I, LISA, and Getis-Ord GI* answer where and how strongly.');
}

/* ══════════════════════════════════════════════════════════════
   24. SPATIAL METHODOLOGY
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Spatial Statistics — Why & How', 'LEC12 geospatial models');
  const cards = [
    ["Global Moran's I", SEAFM, 'One scalar per year. Tests whether high-hazard cells cluster in space vs. random. Queen contiguity, row-standardised W, 999-permutation p-value.'],
    ["Local Moran's I (LISA)", WAVE, 'Per-cell statistic → HH / LL / HL / LH. Locates exactly where clustering occurs and flags spatial outliers.'],
    ['Getis-Ord GI*', CORAL, 'Per-cell z-score of local concentration. Grades hotspot / coldspot intensity in standard-deviation units.'],
  ];
  cards.forEach((c, i) => {
    const x = 0.7+i*4.18;
    card(s, x, 1.8, 3.92, 4.32);
    s.addShape(p.ShapeType.rect, {x, y:1.8, w:3.92, h:0.7, fill:{color:SURF}});
    s.addShape(p.ShapeType.rect, {x, y:1.8, w:3.92, h:0.07, fill:{color:c[1]}});
    s.addText(c[0], {x:x+0.18, y:1.82, w:3.62, h:0.7, fontSize:16, color:c[1], bold:true, valign:'middle'});
    s.addText(c[2], {x:x+0.28, y:2.68, w:3.42, h:3.25, fontSize:13.5, color:WHITE, valign:'top', lineSpacingMultiple:1.2});
  });
  s.addText('Built from scratch in NumPy (no PySAL dependency) — scripts/analysis_10_spatial_models.py',
    {x:0.7, y:6.35, w:12, h:0.42, fontSize:11, color:MUT, italic:true});
  footer(s, N);
  s.addNotes('Three complementary tools, all from the LEC12 geospatial lecture. Global Moran\'s I gives one number per year: is hazard clustered or random? LISA breaks that down per cell into High-High, Low-Low and the two outlier types, so we see exactly where clustering happens. Getis-Ord GI* grades hotspot intensity as a z-score. All implemented from scratch in NumPy in analysis_10_spatial_models.py.');
}

/* ══════════════════════════════════════════════════════════════
   25. GLOBAL MORAN
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, "Global Moran's I — Significant Clustering");
  s.addImage(fit(f('moran_scatter.png'), 1.89, 0.55, 1.52, 7.3, 5.4));
  const x = 8.1;
  const rows = [
    [hc('Year'), hc("Moran's I"), hc('z'), hc('p')],
    ['2018','0.965','31.4','0.000'],
    ['2019','0.936','31.1','0.000'],
    ['2020','0.948','32.0','0.000'],
    ['2021','0.943','30.0','0.000'],
    ['2022','0.951','30.4','0.000'],
    ['2023','0.948','30.4','0.000'],
  ];
  s.addTable(rows, tStyle({x, y:1.82, w:4.72, colW:[1.2,1.72,0.9,0.9],
    fontSize:13, align:'center', rowH:0.42}));
  s.addText([
    {text:'I ≈ 0.95 every year, p = 0.000.\n', options:{bold:true, color:SEAFM}},
    {text:'Hazard is strongly and significantly clustered in space — not random noise. The pattern is stable across all six years.', options:{color:WHITE}},
  ], {x, y:5.08, w:4.72, h:1.58, fontSize:13.5, valign:'top', lineSpacingMultiple:1.15});
  footer(s, N);
  s.addNotes('Global Moran\'s I is essentially 0.95 every year with p = 0.000 from the permutation test — about 30 standard deviations above the random expectation. The chance that this west-coast clustering is a fluke is effectively zero. One caveat: IDW interpolation itself smooths neighbouring cells, so part of this very high autocorrelation is inherited from the interpolation — the direction and significance are robust, the exact magnitude less so.');
}

/* ══════════════════════════════════════════════════════════════
   26. LISA
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, "LISA Cluster Map — Local Moran's I");
  s.addImage(fit(f('lisa_cluster_map.png'), 1.80, 0.52, 1.52, 8.0, 5.4));
  const x = 8.88;
  const chips = [['HH','EF4444','Hotspot'],['LL','60A5FA','Coldspot'],['HL','FB923C','Outlier'],['LH','93C5FD','Outlier']];
  chips.forEach((c,i) => {
    const y = 1.75+i*0.52;
    s.addShape(p.ShapeType.roundRect, {x, y, w:0.36, h:0.36, rectRadius:0.05, fill:{color:c[1]}});
    s.addText([{text:c[0]+'  ', options:{bold:true, color:WHITE}},{text:c[2], options:{color:MUT}}],
      {x:x+0.48, y:y-0.02, w:3.8, h:0.42, fontSize:13, valign:'middle'});
  });
  s.addText([
    'West coast = HH hotspot (Alghero–Oristano corridor)',
    'East coast = LL coldspot',
    'Zero HL/LH outliers → coherent spatial pattern',
    '~77 HH + ~63 LL significant cells (2023)',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
    {x, y:4.02, w:4.02, h:2.5, fontSize:13, color:WHITE, lineSpacingMultiple:1.2, paraSpaceAfter:10});
  footer(s, N);
  s.addNotes('LISA localises the clustering. Red cells are High-High hotspots — high hazard surrounded by high hazard — and they form a continuous corridor down the west coast from Alghero to Oristano. Blue Low-Low coldspots cover the east coast. The striking result is zero HL or LH outliers: there are no isolated anomalies, the pattern is spatially coherent.');
}

/* ══════════════════════════════════════════════════════════════
   27. GI*
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Getis-Ord GI* — Hotspot Intensity');
  s.addImage(fit(f('gi_star_map.png'), 1.74, 0.55, 1.52, 8.2, 5.4));
  const x = 9.08;
  s.addText([
    'Per-cell z-score of local concentration',
    'z > 1.96 → significant hotspot (red)',
    'z < −1.96 → significant coldspot (blue)',
    '~80 hotspot / ~65 coldspot cells per year',
    'Confirms & grades the LISA HH corridor',
  ].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
    {x, y:1.9, w:3.82, h:4.3, fontSize:13, color:WHITE, lineSpacingMultiple:1.2, paraSpaceAfter:12});
  footer(s, N);
  s.addNotes('Getis-Ord GI* adds intensity. Where LISA classifies cells into types, GI* gives each cell a continuous z-score: above +1.96 is a significant hotspot (red), below −1.96 a significant coldspot (blue). Around 80 hotspot and 65 coldspot cells per year. It lets you rank severity — a hotspot at z = 4 is more intense than one at z = 2 — useful for prioritising the worst cells within the corridor.');
}

/* ══════════════════════════════════════════════════════════════
   28. KEY FINDINGS
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Key Findings');
  const cols = [
    ['Hotspots', CORAL, [
      'West-coast corridor (Alghero–Oristano) = highest hazard',
      'Oristano Is Arenas: max beach litter (1,255 items/100 m)',
      'East coast (San Teodoro) = statistically-confirmed coldspot',
      'Clustering significant every year (Moran I ≈ 0.95, p < 0.001)',
    ]],
    ['Patterns', SEAFM, [
      '84% of beach litter is artificial polymer',
      'Floating litter elevated late spring–autumn — current-driven',
      'Bio impact peaks 2021 (turtle strandings)',
      'COVID: beach litter −68% with tourism → human + transport drivers',
    ]],
  ];
  cols.forEach((c, i) => {
    const x = 0.88+i*6.15;
    card(s, x, 1.8, 5.62, 4.42);
    s.addShape(p.ShapeType.rect, {x, y:1.8, w:5.62, h:0.07, fill:{color:c[1]}});
    s.addText(c[0], {x:x+0.25, y:2.0, w:5.22, h:0.52, fontSize:19, color:c[1], bold:true});
    s.addText(c[2].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
      {x:x+0.25, y:2.62, w:5.22, h:3.52, fontSize:15, color:WHITE, lineSpacingMultiple:1.25, paraSpaceAfter:14});
  });
  footer(s, N);
  s.addNotes('Pulling it together. Hotspots: a clear west-coast corridor from Alghero to Oristano, with Oristano Is Arenas the single worst beach, and a statistically-confirmed east-coast coldspot; the clustering is significant every year. Patterns: plastics dominate every compartment, floating litter is seasonal and current-driven, biological impact peaked in 2021, and the COVID experiment showed beach litter is both human- and transport-driven.');
}

/* ══════════════════════════════════════════════════════════════
   29. LIMITATIONS
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide(); N++;
  header(s, 'Limitations & Next Steps');
  const cols = [
    ['Limitations', AMBER, [
      '6 beach stations → sparse coverage, IDW smooths heavily',
      'Seafloor compartment synthetic (no ISPRA Sardinia module)',
      'Scores relative (min–max), not absolute concentrations',
      'Autocorrelation partly inherited from IDW smoothing',
      'Expert-set weights, not learned from data',
    ]],
    ['Next Steps', SEAFM, [
      'Promote microplastics into the index once 2023 released',
      'Replace synthetic seafloor with real MEDITS trawl data',
      'Bi-variate Moran (beach vs. floating) coupling',
      'Spatial regression: SAR / SEM / GWR for drivers',
      'Validate vs. citizen-science clean-ups · per-comune brief',
    ]],
  ];
  cols.forEach((c, i) => {
    const x = 0.88+i*6.15;
    card(s, x, 1.8, 5.62, 4.52);
    s.addShape(p.ShapeType.rect, {x, y:1.8, w:5.62, h:0.07, fill:{color:c[1]}});
    s.addText(c[0], {x:x+0.25, y:2.0, w:5.22, h:0.52, fontSize:19, color:c[1], bold:true});
    s.addText(c[2].map(t => ({text:t, options:{bullet:{code:'25BA'}}})),
      {x:x+0.25, y:2.62, w:5.22, h:3.65, fontSize:14, color:WHITE, lineSpacingMultiple:1.2, paraSpaceAfter:12});
  });
  footer(s, N);
  s.addNotes('Honest limitations. Only six beach stations means IDW smooths aggressively and the autocorrelation is partly an artefact of that smoothing. The seafloor compartment is currently synthetic. Scores are relative, not absolute concentrations. Next steps: promote microplastics into the index once 2023 is released, bring in real MEDITS trawl data for seafloor, add bi-variate Moran, move to spatial regression (SAR/SEM/GWR), validate against citizen-science clean-up data, and produce a per-comune policy brief.');
}

/* ══════════════════════════════════════════════════════════════
   30. CLOSING
══════════════════════════════════════════════════════════════ */
{
  const s = p.addSlide();
  seaBackground(s);
  // wave bands
  [2.0,2.6,3.2,3.8].forEach((wy,i) =>
    s.addShape(p.ShapeType.rect, {x:0, y:wy, w:W, h:0.055, fill:{color:WAVE, transparency:72+i*5}}));
  s.addText('Thank You', {x:0.85, y:1.95, w:11.5, h:1.1, fontSize:58, color:WHITE, bold:true});
  s.addShape(p.ShapeType.rect, {x:0.92, y:3.22, w:3.0, h:0.07, fill:{color:SEAFM}});
  s.addShape(p.ShapeType.rect, {x:3.92, y:3.22, w:1.5, h:0.07, fill:{color:CORAL, transparency:20}});
  [
    ['GitHub', 'daniele22-u/hhe-labsardinia'],
    ['Data', 'ISPRA — Sistema Nazionale per la Protezione dell\'Ambiente'],
    ['Framework', 'EU Marine Strategy Framework Directive · Descriptor 10'],
    ['Methods', 'IDW · Composite Index · Moran\'s I · LISA · Getis-Ord GI*'],
  ].forEach(([k,v], i) => {
    s.addText(k, {x:0.92, y:3.48+i*0.55, w:1.8, h:0.5, fontSize:14, color:SEAFM, bold:true});
    s.addText(v, {x:2.75, y:3.48+i*0.55, w:9.7, h:0.5, fontSize:14, color:WHITE, valign:'middle'});
  });
  s.addShape(p.ShapeType.rect, {x:0, y:H-0.52, w:W, h:0.001, fill:{color:LINE}});
  s.addText('HHE Data Science Laboratory · Politecnico di Milano · 2026',
    {x:0.9, y:6.72, w:11.5, h:0.42, fontSize:11, color:MUT});
  s.addNotes('Closing. To recap: we integrated eight ISPRA compartments into a single spatial hazard index for the Sardinian coast, used a COVID natural experiment to separate human from natural drivers, and confirmed a stable, statistically significant west-coast hotspot corridor with Moran\'s I, LISA and GI*. Everything — data, scripts and an interactive dashboard — is on GitHub. Happy to take questions.');
}

p.writeFile({ fileName: OUT }).then(() => console.log('SAVED:', OUT));
