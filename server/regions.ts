// Code postal → région (codes INSEE des 13 régions de métropole). Les codes postaux en 97/98
// (outre-mer, Monaco) et les clients hors de France n'apparaissent pas sur la carte.

const DEPARTEMENTS: Record<string, string> = {}
const REGIONS: Record<string, string[]> = {
  '11': ['75', '77', '78', '91', '92', '93', '94', '95'],
  '24': ['18', '28', '36', '37', '41', '45'],
  '27': ['21', '25', '39', '58', '70', '71', '89', '90'],
  '28': ['14', '27', '50', '61', '76'],
  '32': ['02', '59', '60', '62', '80'],
  '44': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  '52': ['44', '49', '53', '72', '85'],
  '53': ['22', '29', '35', '56'],
  '75': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  '76': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  '84': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  '93': ['04', '05', '06', '13', '83', '84'],
  '94': ['20'],
}
for (const [region, deps] of Object.entries(REGIONS)) for (const d of deps) DEPARTEMENTS[d] = region

export const NOMS_REGIONS: Record<string, string> = {
  '11': 'Île-de-France',
  '24': 'Centre-Val de Loire',
  '27': 'Bourgogne-Franche-Comté',
  '28': 'Normandie',
  '32': 'Hauts-de-France',
  '44': 'Grand Est',
  '52': 'Pays de la Loire',
  '53': 'Bretagne',
  '75': 'Nouvelle-Aquitaine',
  '76': 'Occitanie',
  '84': 'Auvergne-Rhône-Alpes',
  '93': "Provence-Alpes-Côte d'Azur",
  '94': 'Corse',
}

/** Code INSEE de la région d'une adresse française, ou null (outre-mer, étranger, code illisible). */
export function regionDe(adresse: { postal_code?: string; country_alpha2?: string } | null | undefined) {
  if (!adresse || (adresse.country_alpha2 && adresse.country_alpha2.toUpperCase() !== 'FR')) return null
  const cp = (adresse.postal_code ?? '').replace(/\s/g, '')
  if (!/^\d{5}$/.test(cp)) return null
  return DEPARTEMENTS[cp.slice(0, 2)] ?? null
}
