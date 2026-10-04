/**
 * Nation name (as spelled in the data) to flag file in public/flags/, from the
 * MIT-licensed flag-icons set. Images rather than emoji, because Chrome on
 * Windows can't draw flag emoji and there's no emoji for Northern Ireland.
 */
const CODES: Record<string, string> = {
  Albania: "al", Algeria: "dz", Angola: "ao", "Antigua & Barbuda": "ag", Argentina: "ar", Armenia: "am",
  Australia: "au", Austria: "at", Bangladesh: "bd", Barbados: "bb", Belarus: "by", Belgium: "be", Benin: "bj",
  Bermuda: "bm", Bolivia: "bo", "Bosnia & Herzegovina": "ba", Brazil: "br", Bulgaria: "bg", "Burkina Faso": "bf",
  Burundi: "bi", Cameroon: "cm", Canada: "ca", "Cape Verde": "cv", "Central African Republic": "cf", Chile: "cl",
  China: "cn", Colombia: "co", Comoros: "km", Congo: "cg", "Costa Rica": "cr", "Cote D’Ivoire": "ci",
  Croatia: "hr", Cuba: "cu", Curacao: "cw", Cyprus: "cy", "Czech Republic": "cz", "DR Congo": "cd", Denmark: "dk",
  "Dominican Republic": "do", Ecuador: "ec", Egypt: "eg", England: "gb-eng", "Equatorial Guinea": "gq",
  Estonia: "ee", Finland: "fi", France: "fr", Gabon: "ga", Gambia: "gm", Georgia: "ge", Germany: "de", Ghana: "gh",
  Gibraltar: "gi", Greece: "gr", Grenada: "gd", Guadeloupe: "gp", Guatemala: "gt", Guinea: "gn",
  "Guinea-Bissau": "gw", Guyana: "gy", Haiti: "ht", Honduras: "hn", Hungary: "hu", Iceland: "is", Indonesia: "id",
  Iran: "ir", Iraq: "iq", Ireland: "ie", Israel: "il", Italy: "it", Jamaica: "jm", Japan: "jp", Jordan: "jo",
  Kenya: "ke", Kosovo: "xk", Latvia: "lv", Liberia: "lr", Libya: "ly", Lithuania: "lt", Mali: "ml", Malta: "mt",
  Martinique: "mq", Mauritania: "mr", Mexico: "mx", Montenegro: "me", Montserrat: "ms", Morocco: "ma",
  Mozambique: "mz", Netherlands: "nl", "New Zealand": "nz", Niger: "ne", Nigeria: "ng", "North Macedonia": "mk",
  "Northern Ireland": "gb-nir", Norway: "no", Oman: "om", Pakistan: "pk", Paraguay: "py", Peru: "pe",
  Philippines: "ph", Poland: "pl", Portugal: "pt", Romania: "ro", Russia: "ru", "Saudi Arabia": "sa",
  Scotland: "gb-sct", Senegal: "sn", Serbia: "rs", Seychelles: "sc", "Sierra Leone": "sl", Slovakia: "sk",
  Slovenia: "si", "South Africa": "za", "South Korea": "kr", Spain: "es", "St. Kitts & Nevis": "kn",
  Suriname: "sr", Sweden: "se", Switzerland: "ch", Syria: "sy", Tanzania: "tz", Thailand: "th", Togo: "tg",
  "Trinidad & Tobago": "tt", Tunisia: "tn", Turkiye: "tr", Ukraine: "ua", "United States": "us", Uruguay: "uy",
  USSR: "su", Uzbekistan: "uz", Venezuela: "ve", Wales: "gb-wls", Zambia: "zm", Zimbabwe: "zw",
};

export function flagCode(nation: string | null): string | null {
  return nation ? (CODES[nation] ?? null) : null;
}

export function flagUrl(nation: string | null): string | null {
  const code = flagCode(nation);
  return code ? `${import.meta.env.BASE_URL}flags/${code}.svg` : null;
}

export const FLAG_CODES = CODES;
