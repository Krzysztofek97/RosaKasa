import { BudgetMonth } from './types';

export interface IconItem {
  name: string;
  label: string;
}

export interface IconCategory {
  id: string;
  name: string;
  icons: IconItem[];
}

export const CATEGORIZED_ICONS: IconCategory[] = [
  {
    id: 'finance',
    name: 'Finanse',
    icons: [
      { name: 'Wallet', label: 'Portfel' },
      { name: 'PiggyBank', label: 'Skarbonka' },
      { name: 'Coins', label: 'Monety' },
      { name: 'DollarSign', label: 'Gotówka / Waluta' },
      { name: 'CreditCard', label: 'Karta płatnicza' },
      { name: 'Receipt', label: 'Rachunki / Paragony' },
      { name: 'TrendingUp', label: 'Inwestycje / Zyski' },
      { name: 'TrendingDown', label: 'Straty / Spadki' },
      { name: 'Banknote', label: 'Banknoty' },
      { name: 'Landmark', label: 'Bank / Instytucja' },
      { name: 'Percent', label: 'Odsetki / Podatki' },
      { name: 'Briefcase', label: 'Biznes / Kariera' },
      { name: 'Calculator', label: 'Kalkulator / Obliczenia' },
      { name: 'Scale', label: 'Prawnik / Podział' },
      { name: 'Key', label: 'Wynajem / Klucze' },
      { name: 'Shield', label: 'Ubezpieczenie' }
    ]
  },
  {
    id: 'daily',
    name: 'Codzienne',
    icons: [
      { name: 'Utensils', label: 'Jedzenie' },
      { name: 'Home', label: 'Dom' },
      { name: 'Car', label: 'Transport / Paliwo' },
      { name: 'ShoppingBag', label: 'Zakupy ogólne' },
      { name: 'ShoppingBasket', label: 'Artykuły spożywcze' },
      { name: 'Coffee', label: 'Kawiarnia / Przekąski' },
      { name: 'Shirt', label: 'Ubrania / Obuwie' },
      { name: 'Wrench', label: 'Naprawy / Utrzymanie' },
      { name: 'Hammer', label: 'Majsterkowanie / Budowa' },
      { name: 'Plug', label: 'Prąd / Elektronika' },
      { name: 'Scissors', label: 'Kosmetyczka / Fryzjer' },
      { name: 'Lightbulb', label: 'Opłaty / Media' },
      { name: 'Phone', label: 'Telefon / Internet' },
      { name: 'Store', label: 'Sklepy lokalne' },
      { name: 'Package', label: 'Przesyłki / Kurier' },
      { name: 'Soup', label: 'Jedzenie na mieście' },
      { name: 'Truck', label: 'Przeprowadzki / Transport' },
      { name: 'Flame', label: 'Ogrzewanie / Gaz' },
      { name: 'Sofa', label: 'Wyposażenie / Meble' },
      { name: 'Bath', label: 'Środki czystości' },
      { name: 'Sparkles', label: 'Uroda / Pielęgnacja' }
    ]
  },
  {
    id: 'hobby',
    name: 'Hobby',
    icons: [
      { name: 'Smile', label: 'Rozrywka' },
      { name: 'Gamepad2', label: 'Gry / Gaming' },
      { name: 'Tv', label: 'Subskrypcje / Kino' },
      { name: 'Music', label: 'Koncerty / Muzyka' },
      { name: 'Film', label: 'Filmy / Seriale' },
      { name: 'Camera', label: 'Fotografia' },
      { name: 'Palette', label: 'Sztuka / Malarstwo' },
      { name: 'BookOpen', label: 'Książki / Prasa' },
      { name: 'Beer', label: 'Wyjścia / Puby' },
      { name: 'Wine', label: 'Alkohol / Restauracje' },
      { name: 'Gift', label: 'Prezenty / Okazje' },
      { name: 'Dices', label: 'Planszówki' },
      { name: 'Trophy', label: 'Sukcesy / Sport wyczynowy' },
      { name: 'Clapperboard', label: 'Wydarzenia / Bilety' },
      { name: 'Theater', label: 'Teatr / Kultura' },
      { name: 'Brush', label: 'Kreatywność / Twórczość' },
      { name: 'Crown', label: 'Luksus / Premium' },
      { name: 'PartyPopper', label: 'Imprezy / Eventy' },
      { name: 'Guitar', label: 'Instrumenty muzyczne' },
      { name: 'Compass', label: 'Spacer / Odkrywanie' }
    ]
  },
  {
    id: 'travel',
    name: 'Podróże',
    icons: [
      { name: 'Plane', label: 'Bilety lotnicze' },
      { name: 'Globe', label: 'Wyjazdy zagraniczne' },
      { name: 'Map', label: 'Wycieczki krajowe' },
      { name: 'Luggage', label: 'Bagaże / Pakiety' },
      { name: 'Bike', label: 'Rower / Aktywność' },
      { name: 'Train', label: 'Kolej / Komunikacja' },
      { name: 'Hotel', label: 'Zakwaterowanie / Nocleg' },
      { name: 'Caravan', label: 'Kemping / RV' },
      { name: 'Ship', label: 'Rejsy / Promy' },
      { name: 'Footprints', label: 'Góry / Wędrówki' },
      { name: 'MapPin', label: 'Atrakcje lokalne' },
      { name: 'Ticket', label: 'Wejściówki' },
      { name: 'Tent', label: 'Namiot / Przygoda' },
      { name: 'Anchor', label: 'Żeglarstwo' },
      { name: 'Fuel', label: 'Opłaty drogowe / Autostrady' }
    ]
  },
  {
    id: 'health',
    name: 'Zdrowie',
    icons: [
      { name: 'HeartPulse', label: 'Lekarstwa / Zdrowie' },
      { name: 'Heart', label: 'Miłość / Bliscy' },
      { name: 'Dumbbell', label: 'Siłownia / Fitness' },
      { name: 'Baby', label: 'Dziecko / Wyprawka' },
      { name: 'PawPrint', label: 'Karma / Weterynarz' },
      { name: 'Apple', label: 'Zdrowy tryb życia' },
      { name: 'Pill', label: 'Apteka / Suplementy' },
      { name: 'Stethoscope', label: 'Badania / Lekarz' },
      { name: 'Trees', label: 'Rekreacja na powietrzu' },
      { name: 'Flower2', label: 'Kwiaty / Ogród' },
      { name: 'GraduationCap', label: 'Edukacja / Kursy' },
      { name: 'Users', label: 'Zgromadzenia / Spotkania' },
      { name: 'HeartHandshake', label: 'Pomoc / Darowizny' },
      { name: 'Brain', label: 'Terapia / Zdrowie psychiczne' },
      { name: 'Salad', label: 'Diety / Eko' },
      { name: 'Crosshair', label: 'Skupienie / Rozwój osobisty' },
      { name: 'Syringe', label: 'Szczepienia / Zabiegi' },
      { name: 'Bed', label: 'Odpoczynek / Sen / Sanatoria' }
    ]
  }
];

