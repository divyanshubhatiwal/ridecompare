import client from './client'

export const ridesApi = {
  compare: (route) =>
    client.post('/compare/rides', {
      pickup_lat: route.pickupLat,
      pickup_lng: route.pickupLng,
      pickup_address: route.pickupAddress,
      destination_lat: route.destinationLat,
      destination_lng: route.destinationLng,
      destination_address: route.destinationAddress,
    }).then(r => r.data),

  getHistory: (limit = 20, offset = 0) =>
    client.get('/compare/history', { params: { limit, offset } }).then(r => r.data),

  getHistoryDetail: (searchId) =>
    client.get(`/compare/history/${searchId}`).then(r => r.data),
}
