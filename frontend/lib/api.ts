const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface RequestOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
}

async function apiRequest(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body, headers = {} } = options

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Auth
  requestOTP: (email: string, purpose: string = 'login') =>
    apiRequest('/auth/request-otp', { method: 'POST', body: { email, purpose } }),

  verifyOTP: (email: string, code: string, purpose: string = 'login') =>
    apiRequest('/auth/verify-otp', { method: 'POST', body: { email, code, purpose } }),

  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),

  getMe: () =>
    apiRequest('/auth/me'),

  updateTheme: (theme: string) =>
    apiRequest('/auth/theme', { method: 'PATCH', body: { theme } }),

  // Application
  submitApplication: (data: { what_building: string; why_join: string; proof_url?: string; how_heard?: string }) =>
    apiRequest('/application/submit', { method: 'POST', body: data }),

  getApplicationStatus: () =>
    apiRequest('/application/status'),

  updateApplication: (data: { what_building: string; why_join: string; proof_url?: string }) =>
    apiRequest('/application/update', { method: 'PATCH', body: data }),

  // Identity
  chooseIdentity: (three_word_id: string) =>
    apiRequest('/identity/choose', { method: 'POST', body: { three_word_id } }),

  generateIdentityOptions: () =>
    apiRequest('/identity/generate'),

  resetIdentity: () =>
    apiRequest('/identity/reset', { method: 'POST' }),

  // Sessions
  startSession: (intent: string) =>
    apiRequest('/sessions/start', { method: 'POST', body: { intent } }),

  autosaveSession: (sessionId: string, content: string) =>
    apiRequest(`/sessions/${sessionId}/autosave`, { method: 'PATCH', body: { content } }),

  analyzeSession: (sessionId: string, content: string, duration_seconds: number, linked_sessions?: string[]) =>
    apiRequest(`/sessions/${sessionId}/analyze`, {
      method: 'POST',
      body: { content, duration_seconds, linked_sessions }
    }),

  savePrivate: (sessionId: string, content: string, ai_analysis: string, duration_seconds: number, journal_title: string) =>
    apiRequest(`/sessions/${sessionId}/save-private`, {
      method: 'POST',
      body: { title: journal_title, content, ai_analysis, duration_seconds }
    }),

  shareSession: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/share`, { method: 'POST', body: data }),

  getMySessions: (page: number = 1, limit: number = 20) =>
    apiRequest(`/sessions/mine?page=${page}&limit=${limit}`),

  getSession: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}`),

  searchSessionsForLinking: (query: string = '', limit: number = 20) =>
    apiRequest(`/sessions/search-for-linking?q=${encodeURIComponent(query)}&limit=${limit}`),

  // Posts
  getPosts: (params: { page?: number; limit?: number; intent?: string; topics?: string } = {}) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.limit) query.append('limit', params.limit.toString())
    if (params.intent) query.append('intent', params.intent)
    if (params.topics) query.append('topics', params.topics)
    return apiRequest(`/posts?${query.toString()}`)
  },

  getPost: (postId: string) =>
    apiRequest(`/posts/${postId}`),

  getPostsByIdentity: (threeWordId: string, page: number = 1, limit: number = 20) =>
    apiRequest(`/posts/by-identity/${threeWordId}?page=${page}&limit=${limit}`),

  addReaction: (postId: string, reaction_type: string) =>
    apiRequest(`/posts/${postId}/react`, { method: 'POST', body: { reaction_type } }),

  removeReaction: (postId: string, reaction_type: string) =>
    apiRequest(`/posts/${postId}/react/${reaction_type}`, { method: 'DELETE' }),

  addComment: (postId: string, content: string) =>
    apiRequest(`/posts/${postId}/comment`, { method: 'POST', body: { content } }),

  flagPost: (postId: string, reason: string) =>
    apiRequest(`/posts/${postId}/flag`, { method: 'POST', body: { reason } }),

  // Topics
  getAllTopics: () =>
    apiRequest('/topics'),

  getFollowingTopics: () =>
    apiRequest('/topics/following'),

  followTopic: (topic: string) =>
    apiRequest('/topics/follow', { method: 'POST', body: { topic } }),

  unfollowTopic: (topic: string) =>
    apiRequest(`/topics/unfollow/${topic}`, { method: 'DELETE' }),

  getTopicPosts: (topic: string, page: number = 1, limit: number = 20) =>
    apiRequest(`/topics/${topic}/posts?page=${page}&limit=${limit}`),

  // Search
  search: (query: string, topics?: string, limit: number = 20) => {
    const params = new URLSearchParams({ q: query, limit: limit.toString() })
    if (topics) params.append('topics', topics)
    return apiRequest(`/search?${params.toString()}`)
  },

  // Admin
  getApplications: (status: string = 'pending', page: number = 1, limit: number = 20) =>
    apiRequest(`/admin/applications?status=${status}&page=${page}&limit=${limit}`),

  approveApplication: (applicationId: string, admin_notes?: string) =>
    apiRequest(`/admin/applications/${applicationId}/approve`, {
      method: 'PATCH',
      body: { admin_notes }
    }),

  rejectApplication: (applicationId: string, rejection_reason: string, admin_notes?: string) =>
    apiRequest(`/admin/applications/${applicationId}/reject`, {
      method: 'PATCH',
      body: { rejection_reason, admin_notes }
    }),

  requestMoreInfo: (applicationId: string, more_info_request: string, admin_notes?: string) =>
    apiRequest(`/admin/applications/${applicationId}/request-info`, {
      method: 'PATCH',
      body: { more_info_request, admin_notes }
    }),

  getAdminStats: () =>
    apiRequest('/admin/stats'),

  getAdminAnalytics: (start_date: string, end_date: string) =>
    apiRequest(`/admin/analytics?start_date=${start_date}&end_date=${end_date}`),

  getFlaggedPosts: (page: number = 1, limit: number = 20) =>
    apiRequest(`/admin/flags?page=${page}&limit=${limit}`),

  deletePost: (postId: string) =>
    apiRequest(`/admin/posts/${postId}`, { method: 'DELETE' }),

  // Stats
  getLiveStats: () =>
    apiRequest('/stats/live'),
}
