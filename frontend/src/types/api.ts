export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type UserRole = 'student' | 'instructor' | 'admin'

export interface AuthUser {
  id: number
  email: string
  role: UserRole
  level: string
  learning_style: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  level: string
  learning_style: string
}

export interface AuthTokenResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface CourseSummary {
  id: number
  title: string
  description: string
  category: string
  difficulty: string
  isPremium?: boolean
  isLocked?: boolean
  estimated_time_hours: number
  lessons_count: number
  modules_count: number
  learning_objectives: string[]
  prerequisites: string[]
  resume_lesson_id?: number | null
  resume_lesson_title?: string | null
  resume_playback_seconds?: number | null
  resume_completion_ratio?: number | null
}

export interface LessonNested {
  id: number
  title: string
  difficulty: string
  order_index: number
}

export interface ModuleNested {
  id: number
  title: string
  lessons: LessonNested[]
}

export interface CourseDetail {
  id: number
  title: string
  description: string
  category: string
  difficulty: string
  isPremium?: boolean
  isLocked?: boolean
  estimated_time_hours: number
  lessons_count: number
  modules_count: number
  progress_percentage: number
  learning_objectives: string[]
  prerequisites: string[]
  modules: ModuleNested[]
}

export interface OnboardingRequest {
  goal: string
  interests: string[]
  experience_level: string
  assessment_answers?: Array<
    | boolean
    | {
        question_id: string
        difficulty: 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED'
        correct: boolean
      }
  >
}

export interface OnboardingStatusResponse {
  completed: boolean
  level: string | null
  first_course_id: number | null
}

export interface OnboardingCompleteResponse {
  level: string
  assessment_score?: number | null
  first_course_id: number | null
  first_course_title: string | null
  generated_learning_path_lesson_ids: number[]
  rationale?: string | null
}

export interface ProgressSnapshot {
  percentage: number
  currentLevel: string
}

export interface WeakArea {
  topic: string
  score: number
}

export interface Recommendation {
  id: string
  topic: string
  priority: RecommendationPriority
  decayRule?: string
  reason: string
}

export interface SkillPoint {
  topic: string
  score: number
}

export interface GamificationSnapshot {
  xp: number
  level: number
  streakDays: number
  achievements: string[]
}

export interface RecentActivity {
  id: string
  topic: string
  score: number
  attemptedAt: string
}

export interface DashboardResponse {
  progress: ProgressSnapshot
  gamification: GamificationSnapshot
  skillProfile: SkillPoint[]
  weakAreas: WeakArea[]
  recommendations: Recommendation[]
  recentActivity: RecentActivity[]
  resumeLessons: ResumeLesson[]
}

export interface ResumeLesson {
  lessonId: number
  lessonTitle: string
  courseId?: number | null
  courseTitle?: string | null
  playbackSeconds: number
  completionRatio: number
  lastWatchedAt?: string | null
}

export type LessonStatus = 'completed' | 'in_progress' | 'locked'

export interface LearningPathItem {
  id: number
  title: string
  difficulty: string
  status: LessonStatus
  priority: RecommendationPriority
  order: number
  reason: string
  dependsOnLessonId?: number | null
}

export interface LearningPathResponse {
  items: LearningPathItem[]
  currentLessonId: number | null
}

export interface LessonQuizOption {
  id: string
  label: string
  value: string
}

export interface LessonContentBlock {
  id: string
  title: string
  body: string
}

export interface LessonVideoSection {
  id: string
  label: string
  startSeconds: number
}

export interface LessonTranscriptSegment {
  id: string
  startSeconds: number
  text: string
}

export interface LessonResponse {
  id: number
  title: string
  topic: string
  content: LessonContentBlock[]
  lessonGoal: string
  keyConcepts: string[]
  quizQuestion?: string
  quizOptions?: LessonQuizOption[]
  videoUrl?: string
  videoDurationSeconds?: number
  videoSections?: LessonVideoSection[]
  transcriptSegments?: LessonTranscriptSegment[]
}

export interface VideoProgressRequest {
  playback_seconds: number
  completed_section_ids: string[]
  video_duration_seconds?: number
}

export interface VideoProgressResponse {
  lessonId: number
  playbackSeconds: number
  completedSectionIds: string[]
  completionRatio: number
}

export interface TranscriptNote {
  id: number
  lessonId: number
  segmentId: string
  highlightText?: string | null
  noteText?: string | null
}

