import client from './client'
import { getWebBookingUrl } from '../utils/openRideApp'

export const notifyApi = {
  status: () =>
    client.get('/notify/whatsapp/status').then(r => r.data),

  saveNumber: (phone_number) =>
    client.put('/notify/whatsapp/number', { phone_number }).then(r => r.data),

  sendRideUpdate: (routePickup, routeDestination, results, route) =>
    client.post('/notify/whatsapp/send', {
      route_pickup: routePickup,
      route_destination: routeDestination,
      results: results.map(r => ({
        provider:         r.provider_display_name,
        fare:             r.fare_display,
        eta:              r.eta_minutes,
        is_surging:       r.is_surging || false,
        badges:           r.badges || [],
        category_display: r.category_display || '',
        booking_url:      getWebBookingUrl(r.provider, route),
      })),
    }).then(r => r.data),

  sendTest: () =>
    client.post('/notify/whatsapp/test').then(r => r.data),

  sendSOS: (ec_phone, ec_name) =>
    client.post('/notify/whatsapp/sos', { ec_phone, ec_name }).then(r => r.data),

  callSOS: (ec_phone, ec_name) =>
    client.post('/notify/voice/sos', { ec_phone, ec_name }).then(r => r.data),

  smsSOS: (ec_phone, ec_name) =>
    client.post('/notify/sms/sos', { ec_phone, ec_name }).then(r => r.data),
}
