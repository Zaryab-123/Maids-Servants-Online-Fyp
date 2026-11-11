/**
 * City options for the client's Filteration screen — one source of truth.
 *
 * React Native reference: assets/components/Client/FilterationScreen.js
 *   L13  const RECOMMENDED_CITIES = [...]          // 10 curated cities
 *   L18  const CITY_OPTIONS = ['All', ...RECOMMENDED_CITIES]
 *   L42  const defaultCity = route.params?.defaultCity || 'All'
 *   L43-48  cityOptions = ['All', defaultCity, ...RECOMMENDED_CITIES]  (when defaultCity is custom & not 'All')
 *   L114 setSelectedCity(city || defaultCity || 'All')
 *   L223 city: selectedCity || defaultCity || 'All'
 *   L234 setSelectedCity(defaultCity || 'All')
 *
 * `defaultCity` is "the city the client is currently in": it pre-selects the
 * filter so the list shows workers of that city, and Reset returns to it rather
 * than to nothing. 'All' means "no city restriction" — the backend treats it
 * exactly like an empty city (DashboardController GetWorkersForClient, L278-284:
 * "All" intentionally means no location restriction).
 */

export const RECOMMENDED_CITIES = [
    'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi',
    'Faisalabad', 'Peshawar', 'Multan', 'Quetta',
    'Gujranwala', 'Sialkot',
];

export const CITY_OPTIONS = ['All', ...RECOMMENDED_CITIES];

/** RN's `cityOptions`, verbatim: 'All' first, a custom default second, then the curated list. */
export function buildCityOptions(defaultCity) {
    const base = (defaultCity || 'All').trim() || 'All';
    const isRecommended = RECOMMENDED_CITIES.some(
        (city) => city.toLowerCase() === base.toLowerCase(),
    );
    if (base.toLowerCase() === 'all' || isRecommended) return CITY_OPTIONS;
    return ['All', base, ...RECOMMENDED_CITIES];
}

/**
 * The client's current city, derived from the saved profile address.
 *
 *   "House 12, F-8/3, Islamabad"   → "Islamabad"   (matches a curated city)
 *   "Main Road, Attock"            → "Attock"      (kept as a custom city — the
 *                                                   backend filters by Address.Contains)
 *   ""                             → "All"
 *
 * The curated list is checked first so a trailing sector/postal segment
 * ("F-8/3") can never be mistaken for a city.
 */
export function deriveCurrentCity(address) {
    const raw = typeof address === 'string' ? address.trim() : '';
    if (!raw || raw === 'N/A') return 'All';

    const lower = raw.toLowerCase();
    const known = RECOMMENDED_CITIES.find((city) => lower.includes(city.toLowerCase()));
    if (known) return known;

    const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
    const last = parts[parts.length - 1] || '';
    // Anything carrying a digit is a sector, house number or postal code
    // ("F-8/3", "44000"), never a city — filtering on it would return no
    // workers, so fall back to 'All' instead.
    if (!last || last === 'N/A' || /\d/.test(last)) return 'All';
    return last;
}
