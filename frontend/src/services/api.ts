import axios from 'axios'
import type {
  AnalyticsResponse,
  AssistantRequest,
  AssistantResponse,
  ContentAuditDetailedResponse,
  ContentAuditFixResponse,
  ContentAuditResponse,
  AuthTokenResponse,
  CourseDetail,
  CourseSummary,
  DashboardResponse,
  LoginRequest,
  OnboardingCompleteResponse,
  OnboardingRequest,
  OnboardingStatusResponse,
  ProgressCompleteResponse,
  LearningPathResponse,
  LessonResponse,
  RegisterRequest,
  LessonSubmissionRequest,
  LessonSubmissionResponse,
  TranscriptNote,
  TranscriptNotesRequest,
  VideoProgressRequest,
  VideoProgressResponse,
  CheckoutSessionResponse,
  SubscriptionStatus,
  CustomerPortalSessionResponse,
  RetryWebhookEventResponse,
  WebhookEventItem,
  WebhookEventListResponse,
  ReviewListResponse,
  DiscussionListResponse,
} from '../types/api'
import { getStoredToken } from '../features/auth/AuthProvider'

type LooseRecord = Record<string, unknown>

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const normalizeDashboard = (raw: LooseRecord): DashboardResponse => {
  const progress = (raw.progress ?? {}) as LooseRecord
  const gamification = (raw.gamification ?? {}) as LooseRecord
  const recommendations = (raw.recommendations ?? []) as LooseRecord[]
  const recentActivity = (raw.recent_activity ?? raw.recentActivity ?? []) as LooseRecord[]
  const skillProfile = (raw.skillProfile ?? raw.skill_profile ?? []) as LooseRecord[]
  const weakAreas = (raw.weakAreas ?? raw.weak_areas ?? []) as LooseRecord[]
  const resumeLessons = (raw.resumeLessons ?? raw.resume_lessons ?? []) as LooseRecord[]

  return {
    progress: {
      percentage: Number(progress.percentage ?? 0),
      currentLevel: String(progress.currentLevel ?? progress.current_level ?? 'BEGINNER'),
    },
    gamification: {
      xp: Number(gamification.xp ?? 0),
      level: Number(gamification.level ?? 1),
      streakDays: Number(gamification.streakDays ?? gamification.streak_days ?? 0),
      achievements: Array.isArray(gamification.achievements)
        ? (gamification.achievements as string[])
        : [],
    },
    skillProfile: Array.isArray(skillProfile)
      ? skillProfile.map((item) => ({
          topic: String(item.topic ?? 'General'),
          score: Number(item.score ?? 0),
        }))
      : [],
    weakAreas: Array.isArray(weakAreas)
      ? weakAreas.map((area) => ({
          topic: String(area.topic ?? 'General'),
          score: Number(area.score ?? 0),
        }))
      : [],
    recommendations: Array.isArray(recommendations)
      ? recommendations.map((item, index) => ({
          id: String(item.id ?? item.lesson_id ?? `rec-${index}`),
          topic: String(item.topic ?? 'Untitled'),
          priority: String(item.priority ?? 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
          decayRule: String(item.decayRule ?? item.decay_rule ?? 'none'),
          reason: String(item.reason ?? ''),
        }))
      : [],
    recentActivity: Array.isArray(recentActivity)
      ? recentActivity.map((item, index) => ({
          id: String(item.id ?? index),
          topic: String(item.topic ?? 'Unknown'),
          score: Number(item.score ?? 0),
          attemptedAt: String(item.attemptedAt ?? item.attempted_at ?? new Date().toISOString()),
        }))
      : [],
    resumeLessons: Array.isArray(resumeLessons)
      ? resumeLessons.map((item) => ({
          lessonId: Number(item.lessonId ?? item.lesson_id ?? 0),
          lessonTitle: String(item.lessonTitle ?? item.lesson_title ?? 'Lesson'),
          courseId: Number(item.courseId ?? item.course_id ?? 0) || null,
          courseTitle: (item.courseTitle ?? item.course_title ?? null) as string | null,
          playbackSeconds: Number(item.playbackSeconds ?? item.playback_seconds ?? 0),
          completionRatio: Number(item.completionRatio ?? item.completion_ratio ?? 0),
          lastWatchedAt: (item.lastWatchedAt ?? item.last_watched_at ?? null) as string | null,
        }))
      : [],
  }
}

const normalizeAnalytics = (raw: LooseRecord): AnalyticsResponse => {
  const performance = (raw.performanceOverTime ?? raw.performance_over_time ?? []) as LooseRecord[]
  const successRates = (raw.successRateByTopic ?? raw.success_rate_by_topic ?? []) as LooseRecord[]
  const attempts = (raw.attemptsPerTopic ?? raw.attempts_per_topic ?? []) as LooseRecord[]
  const weakAreas = (raw.weakAreas ?? raw.weak_areas ?? []) as LooseRecord[]

  return {
    overallProgress: Number(raw.overallProgress ?? raw.overall_progress ?? 0),
    successRate: Number(raw.successRate ?? raw.success_rate ?? 0),
    weakAreas: Array.isArray(weakAreas)
      ? weakAreas.map((item) => ({
          topic: String(item.topic ?? 'General'),
          score: Number(item.score ?? 0),
        }))
      : [],
    performanceOverTime: Array.isArray(performance)
      ? performance.map((item) => ({
          date: String(item.date ?? ''),
          score: Number(item.score ?? 0),
        }))
      : [],
    successRateByTopic: Array.isArray(successRates)
      ? successRates.map((item) => ({
          topic: String(item.topic ?? 'General'),
          rate: Number(item.rate ?? 0),
        }))
      : [],
    attemptsPerTopic: Array.isArray(attempts)
      ? attempts.map((item) => ({
          topic: String(item.topic ?? 'General'),
          attempts: Number(item.attempts ?? 0),
        }))
      : [],
  }
}

const normalizeLesson = (raw: LooseRecord): LessonResponse => {
  const videoSections = (raw.videoSections ?? raw.video_sections ?? []) as LooseRecord[]

  return {
    id: Number(raw.id),
    title: String(raw.title ?? 'Lesson'),
    topic: String(raw.topic ?? 'General'),
    content: Array.isArray(raw.content) ? (raw.content as LessonResponse['content']) : [],
    lessonGoal: String(raw.lessonGoal ?? raw.lesson_goal ?? 'Understand the core lesson concepts and apply them.'),
    keyConcepts: Array.isArray(raw.keyConcepts ?? raw.key_concepts)
      ? ((raw.keyConcepts ?? raw.key_concepts) as unknown[]).map((item) => String(item))
      : [],
    quizQuestion: (raw.quizQuestion ?? raw.quiz_question ?? undefined) as string | undefined,
    quizOptions: (raw.quizOptions ?? raw.quiz_options ?? undefined) as LessonResponse['quizOptions'],
    videoUrl: (raw.videoUrl ?? raw.video_url ?? undefined) as string | undefined,
    videoDurationSeconds: Number(raw.videoDurationSeconds ?? raw.video_duration_seconds ?? 0) || undefined,
    videoSections: Array.isArray(videoSections)
      ? videoSections.map((section) => ({
            id: String(section.id),
            label: String(section.label),
            startSeconds: Number(section.startSeconds ?? section.start_seconds ?? 0),
          }))
        : [],
    transcriptSegments: Array.isArray(raw.transcriptSegments ?? raw.transcript_segments)
      ? ((raw.transcriptSegments ?? raw.transcript_segments) as LooseRecord[]).map((segment) => ({
          id: String(segment.id),
          startSeconds: Number(segment.startSeconds ?? segment.start_seconds ?? 0),
          text: String(segment.text ?? ''),
        }))
      : [],
  }
}

const normalizeVideoProgress = (raw: LooseRecord): VideoProgressResponse => {
  return {
    lessonId: Number(raw.lessonId ?? raw.lesson_id ?? 0),
    playbackSeconds: Number(raw.playbackSeconds ?? raw.playback_seconds ?? 0),
    completedSectionIds: Array.isArray(raw.completedSectionIds ?? raw.completed_section_ids)
      ? ((raw.completedSectionIds ?? raw.completed_section_ids) as unknown[]).map((item) => String(item))
      : [],
    completionRatio: Number(raw.completionRatio ?? raw.completion_ratio ?? 0),
  }
}

const normalizeTranscriptNotes = (raw: unknown): TranscriptNote[] => {
  if (!Array.isArray(raw)) {
    return []
  }

  return (raw as LooseRecord[]).map((item) => ({
    id: Number(item.id ?? 0),
    lessonId: Number(item.lessonId ?? item.lesson_id ?? 0),
    segmentId: String(item.segmentId ?? item.segment_id ?? ''),
    highlightText: (item.highlightText ?? item.highlight_text ?? null) as string | null,
    noteText: (item.noteText ?? item.note_text ?? null) as string | null,
  }))
}

const normalizeCourseSummary = (raw: LooseRecord): CourseSummary => {
  return {
    id: Number(raw.id ?? 0),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    category: String(raw.category ?? 'General'),
    difficulty: String(raw.difficulty ?? 'beginner'),
    isPremium: Boolean(raw.isPremium ?? raw.is_premium ?? false),
    isLocked: Boolean(raw.isLocked ?? raw.is_locked ?? false),
    estimated_time_hours: Number(raw.estimated_time_hours ?? raw.estimatedTimeHours ?? 0),
    lessons_count: Number(raw.lessons_count ?? raw.lessonsCount ?? 0),
    modules_count: Number(raw.modules_count ?? raw.modulesCount ?? 0),
    learning_objectives: Array.isArray(raw.learning_objectives) ? (raw.learning_objectives as string[]) : [],
    prerequisites: Array.isArray(raw.prerequisites) ? (raw.prerequisites as string[]) : [],
    resume_lesson_id: (raw.resume_lesson_id ?? raw.resumeLessonId ?? null) as number | null,
    resume_lesson_title: (raw.resume_lesson_title ?? raw.resumeLessonTitle ?? null) as string | null,
    resume_playback_seconds: (raw.resume_playback_seconds ?? raw.resumePlaybackSeconds ?? null) as number | null,
    resume_completion_ratio: (raw.resume_completion_ratio ?? raw.resumeCompletionRatio ?? null) as number | null,
  }
}

const normalizeCourseDetail = (raw: LooseRecord): CourseDetail => {
  return {
    id: Number(raw.id ?? 0),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    category: String(raw.category ?? 'General'),
    difficulty: String(raw.difficulty ?? 'beginner'),
    isPremium: Boolean(raw.isPremium ?? raw.is_premium ?? false),
    isLocked: Boolean(raw.isLocked ?? raw.is_locked ?? false),
    estimated_time_hours: Number(raw.estimated_time_hours ?? raw.estimatedTimeHours ?? 0),
    lessons_count: Number(raw.lessons_count ?? raw.lessonsCount ?? 0),
    modules_count: Number(raw.modules_count ?? raw.modulesCount ?? 0),
    progress_percentage: Number(raw.progress_percentage ?? raw.progressPercentage ?? 0),
    learning_objectives: Array.isArray(raw.learning_objectives) ? (raw.learning_objectives as string[]) : [],
    prerequisites: Array.isArray(raw.prerequisites) ? (raw.prerequisites as string[]) : [],
    modules: Array.isArray(raw.modules) ? (raw.modules as CourseDetail['modules']) : [],
  }
}

const normalizeSubscriptionStatus = (raw: LooseRecord): SubscriptionStatus => {
  return {
    plan: String(raw.plan ?? 'free'),
    status: String(raw.status ?? 'inactive'),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? false),
    lastPaymentAt: (raw.lastPaymentAt ?? raw.last_payment_at ?? null) as string | null,
  }
}

