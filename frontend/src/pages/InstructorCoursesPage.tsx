import { useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Typography, Card, CardContent, Chip, Alert, Paper } from '@mui/material'
import { Plus } from 'lucide-react'
import { useInstructorCoursesQuery, useCreateCourseMutation, useUpdateCourseMutation, useDeleteCourseMutation } from '../features/instructor/instructorQueries'
import { LoadingState } from '../components/states/LoadingState'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { useNotification } from '../features/notifications/NotificationContext'
import { usePageTitle } from '../hooks/usePageTitle'

interface CourseFormData {
  title: string
  description: string
  category: string
  difficulty: string
  learning_objectives: string
  prerequisites: string
  estimated_time_hours: number
}

const DEFAULT_FORM: CourseFormData = {
  title: '',
  description: '',
  category: '',
  difficulty: 'Beginner',
  learning_objectives: '',
  prerequisites: '',
  estimated_time_hours: 20,
}

export const InstructorCoursesPage = () => {
  usePageTitle('My Courses')
  const { addNotification } = useNotification()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CourseFormData>(DEFAULT_FORM)

  const { data: courses, isPending, isError, error, refetch } = useInstructorCoursesQuery()
  const createMutation = useCreateCourseMutation()
  const updateMutation = useUpdateCourseMutation()
  const deleteMutation = useDeleteCourseMutation()

  const handleOpenDialog = () => {
    setEditingCourseId(null)
    setFormData(DEFAULT_FORM)
    setOpenDialog(true)
  }

  const handleEditCourse = (courseId: string) => {
    const course = courses?.find((c) => String(c.id) === courseId)
    if (course) {
      setEditingCourseId(courseId)
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        learning_objectives: course.learning_objectives.join('\n'),
        prerequisites: course.prerequisites.join('\n'),
        estimated_time_hours: course.estimated_time_hours,
      })
      setOpenDialog(true)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleSaveCourse = async () => {
    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      learning_objectives: formData.learning_objectives.split('\n').filter((o) => o.trim()),
      prerequisites: formData.prerequisites.split('\n').filter((p) => p.trim()),
      estimated_time_hours: formData.estimated_time_hours,
    }

    if (editingCourseId) {
      await updateMutation.mutateAsync({ courseId: editingCourseId, payload })
      addNotification('Course updated successfully.', 'success')
    } else {
      await createMutation.mutateAsync(payload)
      addNotification('Course created successfully.', 'success')
    }
    setOpenDialog(false)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      await deleteMutation.mutateAsync(courseId)
      addNotification('Course deleted.', 'success')
    }
  }

  if (isPending) {
    return <LoadingState label="Loading your courses..." />
  }

  if (isError) {
    return <ErrorState message={error?.message || 'Failed to load courses'} onRetry={() => void refetch()} />
  }

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
          <Stack>
            <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
              My Courses
            </Typography>
            <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Manage Your Courses
            </Typography>
          </Stack>
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={handleOpenDialog} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            New Course
          </Button>
        </Stack>
      </Paper>

      {!courses || courses.length === 0 ? (
        <EmptyState title="No courses yet" description="Create your first course to get started." />
      ) : (
        <Stack spacing={{ xs: 1.1, md: 1.4 }}>
          {courses.map((course) => (
            <Card key={course.id} sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
                <Stack spacing={1.4}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={1.2}>
                    <Stack flex={1}>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{course.title}</Typography>
                      <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</Typography>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ minWidth: { sm: 160 } }}>
                      <Button size="small" variant="outlined" onClick={() => handleEditCourse(String(course.id))} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        Edit
                      </Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteCourse(String(course.id))} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        Delete
                      </Button>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={course.category} size="small" variant="outlined" />
                    <Chip label={course.difficulty} size="small" sx={{ bgcolor: 'primary.light', color: 'white' }} />
                    <Chip label={`${course.estimated_time_hours}h`} size="small" variant="outlined" />
                    <Chip label={`${course.lessons_count} lessons`} size="small" variant="outlined" />
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Chip label={`${course.learning_objectives.length} objectives`} size="small" variant="outlined" />
                    <Chip label={`${course.prerequisites.length} prerequisites`} size="small" variant="outlined" />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingCourseId ? 'Edit Course' : 'Create New Course'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {(createMutation.isError || updateMutation.isError) && (
            <Alert severity="error">
              {(createMutation.error as Error)?.message || (updateMutation.error as Error)?.message}
            </Alert>
          )}

          <TextField
            label="Course Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />

          <TextField
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            fullWidth
          />

          <TextField
            select
            label="Difficulty"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            SelectProps={{ native: true }}
            fullWidth
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </TextField>

          <TextField
            label="Learning Objectives (one per line)"
            value={formData.learning_objectives}
            onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />

          <TextField
            label="Prerequisites (one per line)"
            value={formData.prerequisites}
            onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
            multiline
            rows={2}
            fullWidth
          />

          <TextField
            type="number"
            label="Estimated Time (hours)"
            value={formData.estimated_time_hours}
            onChange={(e) => setFormData({ ...formData, estimated_time_hours: parseInt(e.target.value) || 0 })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCourse}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending || !formData.title.trim() || !formData.description.trim() || !formData.category.trim()}
          >
            {editingCourseId ? 'Update Course' : 'Create Course'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