export const AVAILABLE_ICONS = CATEGORIZED_ICONS.flatMap(cat => cat.icons);

export const AVAILABLE_COLORS = [
  { class: 'amber', bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', bgLight: 'bg-amber-50', hover: 'hover:bg-amber-100', progress: 'bg-amber-500' },
  { class: 'orange', bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200', bgLight: 'bg-orange-50', hover: 'hover:bg-orange-100', progress: 'bg-orange-500' },
  { class: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200', bgLight: 'bg-yellow-50', hover: 'hover:bg-yellow-100', progress: 'bg-yellow-500' },
  { class: 'lime', bg: 'bg-lime-500', text: 'text-lime-600', border: 'border-lime-200', bgLight: 'bg-lime-50', hover: 'hover:bg-lime-100', progress: 'bg-lime-500' },
  { class: 'green', bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', bgLight: 'bg-green-50', hover: 'hover:bg-green-100', progress: 'bg-green-500' },
  { class: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', bgLight: 'bg-emerald-50', hover: 'hover:bg-emerald-100', progress: 'bg-emerald-500' },
  { class: 'teal', bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-200', bgLight: 'bg-teal-50', hover: 'hover:bg-teal-100', progress: 'bg-teal-500' },
  { class: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-200', bgLight: 'bg-cyan-50', hover: 'hover:bg-cyan-100', progress: 'bg-cyan-500' },
  { class: 'sky', bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-200', bgLight: 'bg-sky-50', hover: 'hover:bg-sky-100', progress: 'bg-sky-500' },
  { class: 'blue', bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', bgLight: 'bg-blue-50', hover: 'hover:bg-blue-100', progress: 'bg-blue-500' },
  { class: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-200', bgLight: 'bg-indigo-50', hover: 'hover:bg-indigo-100', progress: 'bg-indigo-500' },
  { class: 'purple', bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200', bgLight: 'bg-purple-50', hover: 'hover:bg-purple-100', progress: 'bg-purple-500' },
  { class: 'violet', bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-200', bgLight: 'bg-violet-50', hover: 'hover:bg-violet-100', progress: 'bg-violet-500' },
  { class: 'fuchsia', bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', border: 'border-fuchsia-200', bgLight: 'bg-fuchsia-50', hover: 'hover:bg-fuchsia-100', progress: 'bg-fuchsia-500' },
  { class: 'pink', bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-200', bgLight: 'bg-pink-50', hover: 'hover:bg-pink-100', progress: 'bg-pink-500' },
  { class: 'rose', bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200', bgLight: 'bg-rose-50', hover: 'hover:bg-rose-100', progress: 'bg-rose-500' },
  { class: 'stone', bg: 'bg-stone-500', text: 'text-stone-600', border: 'border-stone-200', bgLight: 'bg-stone-50', hover: 'hover:bg-stone-100', progress: 'bg-stone-500' },
  { class: 'zinc', bg: 'bg-zinc-500', text: 'text-zinc-600', border: 'border-zinc-200', bgLight: 'bg-zinc-50', hover: 'hover:bg-zinc-100', progress: 'bg-zinc-500' }
];

export function getColorConfig(colorName: string) {
  return AVAILABLE_COLORS.find(c => c.class === colorName) || AVAILABLE_COLORS[9];
}

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

/** Tworzy pusty miesiąc budżetowy (bez żadnych danych demo) */
export function createEmptyMonth(monthId: string): BudgetMonth {
  const [year, monthNum] = monthId.split('-');
  const monthIndex = parseInt(monthNum) - 1;
  return {
    id: monthId,
    name: `${POLISH_MONTHS[monthIndex]} ${year}`,
    freeFunds: 0,
    freeFundsRollover: 0,
    envelopes: [],
    savingGoals: [],
    transactions: [],
    isClosed: false,
    plannedTransactions: [],
  };
}

/** Dane startowe — 12 pustych miesięcy 2026 */
export const INITIAL_BUDGET_MONTHS: BudgetMonth[] = Array.from({ length: 12 }, (_, i) => {
  const monthNum = (i + 1).toString().padStart(2, '0');
  return createEmptyMonth(`2026-${monthNum}`);
});