const normalizeCheckoutSession = (raw: LooseRecord): CheckoutSessionResponse => {
  return {
    checkoutUrl: String(raw.checkoutUrl ?? raw.checkout_url ?? ''),
    sessionId: String(raw.sessionId ?? raw.session_id ?? ''),
  }
}

const normalizeCustomerPortalSession = (raw: LooseRecord): CustomerPortalSessionResponse => {
  return {
    portalUrl: String(raw.portalUrl ?? raw.portal_url ?? ''),
  }
}

const normalizeReviewList = (raw: LooseRecord): ReviewListResponse => {
  const items = (raw.items ?? []) as LooseRecord[]
  const stats = (raw.stats ?? {}) as LooseRecord
  return {
    items: items.map((item) => ({
      id: Number(item.id ?? 0),
      course_id: Number(item.course_id ?? 0),
      user_id: Number(item.user_id ?? 0),
      rating: Number(item.rating ?? 0),
      comment: String(item.comment ?? ''),
      created_at: String(item.created_at ?? ''),
    })),
    total: Number(raw.total ?? 0),
    stats: {
      total_reviews: Number(stats.total_reviews ?? 0),
      average_rating: Number(stats.average_rating ?? 0),
    },
  }
}

const normalizeDiscussionList = (raw: LooseRecord): DiscussionListResponse => {
  const items = (raw.items ?? []) as LooseRecord[]
  return {
    items: items.map((item) => ({
      id: Number(item.id ?? 0),
      course_id: Number(item.course_id ?? 0),
      user_id: Number(item.user_id ?? 0),
      kind: String(item.kind ?? 'question') as 'question' | 'answer' | 'comment',
      body: String(item.body ?? ''),
      accepted_answer: Boolean(item.accepted_answer ?? false),
      created_at: String(item.created_at ?? ''),
      replies: Array.isArray(item.replies)
        ? (item.replies as LooseRecord[]).map((r) => ({
            id: Number(r.id ?? 0),
            course_id: Number(r.course_id ?? 0),
            user_id: Number(r.user_id ?? 0),
            parent_id: Number(r.parent_id ?? null) || null,
            kind: String(r.kind ?? 'comment') as 'question' | 'answer' | 'comment',
            body: String(r.body ?? ''),
            accepted_answer: Boolean(r.accepted_answer ?? false),
            created_at: String(r.created_at ?? ''),
          }))
        : [],
    })),
    total: Number(raw.total ?? 0),
  }
}

