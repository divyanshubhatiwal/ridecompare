const UA = navigator.userAgent || ''
const isAndroid = /android/i.test(UA)
const isIOS     = /iphone|ipad|ipod/i.test(UA)

// Deep-link configs per provider
const CONFIGS = {
  uber: {
    android_pkg: 'com.ubercab',
    android: (r, cat) =>
      `intent://?action=setPickup` +
      `&pickup[latitude]=${r.pickupLat}&pickup[longitude]=${r.pickupLng}` +
      `&dropoff[latitude]=${r.destinationLat}&dropoff[longitude]=${r.destinationLng}` +
      `&product_id=${cat}` +
      `#Intent;scheme=uber;package=com.ubercab;` +
      `S.browser_fallback_url=${enc('https://play.google.com/store/apps/details?id=com.ubercab')};end`,
    ios: (r) =>
      `uber://?action=setPickup` +
      `&pickup[latitude]=${r.pickupLat}&pickup[longitude]=${r.pickupLng}` +
      `&dropoff[latitude]=${r.destinationLat}&dropoff[longitude]=${r.destinationLng}`,
    web: (r) =>
      `https://m.uber.com/ul/?action=setPickup` +
      `&pickup[latitude]=${r.pickupLat}&pickup[longitude]=${r.pickupLng}` +
      `&pickup[nickname]=Pickup` +
      `&dropoff[latitude]=${r.destinationLat}&dropoff[longitude]=${r.destinationLng}` +
      `&dropoff[nickname]=Drop`,
    store_android: 'https://play.google.com/store/apps/details?id=com.ubercab',
    store_ios:     'https://apps.apple.com/in/app/uber/id368677368',
  },
  ola: {
    android_pkg: 'com.ani.taxi',
    android: (r, cat) =>
      `intent://app/launch?lat=${r.pickupLat}&lng=${r.pickupLng}` +
      `&drop_lat=${r.destinationLat}&drop_lng=${r.destinationLng}&category=${cat}` +
      `#Intent;scheme=olacabs;package=com.ani.taxi;` +
      `S.browser_fallback_url=${enc('https://play.google.com/store/apps/details?id=com.ani.taxi')};end`,
    ios: (r) =>
      `olacabs://app/launch?lat=${r.pickupLat}&lng=${r.pickupLng}` +
      `&drop_lat=${r.destinationLat}&drop_lng=${r.destinationLng}`,
    web: (r) =>
      `https://book.olacabs.com/?pickup_lat=${r.pickupLat}&pickup_lng=${r.pickupLng}` +
      `&drop_lat=${r.destinationLat}&drop_lng=${r.destinationLng}`,
    store_android: 'https://play.google.com/store/apps/details?id=com.ani.taxi',
    store_ios:     'https://apps.apple.com/in/app/ola/id539179365',
  },
  rapido: {
    android_pkg: 'com.rapido.passenger',
    android: (r, cat) =>
      `intent://book?pickup_lat=${r.pickupLat}&pickup_lng=${r.pickupLng}` +
      `&drop_lat=${r.destinationLat}&drop_lng=${r.destinationLng}&service_type=${cat}` +
      `#Intent;scheme=rapido;package=com.rapido.passenger;` +
      `S.browser_fallback_url=${enc('https://play.google.com/store/apps/details?id=com.rapido.passenger')};end`,
    ios: (r) =>
      `rapido://book?pickup_lat=${r.pickupLat}&pickup_lng=${r.pickupLng}` +
      `&drop_lat=${r.destinationLat}&drop_lng=${r.destinationLng}`,
    web: () => 'https://play.google.com/store/apps/details?id=com.rapido.passenger',
    store_android: 'https://play.google.com/store/apps/details?id=com.rapido.passenger',
    store_ios:     'https://apps.apple.com/in/app/rapido/id1138969067',
  },
  indrive: {
    android_pkg: 'sinet.startup.inDriver',
    android: (r) =>
      `intent://?pickup_lat=${r.pickupLat}&pickup_lng=${r.pickupLng}` +
      `&dropoff_lat=${r.destinationLat}&dropoff_lng=${r.destinationLng}` +
      `#Intent;scheme=indrive;package=sinet.startup.inDriver;` +
      `S.browser_fallback_url=${enc('https://play.google.com/store/apps/details?id=sinet.startup.inDriver')};end`,
    ios: (r) =>
      `indrive://?pickup_lat=${r.pickupLat}&pickup_lng=${r.pickupLng}` +
      `&dropoff_lat=${r.destinationLat}&dropoff_lng=${r.destinationLng}`,
    web: () => 'https://play.google.com/store/apps/details?id=sinet.startup.inDriver',
    store_android: 'https://play.google.com/store/apps/details?id=sinet.startup.inDriver',
    store_ios:     'https://apps.apple.com/in/app/indrive/id1380501198',
  },
}

function enc(url) { return encodeURIComponent(url) }

function key(provider) {
  return provider.toLowerCase().replace(/[\s_-]+/g, '')
    .replace('olacabs', 'ola')
    .replace('indriver', 'indrive')
}

/**
 * Open the booking platform for a given provider and route.
 * - Android  → Android Intent URL (opens app; falls back to Play Store)
 * - iOS      → Custom URL scheme (tries app; falls back to App Store after 1.5s)
 * - Desktop  → Web booking page in new tab
 */
export function openRideApp(provider, category, route) {
  const cfg = CONFIGS[key(provider)]

  if (!cfg) {
    window.open(
      `https://www.google.com/search?q=${enc(provider + ' ride booking india')}`,
      '_blank'
    )
    return
  }

  const hasCoords = route?.pickupLat && route?.destinationLat

  if (isAndroid) {
    // intent:// scheme: Chrome opens app directly, falls back to Play Store
    window.location.href = hasCoords
      ? cfg.android(route, category)
      : cfg.store_android

  } else if (isIOS) {
    if (hasCoords) {
      // Try app scheme; after 1.5s assume app not installed → App Store
      const t = setTimeout(() => window.open(cfg.store_ios, '_blank'), 1500)
      window.location.href = cfg.ios(route, category)
      // Cancel fallback if page hid (app opened)
      window.addEventListener('blur', () => clearTimeout(t), { once: true })
    } else {
      window.open(cfg.store_ios, '_blank')
    }

  } else {
    // Desktop — web booking in new tab
    window.open(cfg.web(route, category), '_blank')
  }
}

export function getStoreLink(provider) {
  const cfg = CONFIGS[key(provider)]
  return isIOS ? cfg?.store_ios : cfg?.store_android
}

/** Returns a mobile-friendly web URL suitable for embedding in WhatsApp messages. */
export function getWebBookingUrl(provider, route) {
  const cfg = CONFIGS[key(provider)]
  if (!cfg) return `https://www.google.com/search?q=${enc(provider + ' ride booking india')}`
  const hasCoords = route?.pickupLat && route?.destinationLat
  return hasCoords ? cfg.web(route) : (cfg.store_android || cfg.web(route))
}
