export const TRANSLATIONS = {
  en: {
    // splash / modal
    loading:           'Loading data...',
    modalTitle:        '🌊 Sardinia HHE Lab',
    modalDesc:         'This dashboard analyses the <b>Marine Litter Hazard</b> along the Sardinian coast (2018–2023), in accordance with <b>MSFD D10</b>.',
    scoringTitle:      '📊 Scoring Components',
    pctPlastic:        '% Plastic',
    currentsLabel:     '🌀 Currents',
    bioImpactTitle:    '🦎 Biological Impact',
    bioScoreDesc:      'The <b>Bio Score</b> is a biological impact proxy computed as:',
    bioScoreFormula:   '<b>Score = (ENT + ING) / N_max</b> · combines <b>entanglement</b> and <b>ingestion</b> events detected on sea turtles (<i>Caretta caretta</i>, ~99%) from <b>CNR-IAS/Oristano</b> data (2018–2023, 83+82 events).',
    bioScoreMicro:     'Peak in <b>2021</b>. The <b>🔬 Micro</b> layer shows the IDW microplastics grid derived from 7,913 trawl samples (336 cells/year).',
    close:             'Close',
    low:               'Low',
    high:              'High',
    fullscreen:        'Fullscreen',
    insightsTitle:     '📊 Insights',
    autoInsights:      '📈 Auto-Insights',
    hazardLevel:       'Hazard Level',
    insightPeak:       (w, b) => `🔴 Litter peak in <b>${w}</b>, lowest in <b>${b}</b>.`,
    insightPlastic:    (w, v) => `🧴 Max plastic in <b>${w}</b>: ${v?.toFixed(0)}%.`,
    insightCurrents:   (w, v) => `🌊 Peak currents in <b>${w}</b>: ${v?.toFixed(1)} cm/s.`,
    insightBio:        (w, v) => `🦎 Max bio impact in <b>${w}</b>: score ${(v*100).toFixed(1)}‱.`,
    insightMicro:      (w, v) => `🔬 Densest microplastics in <b>${w}</b>: mean ${v?.toFixed(3)}.`,
    insightLitter:     (d)    => `📈 Litter 2020→2023: <b>${d>0?'+':''}${d}%</b>.`,

    // BeachTab
    beachTitle:        (y) => `Beach Litter — items/100m`,
    surveysEst:        'Surveys est.',
    aboveEU:           'Above EU 150',
    meanI100m:         'Mean i/100m',

    // FloatTab
    floatTitle:        (y) => `Floating Litter — ${y}`,
    floatNote:         (pct, total) => `<strong>${pct}%</strong> plastic of ${total} obs · corr vs current speed: <strong>r = −0.66</strong>`,
    spearmanTitle:     'Spearman Correlation',
    corrLegend:        'BL=Beach Litter · T=Tourism · CS=Current · FL=Floating',

    // CurrentsTab
    currentsTitle:     'Surface Currents (CMEMS)',
    currMeanLabel:     (y) => `cm/s · ${y} mean`,
    currDirection:     (d) => `${d} direction`,
    currNote1:         'Spearman r = −0.66 (floating vs current speed)',
    currNote2:         'Faster currents disperse items from fixed transects',

    // TourismTab
    tourismTitle:      'Tourism vs Litter Trend',
    tourBeachLitter:   'Beach litter',
    tourTourists:      'Tourists M',
    tourNote1:         'Pearson r = −0.44 · Sardinia regional overnight stays',
    tourNote2:         'Urban beaches have more cleaning → lower litter counts',

    // BiologicalTab
    bioHowToTitle:     'ℹ️ How to read this tab',
    bioHowToBody:      'CNR-IAS (Oristano) data on stranded sea turtles (<em>Caretta caretta</em>) 2018–2023. <strong>Bio Score</strong> = total events / historical maximum, normalised 0→1. Higher = greater biological pressure from marine litter.',
    bioIndexTitle:     (y) => `🦎 Biological Impact Index — ${y}`,
    bioEntanglements:  'Entanglements',
    bioIngestions:     'Ingestions',
    bioMicroPts:       'Micro sampling pts',
    bioSubCard:        'Net/gear entanglement · plastic ingestion · grid points used to map microplastic density at sea (336 = 21×16 grid, ~11km/cell)',
    bioEntTitle:       '🐢 Entanglement by year',
    bioEntSub:         'No. turtles with body trapped in nets, lines or plastic. Colour = clinical condition.',
    bioAnimals:        (v) => `${v} animals`,
    bioIngTitle:       '🪼 Plastic ingestion by material',
    bioIngSub:         'Plastic material found in digestive tract or regurgitated. Hover for detail.',
    bioTrendTitle:     '📈 Bio Score Trend (% of max)',
    bioTrendSub:       'Peak in 2021 (23 entanglements). Scale 0–100 = min/max historical.',
    bioMicroTitle:     '🔬 Microplastics — mean IDW density/year',
    bioMicroSub:       (y, avail) => `336-cell grid (0.12°×0.12°) interpolated from >7,900 surface trawl samples. Scale 0–1 normalised.${!avail ? ` · ${y}: data not available` : ''}`,
    bioMicroNote:      (y, n, m) => `<strong>${y}</strong> · cells: <span class="pos">${n}</span> · mean IDW: <span class="pos">${m}</span>`,
    bioMicroDensity:   'Mean IDW density',
    statusDesc: {
      Good: 'animal in good condition',
      Fair: 'fair condition, minor injuries',
      Poor: 'animal in poor condition or deceased',
    },
    materialLabels: {
      SHE: 'Sheets/Films', FOO: 'Fishing gear', FRA: 'Fragments',
      NFO: 'Nets/Ropes',  FOA: 'EPS foam',     PEL: 'Pellets',
      THR: 'Thread/String', OTH: 'Other',
    },
  },

  it: {
    // splash / modal
    loading:           'Caricamento dati in corso...',
    modalTitle:        '🌊 Sardinia HHE Lab',
    modalDesc:         'Questa dashboard analizza l\'<b>Hazard da Marine Litter</b> sulle coste della Sardegna (2018–2023), in accordo con la <b>MSFD D10</b>.',
    scoringTitle:      '📊 Componenti dello Scoring',
    pctPlastic:        '% Plastica',
    currentsLabel:     '🌀 Correnti',
    bioImpactTitle:    '🦎 Impatto Biologico',
    bioScoreDesc:      'Il <b>Bio Score</b> è un proxy di impatto biologico calcolato come:',
    bioScoreFormula:   '<b>Score = (ENT + ING) / N_max</b> · combina eventi di <b>entanglement</b> (ingarbugliamento) e <b>ingestione</b> di plastica rilevati su tartarughe marine (<i>Caretta caretta</i>, ~99%) dai dati <b>CNR-IAS/Oristano</b> (2018–2023, 83+82 eventi).',
    bioScoreMicro:     'Il picco è nel <b>2021</b>. Il layer <b>🔬 Micro</b> mostra la griglia IDW di microplastiche derivata da 7.913 campionamenti trawl (336 celle/anno).',
    close:             'Chiudi',
    low:               'Basso',
    high:              'Alto',
    fullscreen:        'A Tutto Schermo',
    insightsTitle:     '📊 Insights',
    autoInsights:      '📈 Auto-Insights',
    hazardLevel:       'Livello Hazard',
    insightPeak:       (w, b) => `🔴 Picco litter nel <b>${w}</b>, minimo nel <b>${b}</b>.`,
    insightPlastic:    (w, v) => `🧴 Plastica massima nel <b>${w}</b>: ${v?.toFixed(0)}%.`,
    insightCurrents:   (w, v) => `🌊 Correnti più intense nel <b>${w}</b>: ${v?.toFixed(1)} cm/s.`,
    insightBio:        (w, v) => `🦎 Impatto biologico max nel <b>${w}</b>: score ${(v*100).toFixed(1)}‱.`,
    insightMicro:      (w, v) => `🔬 Microplastiche più dense nel <b>${w}</b>: media ${v?.toFixed(3)}.`,
    insightLitter:     (d)    => `📈 Litter 2020→2023: <b>${d>0?'+':''}${d}%</b>.`,

    // BeachTab
    beachTitle:        () => `Rifiuti spiaggiati — oggetti/100m`,
    surveysEst:        'Sondaggi est.',
    aboveEU:           'Sopra soglia EU 150',
    meanI100m:         'Media ogg/100m',

    // FloatTab
    floatTitle:        (y) => `Rifiuti flottanti — ${y}`,
    floatNote:         (pct, total) => `<strong>${pct}%</strong> plastica su ${total} oss · corr vs velocità corrente: <strong>r = −0.66</strong>`,
    spearmanTitle:     'Correlazione di Spearman',
    corrLegend:        'BL=Rif. Spiaggia · T=Turismo · CS=Corrente · FL=Flottante',

    // CurrentsTab
    currentsTitle:     'Correnti superficiali (CMEMS)',
    currMeanLabel:     (y) => `cm/s · media ${y}`,
    currDirection:     (d) => `direzione ${d}`,
    currNote1:         'Spearman r = −0.66 (flottante vs velocità corrente)',
    currNote2:         'Correnti più veloci disperdono i rifiuti dai transetti fissi',

    // TourismTab
    tourismTitle:      'Turismo vs Trend Rifiuti',
    tourBeachLitter:   'Rifiuti spiaggiati',
    tourTourists:      'Turisti M',
    tourNote1:         'Pearson r = −0.44 · presenze regionali in Sardegna',
    tourNote2:         'Le spiagge urbane vengono pulite più spesso → meno rifiuti rilevati',

    // BiologicalTab
    bioHowToTitle:     'ℹ️ Come leggere questa sezione',
    bioHowToBody:      'Dati CNR-IAS (Oristano) su tartarughe marine (<em>Caretta caretta</em>) spiaggiati 2018–2023. <strong>Bio Score</strong> = eventi totali / massimo storico, normalizzato 0→1. Più alto = maggiore pressione biologica da marine litter.',
    bioIndexTitle:     (y) => `🦎 Indice Impatto Biologico — ${y}`,
    bioEntanglements:  'Ingarbugliamenti',
    bioIngestions:     'Ingestioni',
    bioMicroPts:       'Punti campionamento micro',
    bioSubCard:        'Ingarbugliamento in reti/attrezzi · ingestione di plastica · punti griglia per mappare la densità di microplastiche (336 = griglia 21×16, ~11km/cella)',
    bioEntTitle:       '🐢 Entanglement per anno',
    bioEntSub:         'N° tartarughe con corpo intrappolato in reti, lenze o plastica. Colore = condizioni cliniche.',
    bioAnimals:        (v) => `${v} animali`,
    bioIngTitle:       '🪼 Ingestione plastica per materiale',
    bioIngSub:         'Tipo di materiale plastico nell\'apparato digerente o rigurgitato. Hover per dettaglio.',
    bioTrendTitle:     '📈 Andamento Bio Score (% del max)',
    bioTrendSub:       'Picco nel 2021 (23 entanglements). Scala 0–100 = min/max storico.',
    bioMicroTitle:     '🔬 Microplastiche — densità IDW media/anno',
    bioMicroSub:       (y, avail) => `Griglia 336 celle (0.12°×0.12°) interpolata da >7.900 campionamenti trawl. Scala 0–1 normalizzata.${!avail ? ` · ${y}: dati non disponibili` : ''}`,
    bioMicroNote:      (y, n, m) => `<strong>${y}</strong> · celle: <span class="pos">${n}</span> · media IDW: <span class="pos">${m}</span>`,
    bioMicroDensity:   'Densità media IDW',
    statusDesc: {
      Good: 'animale in buone condizioni',
      Fair: 'condizioni discrete, ferite lievi',
      Poor: 'animale in cattive condizioni o deceduto',
    },
    materialLabels: {
      SHE: 'Fogli/Pellicole', FOO: 'Attrezzi da pesca', FRA: 'Frammenti',
      NFO: 'Reti/Corde',     FOA: 'Schiuma EPS',       PEL: 'Pellet',
      THR: 'Filo/Spago',     OTH: 'Altro',
    },
  },
};

export function useT(lang) {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}
