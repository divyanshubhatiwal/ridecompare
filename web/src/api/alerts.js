import client from './client'

export const alertsApi = {
  create: (alert) => client.post('/alerts/price', alert).then(r => r.data),
  list: () => client.get('/alerts').then(r => r.data),
  delete: (id) => client.delete(`/alerts/${id}`),
}
