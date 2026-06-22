import client from './client'

export const prefsApi = {
  get: () => client.get('/preferences').then(r => r.data),
  update: (data) => client.patch('/preferences', data).then(r => r.data),
}