const normalizeWebhookEventItem = (raw: LooseRecord): WebhookEventItem => {
  return {
    id: Number(raw.id ?? 0),
    stripeEventId: (raw.stripeEventId ?? raw.stripe_event_id ?? null) as string | null,
    eventType: String(raw.eventType ?? raw.event_type ?? 'unknown'),
    userId: (raw.userId ?? raw.user_id ?? null) as number | null,
    status: String(raw.status ?? 'received'),
    errorMessage: (raw.errorMessage ?? raw.error_message ?? null) as string | null,
    payloadJson: (raw.payloadJson ?? raw.payload_json ?? null) as string | null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  }
}

const normalizeWebhookEventList = (raw: LooseRecord): WebhookEventListResponse => {
  const itemsRaw = Array.isArray(raw.items) ? (raw.items as LooseRecord[]) : []
  return {
    items: itemsRaw.map(normalizeWebhookEventItem),
  }
}

const normalizeRetryWebhookEvent = (raw: LooseRecord): RetryWebhookEventResponse => {
  return {
    retried: Boolean(raw.retried ?? false),
    eventId: Number(raw.eventId ?? raw.event_id ?? 0),
    status: String(raw.status ?? 'received'),
  }
}

export const apiServiceRaw = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 15000,
})

apiServiceRaw.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiServiceRaw.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.detail ?? error.message ?? 'Unexpected API error'
      const status = Number(error.response?.status ?? 0)
      return Promise.reject(new ApiError(String(message), status))
    }

    return Promise.reject(error)
  },
)

