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
  if (h < 0.2) return '#2ecc71';
  if (h < 0.4) return '#f1c40f';
  if (h < 0.6) return '#f39c12';
  if (h < 0.8) return '#e74c3c';
  return '#8e44ad';
}
export function hclass(h) {
  if (h < 0.2) return 'Very Low';
  if (h < 0.4) return 'Low';
  if (h < 0.6) return 'Medium';
  if (h < 0.8) return 'High';
  return 'Very High';
}
