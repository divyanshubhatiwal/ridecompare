import client from './client'

export const authApi = {
  register: (email, fullName, password) =>
    client.post('/auth/register', { email, full_name: fullName, password }).then(r => r.data),

  verifyEmail: (email, otp) =>
    client.post('/auth/verify-email', { email, otp }).then(r => r.data),

  resendOtp: (email) =>
    client.post('/auth/resend-otp', { email }).then(r => r.data),

  forgotPassword: (email) =>
    client.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (email, otp, new_password) =>
    client.post('/auth/reset-password', { email, otp, new_password }).then(r => r.data),

  login: (email, password) =>
    client.post('/auth/login', { email, password }).then(r => r.data),

  logout: (refreshToken) =>
    client.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {}),

  getMe: () => client.get('/users/me').then(r => r.data),

  updateMe: (data) => client.patch('/users/me', data).then(r => r.data),
}