export const apiService = {
  register: async (payload: RegisterRequest) => {
    const { data } = await apiServiceRaw.post<AuthTokenResponse>('/auth/register', payload)
    return data
  },

  login: async (payload: LoginRequest) => {
    const { data } = await apiServiceRaw.post<AuthTokenResponse>('/auth/login', payload)
    return data
  },

  me: async () => {
    const { data } = await apiServiceRaw.get<AuthTokenResponse['user']>('/auth/me')
    return data
  },

  getOnboardingStatus: async () => {
    const { data } = await apiServiceRaw.get<OnboardingStatusResponse>('/onboarding/status')
    return data
  },

  completeOnboarding: async (payload: OnboardingRequest) => {
    const { data } = await apiServiceRaw.post<OnboardingCompleteResponse>('/onboarding/complete', payload)
    return data
  },

  getCourses: async (filters?: { category?: string; difficulty?: string; search?: string }) => {
    const cleaned = {
      category: filters?.category || undefined,
      difficulty: filters?.difficulty || undefined,
      search: filters?.search || undefined,
    }
    const { data } = await apiServiceRaw.get('/courses', {
      params: cleaned,
    })
    if (!Array.isArray(data)) {
      return []
    }
    return (data as LooseRecord[]).map(normalizeCourseSummary)
  },

  getPublicCourses: async (filters?: { category?: string; difficulty?: string; search?: string; limit?: number }) => {
    const cleaned = {
      category: filters?.category || undefined,
      difficulty: filters?.difficulty || undefined,
      search: filters?.search || undefined,
      limit: filters?.limit || undefined,
    }
    const { data } = await apiServiceRaw.get('/public/courses', {
      params: cleaned,
    })
    if (!Array.isArray(data)) {
      return []
    }
    return (data as LooseRecord[]).map(normalizeCourseSummary)
  },

  getCourseDetail: async (courseId: string) => {
    const { data } = await apiServiceRaw.get(`/courses/${courseId}`)
    return normalizeCourseDetail(data as LooseRecord)
  },

  getDashboard: async () => {
    const { data } = await apiServiceRaw.get('/dashboard')
    return normalizeDashboard(data as LooseRecord)
  },

  getLearningPath: async () => {
    const { data } = await apiServiceRaw.get<LearningPathResponse>('/learning-path')
    return data
  },

  getLesson: async (lessonId: string) => {
    const { data } = await apiServiceRaw.get(`/lessons/${lessonId}`)
    return normalizeLesson(data as LooseRecord)
  },

  submitLessonAnswer: async (
    lessonId: string,
    payload: LessonSubmissionRequest,
  ) => {
    const { data } = await apiServiceRaw.post<LessonSubmissionResponse>(
      `/lessons/${lessonId}/submit`,
      payload,
    )
    return data
  },

  markLessonComplete: async (lessonId: string) => {
    const { data } = await apiServiceRaw.post<ProgressCompleteResponse>(
      `/progress/lessons/${lessonId}/complete`,
    )
    return data
  },

  getLessonVideoProgress: async (lessonId: string) => {
    const { data } = await apiServiceRaw.get(`/progress/lessons/${lessonId}/video`)
    return normalizeVideoProgress(data as LooseRecord)
  },

  saveLessonVideoProgress: async (lessonId: string, payload: VideoProgressRequest) => {
    const { data } = await apiServiceRaw.put(`/progress/lessons/${lessonId}/video`, payload)
    return normalizeVideoProgress(data as LooseRecord)
  },

  getTranscriptNotes: async (lessonId: string) => {
    const { data } = await apiServiceRaw.get(`/progress/lessons/${lessonId}/transcript-notes`)
    return normalizeTranscriptNotes(data)
  },

  saveTranscriptNotes: async (lessonId: string, payload: TranscriptNotesRequest) => {
    const { data } = await apiServiceRaw.put(`/progress/lessons/${lessonId}/transcript-notes`, payload)
    return normalizeTranscriptNotes(data)
  },

  getAnalytics: async () => {
    const { data } = await apiServiceRaw.get('/analytics')
    return normalizeAnalytics(data as LooseRecord)
  },

  askAssistant: async (payload: AssistantRequest) => {
    const { data } = await apiServiceRaw.post<AssistantResponse>('/assistant/chat', payload)
    return data
  },

  getContentAudit: async () => {
    const { data } = await apiServiceRaw.get<ContentAuditResponse>('/content/audit')
    return data
  },

  getContentAuditDetails: async () => {
    const { data } = await apiServiceRaw.get<ContentAuditDetailedResponse>('/content/audit', {
      params: { include_issues: true },
    })
    return data
  },

  fixContentAudit: async (dryRun: boolean) => {
    const { data } = await apiServiceRaw.post<ContentAuditFixResponse>('/content/audit/fix', null, {
      params: { dry_run: dryRun },
    })
    return data
  },

  getSubscriptionStatus: async () => {
    const { data } = await apiServiceRaw.get('/billing/subscription')
    return normalizeSubscriptionStatus(data as LooseRecord)
  },

  createCheckoutSession: async (plan: 'pro' | 'premium') => {
    const { data } = await apiServiceRaw.post('/billing/checkout-session', { plan })
    return normalizeCheckoutSession(data as LooseRecord)
  },

  getWebhookEvents: async (filters?: { limit?: number; status?: string; eventType?: string; userId?: number }) => {
    const { data } = await apiServiceRaw.get('/billing/webhook-events', {
      params: {
        limit: filters?.limit ?? 20,
        status: filters?.status || undefined,
        event_type: filters?.eventType || undefined,
        user_id: filters?.userId ?? undefined,
      },
    })
    return normalizeWebhookEventList(data as LooseRecord)
  },

  retryWebhookEvent: async (eventId: number) => {
    const { data } = await apiServiceRaw.post(`/billing/webhook-events/${eventId}/retry`)
    return normalizeRetryWebhookEvent(data as LooseRecord)
  },

  createCustomerPortalSession: async () => {
    const { data } = await apiServiceRaw.post('/billing/customer-portal-session')
    return normalizeCustomerPortalSession(data as LooseRecord)
  },

  getReviews: async (courseId: string, filters?: { limit?: number; skip?: number }) => {
    const { data } = await apiServiceRaw.get(`/courses/${courseId}/reviews`, {
      params: {
        limit: filters?.limit || undefined,
        skip: filters?.skip || undefined,
      },
    })
    return normalizeReviewList(data as LooseRecord)
  },

  createReview: async (courseId: string, payload: { rating: number; comment: string }) => {
    const { data } = await apiServiceRaw.post(`/courses/${courseId}/reviews`, payload)
    return data as LooseRecord
  },

  updateReview: async (courseId: string, reviewId: number, payload: { rating?: number; comment?: string }) => {
    const { data } = await apiServiceRaw.put(`/courses/${courseId}/reviews/${reviewId}`, payload)
    return data as LooseRecord
  },

  deleteReview: async (courseId: string, reviewId: number) => {
    const { data } = await apiServiceRaw.delete(`/courses/${courseId}/reviews/${reviewId}`)
    return data as LooseRecord
  },

  getDiscussions: async (courseId: string, filters?: { limit?: number; skip?: number }) => {
    const { data } = await apiServiceRaw.get(`/courses/${courseId}/discussions`, {
      params: {
        limit: filters?.limit || undefined,
        skip: filters?.skip || undefined,
      },
    })
    return normalizeDiscussionList(data as LooseRecord)
  },

  createDiscussion: async (courseId: string, payload: { kind: 'question' | 'answer' | 'comment'; body: string; parent_id?: number }) => {
    const { data } = await apiServiceRaw.post(`/courses/${courseId}/discussions`, payload)
    return data as LooseRecord
  },

  updateDiscussion: async (courseId: string, discussionId: number, payload: { body?: string; accepted_answer?: boolean }) => {
    const { data } = await apiServiceRaw.put(`/courses/${courseId}/discussions/${discussionId}`, payload)
    return data as LooseRecord
  },

  deleteDiscussion: async (courseId: string, discussionId: number) => {
    const { data } = await apiServiceRaw.delete(`/courses/${courseId}/discussions/${discussionId}`)
    return data as LooseRecord
  },

  getInstructorCourses: async () => {
    const { data } = await apiServiceRaw.get('/instructor/courses')
    if (!Array.isArray(data)) {
      return []
    }
    return (data as LooseRecord[]).map(normalizeCourseSummary)
  },

  createInstructorCourse: async (payload: {
    title: string
    description: string
    category: string
    difficulty: string
    is_premium?: boolean
    thumbnail_url?: string | null
  }) => {
    const { data } = await apiServiceRaw.post('/instructor/courses', payload)
    return normalizeCourseSummary(data as LooseRecord)
  },

  updateInstructorCourse: async (
    courseId: string,
    payload: {
      title?: string
      description?: string
      category?: string
      difficulty?: string
      is_premium?: boolean
      thumbnail_url?: string | null
    },
  ) => {
    const { data } = await apiServiceRaw.put(`/instructor/courses/${courseId}`, payload)
    return normalizeCourseSummary(data as LooseRecord)
  },

  deleteInstructorCourse: async (courseId: string) => {
    const { data } = await apiServiceRaw.delete(`/instructor/courses/${courseId}`)
    return data as LooseRecord
  },
}
