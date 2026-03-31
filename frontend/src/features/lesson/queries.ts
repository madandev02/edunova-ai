import { useMutation, useQuery } from '@tanstack/react-query'
import type { LessonSubmissionRequest, TranscriptNotesRequest, VideoProgressRequest } from '../../types/api'
import { apiService } from '../../services/api'
import { queryClient } from '../../services/queryClient'

export const useLessonQuery = (lessonId: string | undefined) => {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => apiService.getLesson(lessonId as string),
    enabled: Boolean(lessonId),
  })
}

export const useLessonSubmissionMutation = (lessonId: string | undefined) => {
  return useMutation({
    mutationFn: (payload: LessonSubmissionRequest) =>
      apiService.submitLessonAnswer(lessonId as string, payload),
  })
}

export const useMarkLessonCompleteMutation = (lessonId: string | undefined) => {
  return useMutation({
    mutationFn: () => apiService.markLessonComplete(lessonId as string),
  })
}

export const useLessonVideoProgressQuery = (lessonId: string | undefined) => {
  return useQuery({
    queryKey: ['lesson-video-progress', lessonId],
    queryFn: () => apiService.getLessonVideoProgress(lessonId as string),
    enabled: Boolean(lessonId),
  })
}

export const useUpsertLessonVideoProgressMutation = (lessonId: string | undefined) => {
  return useMutation({
    mutationFn: (payload: VideoProgressRequest) =>
      apiService.saveLessonVideoProgress(lessonId as string, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lesson-video-progress', lessonId] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['analytics'] })
      void queryClient.invalidateQueries({ queryKey: ['learning-path'] })
      void queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}

export const useTranscriptNotesQuery = (lessonId: string | undefined) => {
  return useQuery({
    queryKey: ['transcript-notes', lessonId],
    queryFn: () => apiService.getTranscriptNotes(lessonId as string),
    enabled: Boolean(lessonId),
  })
}

export const useUpsertTranscriptNotesMutation = (lessonId: string | undefined) => {
  return useMutation({
    mutationFn: (payload: TranscriptNotesRequest) =>
      apiService.saveTranscriptNotes(lessonId as string, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transcript-notes', lessonId] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['analytics'] })
      void queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}
