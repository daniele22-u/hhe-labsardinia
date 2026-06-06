export const YEARS = [2018, 2019, 2020, 2021, 2022, 2023];

export const PERIOD_MAP = {
  2018: 'pre-COVID', 2019: 'pre-COVID',
  2020: 'COVID',     2021: 'COVID',
  2022: 'post-COVID',2023: 'post-COVID',
};

export const PERIOD_COLORS = {
  'pre-COVID':  '#2980b9',
  'COVID':      '#e74c3c',
  'post-COVID': '#27ae60',
};

export const EU_THRESHOLD = 150;

export const CORR = [
  [1.00, -0.44,  0.12, -0.16],
  [-0.44, 1.00, -0.00,  0.14],
  [ 0.12,-0.00,  1.00, -0.66],
  [-0.16, 0.14, -0.66,  1.00],
];
export const CORR_LABELS = ['BL','T','CS','FL'];

export function hcolor(h) {
  // Scala a "stacchi netti" (discrete) con 8 step per evidenziare differenze minime
  if (h < 0.2) return '#2ecc71'; // Green
  if (h < 0.3) return '#a4de02'; // Lime
  if (h < 0.4) return '#f1c40f'; // Yellow
  if (h < 0.5) return '#f39c12'; // Orange
  if (h < 0.6) return '#e67e22'; // Dark Orange
  if (h < 0.7) return '#e74c3c'; // Red
  if (h < 0.8) return '#c0392b'; // Dark Red
  return '#8e44ad';              // Purple
}
export function hclass(h) {
  if (h < 0.2) return 'Very Low';
  if (h < 0.4) return 'Low';
  if (h < 0.6) return 'Medium';
  if (h < 0.8) return 'High';
  return 'Very High';
}
