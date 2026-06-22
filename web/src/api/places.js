import client from './client'

export const placesApi = {
  autocomplete: (query) =>
    client.get('/places/autocomplete', { params: { query } }).then(r => r.data),

  savePlace: (place) =>
    client.post('/places/save', place).then(r => r.data),

  getSaved: () =>
    client.get('/places/saved').then(r => r.data),
}
