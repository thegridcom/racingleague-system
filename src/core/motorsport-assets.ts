/**
 * Motorsport Assets: Offizielle Vektor-Streckenlayouts & Team-Grafiken für die Saison 2026
 */

export interface TrackData {
  roundNumber: number;
  trackName: string;
  country: string;
  flagEmoji: string;
  lengthKm: number;
  laps: number; // 50% Renndistanz
  svgPath: string;
  viewBox: string;
  date: Date;
  status: 'COMPLETED' | 'UPCOMING' | 'ACTIVE';
}

/**
 * Berechnet Rennsonntage ab dem nächsten anstehenden Sonntag um 19:00 Uhr
 * (im 2-Wochen-Rhythmus, offizielles "the grid." Liga-Intervall).
 */
export function getRaceDateForRound(roundNumber: number): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sonntag
  let daysUntilSunday = (7 - dayOfWeek) % 7;
  if (daysUntilSunday === 0 && now.getHours() >= 19) {
    daysUntilSunday = 7;
  }
  const raceDate = new Date(now);
  raceDate.setDate(now.getDate() + daysUntilSunday + (roundNumber - 1) * 14);
  raceDate.setHours(19, 0, 0, 0);
  return raceDate;
}

export const TRACKS_2026: TrackData[] = [
  {
    roundNumber: 1,
    trackName: 'Bahrain International Circuit',
    country: 'Bahrain',
    flagEmoji: '🇧🇭',
    lengthKm: 5.412,
    laps: 29, // 50% Renndistanz (Voll: 57)
    viewBox: '0 0 400 300',
    // Authentischer Verlauf von Sakhir
    svgPath: 'M 70 240 L 330 240 C 350 240 365 220 355 200 L 320 150 L 340 130 C 355 110 340 90 320 90 L 260 90 L 250 120 L 220 120 L 210 90 L 150 70 C 130 65 110 80 115 100 L 125 140 L 95 160 C 80 170 80 190 90 200 L 130 210 L 70 210 C 60 210 55 225 60 235 Z',
    date: getRaceDateForRound(1),
    status: 'UPCOMING',
  },
  {
    roundNumber: 2,
    trackName: 'Jeddah Corniche Circuit',
    country: 'Saudi-Arabien',
    flagEmoji: '🇸🇦',
    lengthKm: 6.174,
    laps: 25, // 50% Renndistanz (Voll: 50)
    viewBox: '0 0 400 300',
    // Ultraschneller Straßenkurs am Roten Meer
    svgPath: 'M 60 160 C 60 140 80 120 100 120 L 200 115 C 230 110 250 90 280 85 L 340 75 C 365 70 380 90 370 115 L 340 180 C 330 200 310 210 280 215 L 180 220 C 140 225 110 240 80 230 C 60 220 50 190 60 160 Z',
    date: getRaceDateForRound(2),
    status: 'UPCOMING',
  },
  {
    roundNumber: 3,
    trackName: 'Albert Park Circuit',
    country: 'Australien',
    flagEmoji: '🇦🇺',
    lengthKm: 5.278,
    laps: 29, // 50% Renndistanz (Voll: 58)
    viewBox: '0 0 400 300',
    // Melbourne Seeumrundung
    svgPath: 'M 90 220 L 270 220 C 300 220 320 200 310 180 L 290 140 C 285 120 300 100 320 95 L 330 75 C 330 60 310 55 295 65 L 240 100 L 180 100 L 160 80 C 145 65 125 75 125 95 L 130 135 L 90 150 C 75 160 75 180 85 190 L 110 195 L 90 220 Z',
    date: getRaceDateForRound(3),
    status: 'UPCOMING',
  },
  {
    roundNumber: 4,
    trackName: 'Suzuka International Racing Course',
    country: 'Japan',
    flagEmoji: '🇯🇵',
    lengthKm: 5.807,
    laps: 27, // 50% Renndistanz (Voll: 53)
    viewBox: '0 0 400 300',
    // Legendäre Achterbahn-Acht (Figure-8)
    svgPath: 'M 80 230 L 220 230 C 250 230 270 210 260 190 L 240 160 C 230 140 240 120 260 115 L 310 105 C 330 100 340 80 325 65 C 310 50 280 60 260 80 L 210 130 L 170 125 C 140 120 120 95 130 75 C 140 55 120 45 105 55 L 75 90 C 60 110 70 140 90 155 L 140 185 L 80 230 Z',
    date: getRaceDateForRound(4),
    status: 'UPCOMING',
  },
  {
    roundNumber: 5,
    trackName: 'Shanghai International Circuit',
    country: 'China',
    flagEmoji: '🇨🇳',
    lengthKm: 5.451,
    laps: 28, // 50% Renndistanz (Voll: 56)
    viewBox: '0 0 400 300',
    // "Shang" Zeichen mit Schneckenkurve & langer Gegengerade
    svgPath: 'M 70 220 L 290 220 C 315 220 330 205 320 180 L 290 120 C 280 95 300 80 320 85 C 340 90 345 110 335 125 L 315 150 L 330 165 C 350 150 365 110 350 75 C 330 45 285 55 260 80 L 210 115 L 160 110 C 130 105 110 85 115 65 C 120 45 100 45 90 60 L 65 120 C 50 150 60 185 85 195 L 130 195 L 70 220 Z',
    date: getRaceDateForRound(5),
    status: 'UPCOMING',
  },
  {
    roundNumber: 6,
    trackName: 'Miami International Autodrome',
    country: 'USA',
    flagEmoji: '🇺🇸',
    lengthKm: 5.412,
    laps: 29, // 50% Renndistanz (Voll: 57)
    viewBox: '0 0 400 300',
    svgPath: 'M 70 200 L 320 200 C 345 200 360 185 350 165 L 320 115 C 310 95 290 90 265 95 L 180 105 L 155 80 C 140 65 115 75 110 95 L 105 130 L 70 150 C 55 160 55 185 70 200 Z',
    date: getRaceDateForRound(6),
    status: 'UPCOMING',
  },
  {
    roundNumber: 7,
    trackName: 'Autodromo Enzo e Dino Ferrari (Imola)',
    country: 'Italien',
    flagEmoji: '🇮🇹',
    lengthKm: 4.909,
    laps: 32, // 50% Renndistanz (Voll: 63)
    viewBox: '0 0 400 300',
    // Tamburello, Villeneuve, Tosa, Piratella, Acque Minerali, Rivazza
    svgPath: 'M 80 230 L 300 230 C 330 230 350 210 340 185 L 310 135 C 300 115 315 95 335 90 C 345 85 345 65 330 60 L 260 65 C 235 70 215 90 220 115 L 225 140 L 175 130 C 145 125 130 95 140 75 C 145 60 130 50 115 60 L 80 95 C 60 120 65 155 85 170 L 145 190 L 80 230 Z',
    date: getRaceDateForRound(7),
    status: 'UPCOMING',
  },
  {
    roundNumber: 8,
    trackName: 'Circuit de Monaco',
    country: 'Monaco',
    flagEmoji: '🇲🇨',
    lengthKm: 3.337,
    laps: 39, // 50% Renndistanz (Voll: 78)
    viewBox: '0 0 400 300',
    // Sainte-Dévote, Casino, Haarnadel, Tunnel, Schwimmbad, Rascasse
    svgPath: 'M 100 230 L 250 230 C 270 230 285 220 280 200 L 270 170 C 265 150 280 135 300 130 L 330 120 C 345 115 345 95 330 85 L 280 60 C 260 50 235 65 240 85 L 245 115 L 210 130 C 190 135 180 120 185 105 L 190 90 C 195 70 175 60 160 75 L 120 110 C 105 125 110 150 130 160 L 150 170 L 100 230 Z',
    date: getRaceDateForRound(8),
    status: 'UPCOMING',
  },
  {
    roundNumber: 9,
    trackName: 'Circuit Gilles-Villeneuve',
    country: 'Kanada',
    flagEmoji: '🇨🇦',
    lengthKm: 4.361,
    laps: 35, // 50% Renndistanz (Voll: 70)
    viewBox: '0 0 400 300',
    // Île Notre-Dame mit Haarnadel & Wall of Champions
    svgPath: 'M 60 160 C 60 130 85 110 115 110 L 270 105 C 310 105 340 85 360 100 C 375 115 365 140 335 145 L 220 155 C 190 160 160 175 130 180 L 320 185 C 350 185 365 205 350 225 C 335 240 300 240 260 235 L 110 225 C 75 220 55 195 60 160 Z',
    date: getRaceDateForRound(9),
    status: 'UPCOMING',
  },
  {
    roundNumber: 10,
    trackName: 'Circuit de Barcelona-Catalunya',
    country: 'Spanien',
    flagEmoji: '🇪🇸',
    lengthKm: 4.657,
    laps: 33, // 50% Renndistanz (Voll: 66)
    viewBox: '0 0 400 300',
    // Elf, Renault, Campsa, La Caixa, schnelle Zielkurven
    svgPath: 'M 70 230 L 320 230 C 345 230 360 210 350 185 L 325 145 C 315 125 325 105 345 100 C 355 95 350 75 330 70 L 260 70 C 235 70 220 90 225 115 L 230 135 L 180 135 C 150 135 135 110 140 85 C 145 65 125 55 110 65 L 75 105 C 55 125 60 160 80 175 L 140 190 L 70 230 Z',
    date: getRaceDateForRound(10),
    status: 'UPCOMING',
  },
  {
    roundNumber: 11,
    trackName: 'Circuito de Madrid (IFEMA)',
    country: 'Spanien',
    flagEmoji: '🇪🇸',
    lengthKm: 5.474,
    laps: 28, // 50% Renndistanz (Voll: 55) - Offizielle 2026 Neuheit!
    viewBox: '0 0 400 300',
    // Madrid IFEMA Hybrid-Kurs mit Steilkurve & Messe-Unterführung
    svgPath: 'M 80 220 L 260 220 C 290 220 315 205 325 180 L 345 130 C 355 105 340 80 315 75 L 245 70 C 220 70 205 85 205 110 L 205 140 L 165 140 C 140 140 120 120 120 95 C 120 75 100 65 85 80 L 60 115 C 45 140 55 175 80 185 L 130 190 L 80 220 Z',
    date: getRaceDateForRound(11),
    status: 'UPCOMING',
  },
  {
    roundNumber: 12,
    trackName: 'Red Bull Ring (Spielberg)',
    country: 'Österreich',
    flagEmoji: '🇦🇹',
    lengthKm: 4.318,
    laps: 36, // 50% Renndistanz (Voll: 71)
    viewBox: '0 0 400 300',
    // Niki Lauda Kurve, Remus Bergauf-Spitzkehre, Schlossgold, Jochen Rindt
    svgPath: 'M 70 210 L 220 210 C 245 210 260 195 250 170 L 230 130 C 220 105 240 80 270 75 L 340 65 C 360 60 370 80 355 95 L 285 160 C 270 175 270 200 290 210 L 335 225 C 355 235 345 260 320 260 L 110 250 C 75 250 60 230 70 210 Z',
    date: getRaceDateForRound(12),
    status: 'UPCOMING',
  },
  {
    roundNumber: 13,
    trackName: 'Silverstone Circuit',
    country: 'Großbritannien',
    flagEmoji: '🇬🇧',
    lengthKm: 5.891,
    laps: 26, // 50% Renndistanz (Voll: 52)
    viewBox: '0 0 400 300',
    // Copse, Maggotts, Becketts, Chapel, Stowe, Club
    svgPath: 'M 90 210 L 280 210 C 310 210 330 190 320 165 L 305 135 C 295 115 310 90 335 85 L 340 70 C 340 50 315 45 295 60 L 240 100 L 195 100 L 175 75 C 160 55 130 65 130 90 L 135 130 L 85 155 C 65 165 70 195 90 210 Z',
    date: getRaceDateForRound(13),
    status: 'UPCOMING',
  },
  {
    roundNumber: 14,
    trackName: 'Circuit de Spa-Francorchamps',
    country: 'Belgien',
    flagEmoji: '🇧🇪',
    lengthKm: 7.004,
    laps: 22, // 50% Renndistanz (Voll: 44)
    viewBox: '0 0 400 300',
    // La Source, Eau Rouge, Raidillon, Kemmel, Pouhon, Blanchimont, Bus Stop
    svgPath: 'M 70 230 L 190 230 C 215 230 230 215 220 190 L 205 150 L 260 110 C 290 90 330 95 345 125 L 355 145 C 370 170 355 200 325 205 L 270 215 C 250 220 240 240 255 255 C 270 270 250 285 230 275 L 140 220 L 70 230 Z',
    date: getRaceDateForRound(14),
    status: 'UPCOMING',
  },
  {
    roundNumber: 15,
    trackName: 'Hungaroring',
    country: 'Ungarn',
    flagEmoji: '🇭🇺',
    lengthKm: 4.381,
    laps: 35, // 50% Renndistanz (Voll: 70)
    viewBox: '0 0 400 300',
    // Kurvenreiches "Monaco ohne Leitplanken"
    svgPath: 'M 80 230 L 280 230 C 310 230 330 210 320 185 L 300 145 C 290 120 310 100 335 95 C 350 90 350 70 330 65 L 250 65 C 225 65 210 85 215 110 L 220 135 L 170 135 C 140 135 125 110 130 85 C 135 65 115 55 100 65 L 70 100 C 50 125 55 160 75 175 L 130 190 L 80 230 Z',
    date: getRaceDateForRound(15),
    status: 'UPCOMING',
  },
  {
    roundNumber: 16,
    trackName: 'Circuit Zandvoort',
    country: 'Niederlande',
    flagEmoji: '🇳🇱',
    lengthKm: 4.259,
    laps: 36, // 50% Renndistanz (Voll: 72)
    viewBox: '0 0 400 300',
    // Tarzanbocht, Hugenholtz Steilkurve, Scheivlak, Arie Luyendyk Steilkurve
    svgPath: 'M 90 220 L 270 220 C 300 220 320 200 310 175 L 290 135 C 280 115 295 90 320 85 C 335 80 335 60 320 55 L 250 55 C 225 55 210 75 215 95 L 220 125 L 170 125 C 145 125 130 105 135 85 C 140 65 120 55 105 65 L 75 100 C 55 125 60 160 80 175 L 135 185 L 90 220 Z',
    date: getRaceDateForRound(16),
    status: 'UPCOMING',
  },
  {
    roundNumber: 17,
    trackName: 'Autodromo Nazionale Monza',
    country: 'Italien',
    flagEmoji: '🇮🇹',
    lengthKm: 5.793,
    laps: 27, // 50% Renndistanz (Voll: 53)
    viewBox: '0 0 400 300',
    // Temple of Speed: Prima Variante, Curva Grande, Lesmo, Ascari, Parabolica
    svgPath: 'M 60 220 L 320 220 C 350 220 370 195 355 165 L 310 80 C 295 55 265 60 250 85 L 235 110 L 180 115 L 165 90 C 150 65 120 70 110 95 L 60 220 Z',
    date: getRaceDateForRound(17),
    status: 'UPCOMING',
  },
  {
    roundNumber: 18,
    trackName: 'Baku City Circuit',
    country: 'Aserbaidschan',
    flagEmoji: '🇦🇿',
    lengthKm: 6.003,
    laps: 26, // 50% Renndistanz (Voll: 51)
    viewBox: '0 0 400 300',
    // 2.2 km Vollgas-Gerade am Kaspischen Meer & enge Altstadt-Sektion (Burg)
    svgPath: 'M 50 230 L 350 230 C 370 230 380 215 370 195 L 340 120 C 330 95 305 85 280 90 L 190 95 L 160 70 C 145 55 120 65 115 85 L 110 120 L 70 145 C 50 160 50 190 65 210 L 120 215 L 50 230 Z',
    date: getRaceDateForRound(18),
    status: 'UPCOMING',
  },
  {
    roundNumber: 19,
    trackName: 'Marina Bay Street Circuit',
    country: 'Singapur',
    flagEmoji: '🇸🇬',
    lengthKm: 4.940,
    laps: 31, // 50% Renndistanz (Voll: 62)
    viewBox: '0 0 400 300',
    // Spektakuläres Nachtrennen durch die Hochhausschluchten
    svgPath: 'M 80 215 L 290 215 C 315 215 330 195 320 170 L 295 130 C 285 110 300 90 325 85 C 335 80 335 60 320 55 L 250 60 C 225 60 210 80 215 105 L 220 130 L 175 130 C 145 130 130 105 135 80 C 140 60 120 50 105 60 L 70 95 C 50 120 55 155 75 170 L 130 180 L 80 215 Z',
    date: getRaceDateForRound(19),
    status: 'UPCOMING',
  },
  {
    roundNumber: 20,
    trackName: 'Circuit of the Americas (COTA)',
    country: 'USA',
    flagEmoji: '🇺🇸',
    lengthKm: 5.513,
    laps: 28, // 50% Renndistanz (Voll: 56)
    viewBox: '0 0 400 300',
    // Steile Kurve 1 bergauf, Esses (Maggotts-Kopie) & Stadion-Sektion
    svgPath: 'M 70 230 L 290 230 C 315 230 335 210 325 185 L 295 130 C 285 105 305 80 335 75 C 355 70 360 50 340 45 L 260 50 C 235 55 215 80 220 105 L 225 135 L 175 130 C 145 125 125 100 130 75 C 135 55 115 45 100 55 L 65 95 C 45 120 50 155 70 175 L 130 190 L 70 230 Z',
    date: getRaceDateForRound(20),
    status: 'UPCOMING',
  },
  {
    roundNumber: 21,
    trackName: 'Autódromo Hermanos Rodríguez',
    country: 'Mexiko',
    flagEmoji: '🇲🇽',
    lengthKm: 4.304,
    laps: 36, // 50% Renndistanz (Voll: 71)
    viewBox: '0 0 400 300',
    // Höhenluft in 2.200m, Peraltada-Einfahrt & Baseball-Stadion Foro Sol
    svgPath: 'M 60 220 L 320 220 C 350 220 370 195 355 170 L 320 105 C 310 80 285 75 260 80 L 180 90 L 155 65 C 140 50 115 60 110 80 L 105 120 L 70 145 C 50 160 50 190 65 205 L 120 210 L 60 220 Z',
    date: getRaceDateForRound(21),
    status: 'UPCOMING',
  },
  {
    roundNumber: 22,
    trackName: 'Autódromo José Carlos Pace (Interlagos)',
    country: 'Brasilien',
    flagEmoji: '🇧🇷',
    lengthKm: 4.309,
    laps: 36, // 50% Renndistanz (Voll: 71)
    viewBox: '0 0 400 300',
    // Senna-S, Curva do Sol, Descida do Lago, Junção bergauf zu Start/Ziel
    svgPath: 'M 80 220 L 250 220 C 280 220 300 200 290 175 L 270 135 C 260 110 280 90 305 85 C 320 80 320 60 305 55 L 235 55 C 210 55 195 75 200 100 L 205 130 L 155 130 C 130 130 115 105 120 80 C 125 60 105 50 90 60 L 60 95 C 40 120 45 155 65 170 L 120 180 L 80 220 Z',
    date: getRaceDateForRound(22),
    status: 'UPCOMING',
  },
  {
    roundNumber: 23,
    trackName: 'Las Vegas Strip Circuit',
    country: 'USA',
    flagEmoji: '🇺🇸',
    lengthKm: 6.201,
    laps: 25, // 50% Renndistanz (Voll: 50)
    viewBox: '0 0 400 300',
    // Vollgas am Las Vegas Boulevard vorbei an Bellagio, Caesars Palace & Sphere
    svgPath: 'M 60 200 L 330 200 C 355 200 375 180 365 155 L 340 105 C 330 80 310 75 285 80 L 180 90 L 155 65 C 140 50 115 60 110 80 L 105 120 L 70 145 C 50 160 50 190 65 205 L 120 210 L 60 200 Z',
    date: getRaceDateForRound(23),
    status: 'UPCOMING',
  },
  {
    roundNumber: 24,
    trackName: 'Lusail International Circuit',
    country: 'Katar',
    flagEmoji: '🇶🇦',
    lengthKm: 5.419,
    laps: 29, // 50% Renndistanz (Voll: 57)
    viewBox: '0 0 400 300',
    // 1 km Start-Ziel-Gerade und flüssige High-Speed-Kurven im Flutlicht
    svgPath: 'M 70 220 L 320 220 C 345 220 365 200 355 175 L 330 125 C 320 100 300 90 275 95 L 190 105 L 165 75 C 150 55 125 65 120 90 L 115 130 L 75 150 C 60 165 60 195 75 210 L 130 215 L 70 220 Z',
    date: getRaceDateForRound(24),
    status: 'UPCOMING',
  },
  {
    roundNumber: 25,
    trackName: 'Yas Marina Circuit (Abu Dhabi)',
    country: 'Vereinigte Arabische Emirate',
    flagEmoji: '🇦🇪',
    lengthKm: 5.281,
    laps: 29, // 50% Renndistanz (Voll: 58)
    viewBox: '0 0 400 300',
    // Saisonfinale: Hotel-Sektion, Yas Marina & lange Gegengerade
    svgPath: 'M 80 210 L 300 210 C 325 210 345 190 335 165 L 310 120 C 300 100 280 90 255 95 L 190 105 L 165 80 C 150 65 125 75 120 95 L 115 130 L 80 150 C 65 160 65 190 80 210 Z',
    date: getRaceDateForRound(25),
    status: 'UPCOMING',
  },
];