export interface TranscriptNotesRequest {
  notes: Array<{
    segment_id: string
    highlight_text?: string | null
    note_text?: string | null
  }>
}

export interface LessonSubmissionRequest {
  answer: string
  time_spent_seconds?: number
}

export interface LessonSubmissionResponse {
  score: number
  feedback: string
  recommendationImpact?: string
  xpGained?: number
  streakDays?: number
}

export interface ProgressCompleteResponse {
  lesson_id: number
  completed: boolean
}

export interface PerformancePoint {
  date: string
  score: number
}

export interface SuccessRatePoint {
  topic: string
  rate: number
}

export interface AttemptsPoint {
  topic: string
  attempts: number
}

export interface AnalyticsResponse {
  overallProgress: number
  successRate: number
  weakAreas: WeakArea[]
  performanceOverTime: PerformancePoint[]
  successRateByTopic: SuccessRatePoint[]
  attemptsPerTopic: AttemptsPoint[]
}

export interface AssistantRequest {
  message: string
}

export interface AssistantResponse {
  reply: string
  context?: string
}

export interface ContentAuditSummary {
  courses: number
  modules: number
  lessons: number
  video_mismatch: number
  quiz_mismatch: number
  structure_mismatch: number
  issues_total: number
}

export interface ContentAuditResponse {
  healthy: boolean
  summary: ContentAuditSummary
  startup_summary?: ContentAuditSummary | null
}

export interface ContentAuditIssue {
  type: 'video_mismatch' | 'quiz_mismatch' | 'structure_mismatch'
  severity: 'high' | 'medium' | 'low'
  message: string
  course_id?: number
  module_id?: number
  lesson_id?: number
  course_title?: string
  module_title?: string
  lesson_title?: string
  expected_video_url?: string
  actual_video_url?: string | null
  key_concepts?: string[]
}

export interface ContentAuditDetailedResponse {
  startup_report: {
    healthy: boolean
    summary: ContentAuditSummary
    issues: ContentAuditIssue[]
  } | null
  live_report: {
    healthy: boolean
    summary: ContentAuditSummary
    issues: ContentAuditIssue[]
  }
}

export interface ContentAuditFixResponse {
  dry_run: boolean
  proposed_fixes_total: number
  applied_fixes_total: number
  non_fixable_total: number
  proposed_fixes: Array<{
    kind: 'video_alignment' | 'quiz_alignment'
    lesson_id: number
    lesson_title: string
    before: Record<string, unknown>
    after: Record<string, unknown>
  }>
  non_fixable: Array<{
    type: 'structure_mismatch'
    message: string
    course_id?: number
    module_id?: number
    course_title?: string
    module_title?: string
  }>
  post_report: {
    healthy: boolean
    summary: ContentAuditSummary
    issues: ContentAuditIssue[]
  }
}

export interface SubscriptionStatus {
  plan: 'free' | 'pro' | 'premium' | string
  status: string
  isActive: boolean
  lastPaymentAt?: string | null
}

export interface CheckoutSessionResponse {
  checkoutUrl: string
  sessionId: string
}

export interface CustomerPortalSessionResponse {
  portalUrl: string
}

export interface WebhookEventItem {
  id: number
  stripeEventId?: string | null
  eventType: string
  userId?: number | null
  status: string
  errorMessage?: string | null
  payloadJson?: string | null
  createdAt: string
}

export interface WebhookEventListResponse {
  items: WebhookEventItem[]
}

export interface RetryWebhookEventResponse {
  retried: boolean
  eventId: number
  status: string
}

export interface ReviewOut {
  id: number
  course_id: number
  user_id: number
  rating: number
  comment: string
  created_at: string
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
}

export interface ReviewListResponse {
  items: ReviewOut[]
  total: number
  stats: ReviewStats
}

export interface DiscussionPost {
  id: number
  course_id: number
  user_id: number
  parent_id?: number | null
  kind: 'question' | 'answer' | 'comment'
  body: string
  accepted_answer: boolean
  created_at: string
}

export interface DiscussionThread {
  id: number
  course_id: number
  user_id: number
  kind: 'question' | 'answer' | 'comment'
  body: string
  accepted_answer: boolean
  created_at: string
  replies: DiscussionPost[]
}

export interface DiscussionListResponse {
  items: DiscussionThread[]
  total: number
}

export interface AssistantSource {
  lesson: string
  relevance: number
}
