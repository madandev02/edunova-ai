from pydantic import BaseModel


class CourseOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    is_premium: bool = False
    is_locked: bool = False
    estimated_time_hours: int
    lessons_count: int
    modules_count: int
    learning_objectives: list[str] = []
    prerequisites: list[str] = []
    resume_lesson_id: int | None = None
    resume_lesson_title: str | None = None
    resume_playback_seconds: int | None = None
    resume_completion_ratio: float | None = None

    model_config = {'from_attributes': True}


class ModuleOut(BaseModel):
    id: int
    title: str
    course_id: int

    model_config = {'from_attributes': True}


class LessonListOut(BaseModel):
    id: int
    title: str
    difficulty: str
    module_id: int
    order_index: int

    model_config = {'from_attributes': True}


class LessonContentBlock(BaseModel):
    id: str
    title: str
    body: str


class LessonOption(BaseModel):
    id: str
    label: str
    value: str


class LessonVideoSection(BaseModel):
    id: str
    label: str
    start_seconds: int


class LessonTranscriptSegment(BaseModel):
    id: str
    start_seconds: int
    text: str


class LessonDetailOut(BaseModel):
    id: int
    title: str
    topic: str
    content: list[LessonContentBlock]
    lesson_goal: str
    key_concepts: list[str] = []
    quiz_question: str | None = None
    quiz_options: list[LessonOption] | None = None
    video_url: str | None = None
    video_duration_seconds: int | None = None
    video_sections: list[LessonVideoSection] = []
    transcript_segments: list[LessonTranscriptSegment] = []


class LessonNestedOut(BaseModel):
    id: int
    title: str
    difficulty: str
    order_index: int

    model_config = {'from_attributes': True}


class ModuleNestedOut(BaseModel):
    id: int
    title: str
    lessons: list[LessonNestedOut]


class CourseDetailOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    is_premium: bool = False
    is_locked: bool = False
    estimated_time_hours: int
    lessons_count: int
    modules_count: int
    progress_percentage: float
    learning_objectives: list[str] = []
    prerequisites: list[str] = []
    modules: list[ModuleNestedOut]


class InstructorCourseCreateIn(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str
    is_premium: bool = False
    thumbnail_url: str | None = None


class InstructorCourseUpdateIn(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    difficulty: str | None = None
    is_premium: bool | None = None
    thumbnail_url: str | None = None


class InstructorCourseOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    is_premium: bool
    thumbnail_url: str | None = None
    instructor_id: int | None = None

    model_config = {'from_attributes': True}


class InstructorModuleCreateIn(BaseModel):
    title: str


class InstructorModuleUpdateIn(BaseModel):
    title: str | None = None


class InstructorModuleOut(BaseModel):
    id: int
    title: str
    course_id: int

    model_config = {'from_attributes': True}


class InstructorLessonCreateIn(BaseModel):
    title: str
    content: str
    difficulty: str = 'medium'
    order_index: int = 1
    quiz_question: str | None = None
    quiz_options: str | None = None
    correct_answer: str | None = None
    video_url: str | None = None
    video_duration_seconds: int | None = None


class InstructorLessonUpdateIn(BaseModel):
    title: str | None = None
    content: str | None = None
    difficulty: str | None = None
    order_index: int | None = None
    quiz_question: str | None = None
    quiz_options: str | None = None
    correct_answer: str | None = None
    video_url: str | None = None
    video_duration_seconds: int | None = None


class InstructorLessonOut(BaseModel):
    id: int
    title: str
    content: str
    difficulty: str
    order_index: int
    quiz_question: str | None = None
    quiz_options: str | None = None
    correct_answer: str | None = None
    video_url: str | None = None
    video_duration_seconds: int | None = None
    module_id: int

    model_config = {'from_attributes': True}
