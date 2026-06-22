import client from './client'

export const analyticsApi = {
  getSummary: () =>
    client.get('/analytics/summary').then(r => r.data),

  getAdminStats: () =>
    client.get('/admin/stats').then(r => r.data),
}