export interface TeamData2026 {
  name: string;
  shortCode: string;
  colorHex: string;
  secondaryColorHex: string;
  logoSvg: string; // Vektor-Badge für das Team
}

export const TEAMS_2026: TeamData2026[] = [
  {
    name: 'Audi Revolut F1 Team',
    shortCode: 'AUD',
    colorHex: '#C00000', // Audi Sport Rot
    secondaryColorHex: '#101010',
    logoSvg: '<svg viewBox="0 0 100 40" class="w-12 h-6 fill-none stroke-current" stroke-width="2.5"><circle cx="20" cy="20" r="14"/><circle cx="40" cy="20" r="14"/><circle cx="60" cy="20" r="14"/><circle cx="80" cy="20" r="14"/></svg>',
  },
  {
    name: 'Cadillac Formula 1 Team',
    shortCode: 'CAD',
    colorHex: '#E5A823', // Cadillac Gold
    secondaryColorHex: '#1C1C1E',
    logoSvg: '<svg viewBox="0 0 100 60" class="w-10 h-6 fill-none stroke-current" stroke-width="3"><polygon points="50,5 90,20 80,50 50,55 20,50 10,20"/></svg>',
  },
  {
    name: 'Scuderia Ferrari',
    shortCode: 'FER',
    colorHex: '#E8002D', // Rosso Corsa
    secondaryColorHex: '#FFF200',
    logoSvg: '<svg viewBox="0 0 60 70" class="w-7 h-8 fill-none stroke-current" stroke-width="3"><path d="M10 10 L50 10 L45 50 L30 65 L15 50 Z"/></svg>',
  },
  {
    name: 'Oracle Red Bull Racing',
    shortCode: 'RBR',
    colorHex: '#3671C6', // Red Bull Navy
    secondaryColorHex: '#EA1D2D',
    logoSvg: '<svg viewBox="0 0 100 60" class="w-10 h-6 fill-none stroke-current" stroke-width="3"><circle cx="50" cy="30" r="22"/><path d="M20 35 L45 25 L80 35"/></svg>',
  },
  {
    name: 'McLaren Formula 1 Team',
    shortCode: 'MCL',
    colorHex: '#FF8000', // Papaya
    secondaryColorHex: '#47C7FC',
    logoSvg: '<svg viewBox="0 0 80 50" class="w-9 h-6 fill-current"><path d="M10 35 C30 15 60 15 70 35 C55 22 30 22 10 35 Z"/></svg>',
  },
  {
    name: 'Mercedes-AMG PETRONAS',
    shortCode: 'MER',
    colorHex: '#27F4D2', // Petronas Emerald
    secondaryColorHex: '#C0C0C0',
    logoSvg: '<svg viewBox="0 0 60 60" class="w-7 h-7 fill-none stroke-current" stroke-width="2.5"><circle cx="30" cy="30" r="25"/><line x1="30" y1="30" x2="30" y2="5"/><line x1="30" y1="30" x2="9" y2="43"/><line x1="30" y1="30" x2="51" y2="43"/></svg>',
  },
  {
    name: 'Aston Martin Aramco',
    shortCode: 'AST',
    colorHex: '#229971', // Racing Green
    secondaryColorHex: '#CEDC00',
    logoSvg: '<svg viewBox="0 0 100 40" class="w-12 h-5 fill-none stroke-current" stroke-width="2.5"><path d="M10 25 Q30 5 50 20 Q70 5 90 25 M20 30 Q50 15 80 30"/></svg>',
  },
  {
    name: 'BWT Alpine F1 Team',
    shortCode: 'ALP',
    colorHex: '#0093CC', // Alpine Blue
    secondaryColorHex: '#FD4BC7',
    logoSvg: '<svg viewBox="0 0 60 60" class="w-7 h-7 fill-none stroke-current" stroke-width="3"><polygon points="30,8 52,52 8,52"/><line x1="18" y1="36" x2="42" y2="36"/></svg>',
  },
  {
    name: 'Williams Racing',
    shortCode: 'WIL',
    colorHex: '#64C4FF', // Williams Blue
    secondaryColorHex: '#041E42',
    logoSvg: '<svg viewBox="0 0 80 50" class="w-9 h-6 fill-none stroke-current" stroke-width="4"><path d="M15 10 L30 40 L45 20 L60 40 L75 10"/></svg>',
  },
  {
    name: 'MoneyGram Haas F1 Team',
    shortCode: 'HAA',
    colorHex: '#B6BABD', // Haas Grey / Red
    secondaryColorHex: '#E6002B',
    logoSvg: '<svg viewBox="0 0 70 60" class="w-8 h-7 fill-none stroke-current" stroke-width="3.5"><circle cx="35" cy="30" r="24"/><line x1="25" y1="15" x2="25" y2="45"/><line x1="45" y1="15" x2="45" y2="45"/><line x1="25" y1="30" x2="45" y2="30"/></svg>',
  },
  {
    name: 'Visa Cash App RB',
    shortCode: 'VCARB',
    colorHex: '#6692FF', // RB Blue
    secondaryColorHex: '#FFFFFF',
    logoSvg: '<svg viewBox="0 0 80 50" class="w-9 h-6 fill-none stroke-current" stroke-width="3"><path d="M20 35 L40 15 L60 35 M30 35 L40 25 L50 35"/></svg>',
  },
];

