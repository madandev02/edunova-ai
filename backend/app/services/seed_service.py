import json

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.course import Course, Lesson, Module
from app.models.user import User
from app.services.content_mapping_service import (
    build_topic_aligned_quiz_question,
    choose_curated_video,
    extract_key_concepts,
    is_generic_video,
)


SEED_CATALOG_VERSION = '2026.03.29.4'


COURSE_BLUEPRINTS = [
    {
        'title': 'Advanced Computational Thinking',
        'description': 'Adaptive course focused on recursion, complexity, and algorithmic design.',
        'category': 'Computer Science',
        'difficulty': 'intermediate',
        'modules': [
            {
                'title': 'Recursion Fundamentals',
                'lessons': [
                    {
                        'title': 'Base Cases and Recursive Calls',
                        'content': 'Recursion requires a stop condition and a self-referential step.\n\nIdentify base cases before writing any recursive function.',
                        'difficulty': 'easy',
                        'quiz_question': 'What prevents infinite recursion?',
                        'quiz_options': ['A clear base case', 'A global variable', 'A while loop'],
                        'correct_answer': 'A clear base case',
                    },
                    {
                        'title': 'Recursive Trees and Backtracking',
                        'content': 'Call trees model recursive growth and cost.\n\nBacktracking explores alternatives and undoes state changes.',
                        'difficulty': 'medium',
                        'quiz_question': 'Backtracking is most useful when?',
                        'quiz_options': ['Searching decision spaces', 'Sorting integers only', 'Managing SQL schemas'],
                        'correct_answer': 'Searching decision spaces',
                    },
                ],
            },
            {
                'title': 'Complexity and Optimization',
                'lessons': [
                    {
                        'title': 'Big-O for Real Systems',
                        'content': 'Asymptotic complexity approximates scalability trends.\n\nIn production, constants and memory behavior still matter.',
                        'difficulty': 'medium',
                        'quiz_question': 'What does O(n log n) usually indicate?',
                        'quiz_options': ['Divide-and-conquer scaling', 'Constant time performance', 'Exponential growth'],
                        'correct_answer': 'Divide-and-conquer scaling',
                    },
                    {
                        'title': 'Optimization Trade-offs',
                        'content': 'Optimization balances latency, throughput, and maintainability.\n\nMeasure before and after changes.',
                        'difficulty': 'hard',
                        'quiz_question': 'What should come first in optimization?',
                        'quiz_options': ['Profiling', 'Refactoring everything', 'Rewriting in C'],
                        'correct_answer': 'Profiling',
                    },
                ],
            },
        ],
    },
    {
        'title': 'Applied Data Analysis for Product Teams',
        'description': 'Learn to analyze product metrics, identify weak funnels, and make data-informed decisions.',
        'category': 'Data',
        'difficulty': 'beginner',
        'modules': [
            {
                'title': 'Product Metrics Foundations',
                'lessons': [
                    {
                        'title': 'North Star Metric Design',
                        'content': 'A North Star metric captures sustained user value.\n\nChoose one metric aligned to long-term product outcomes.',
                        'difficulty': 'easy',
                        'quiz_question': 'What defines a strong North Star metric?',
                        'quiz_options': ['Represents delivered user value', 'Only increases revenue instantly', 'Tracks total ad impressions'],
                        'correct_answer': 'Represents delivered user value',
                    },
                    {
                        'title': 'Event Taxonomy and Tracking Plans',
                        'content': 'Well-designed events make analytics trustworthy.\n\nDefine event names, ownership, and validation rules early.',
                        'difficulty': 'medium',
                        'quiz_question': 'Why create a tracking plan?',
                        'quiz_options': ['To keep event definitions consistent', 'To avoid using dashboards', 'To skip QA'],
                        'correct_answer': 'To keep event definitions consistent',
                    },
                ],
            },
            {
                'title': 'Cohort and Retention Analysis',
                'lessons': [
                    {
                        'title': 'Retention Curves in Practice',
                        'content': 'Retention curves reveal habit formation and churn windows.\n\nCompare cohorts by acquisition period and intent.',
                        'difficulty': 'medium',
                        'quiz_question': 'What does a flattening retention curve suggest?',
                        'quiz_options': ['A stable core user base', 'Immediate product-market fit', 'Tracking is broken'],
                        'correct_answer': 'A stable core user base',
                    },
                    {
                        'title': 'Diagnosing Funnel Drop-offs',
                        'content': 'Funnel diagnostics identify friction points.\n\nPrioritize drop-off steps with high volume and high business impact.',
                        'difficulty': 'hard',
                        'quiz_question': 'Which drop-off should be prioritized first?',
                        'quiz_options': ['High-impact, high-volume step', 'Last step only', 'Any random step'],
                        'correct_answer': 'High-impact, high-volume step',
                    },
                ],
            },
        ],
    },
    {
        'title': 'Frontend Engineering with React',
        'description': 'Build resilient interfaces with modern React patterns, state design, and performance practices.',
        'category': 'frontend',
        'difficulty': 'intermediate',
        'modules': [
            {
                'title': 'State and Component Architecture',
                'lessons': [
                    {
                        'title': 'State Co-location and Composition',
                        'content': 'Keep state near where it is used.\n\nCompose components to avoid prop-drilling overgrowth.',
                        'difficulty': 'easy',
                        'quiz_question': 'Why co-locate state?',
                        'quiz_options': ['To reduce unnecessary complexity', 'To avoid all props', 'To remove hooks'],
                        'correct_answer': 'To reduce unnecessary complexity',
                    },
                    {
                        'title': 'Designing Query Keys and Caching',
                        'content': 'Stable query keys enable predictable cache behavior.\n\nInvalidation should reflect domain events.',
                        'difficulty': 'medium',
                        'quiz_question': 'What makes a good query key?',
                        'quiz_options': ['Deterministic and data-scoped', 'Random on each render', 'Shared across all endpoints'],
                        'correct_answer': 'Deterministic and data-scoped',
                    },
                ],
            },
            {
                'title': 'Performance and UX Polish',
                'lessons': [
                    {
                        'title': 'Code Splitting and Route Streaming',
                        'content': 'Lazy loading trims initial bundles.\n\nPrioritize first interaction speed over total bytes alone.',
                        'difficulty': 'medium',
                        'quiz_question': 'What is the main benefit of route-level splitting?',
                        'quiz_options': ['Faster initial load', 'No need for caching', 'No runtime JavaScript'],
                        'correct_answer': 'Faster initial load',
                    },
                    {
                        'title': 'Resilient Loading and Empty States',
                        'content': 'Perceived speed depends on feedback clarity.\n\nDesign informative states for loading, error, and empty scenarios.',
                        'difficulty': 'easy',
                        'quiz_question': 'What do strong empty states do?',
                        'quiz_options': ['Guide the next action', 'Hide the issue', 'Replace analytics'],
                        'correct_answer': 'Guide the next action',
                    },
                ],
            },
        ],
    },
    {
        'title': 'Backend API Design with FastAPI',
        'description': 'Design secure, maintainable APIs with validation, auth, and robust domain services.',
        'category': 'backend',
        'difficulty': 'intermediate',
        'modules': [
            {
                'title': 'Domain Modeling and Validation',
                'lessons': [
                    {
                        'title': 'Pydantic Contracts that Scale',
                        'content': 'Schemas are product contracts.\n\nKeep request/response models explicit and versionable.',
                        'difficulty': 'easy',
                        'quiz_question': 'Why maintain explicit response models?',
                        'quiz_options': ['API consistency and safety', 'To avoid docs', 'To disable validation'],
                        'correct_answer': 'API consistency and safety',
                    },
                    {
                        'title': 'Service Layer Boundaries',
                        'content': 'Routes should orchestrate, services should decide.\n\nIsolation improves testability and evolution speed.',
                        'difficulty': 'medium',
                        'quiz_question': 'What belongs in service layer logic?',
                        'quiz_options': ['Business rules', 'Route decorators', 'HTTP status constants only'],
                        'correct_answer': 'Business rules',
                    },
                ],
            },
            {
                'title': 'Authentication and Security',
                'lessons': [
                    {
                        'title': 'JWT Session Design',
                        'content': 'JWTs carry identity claims for stateless APIs.\n\nKeep expiration and signing policies strict.',
                        'difficulty': 'medium',
                        'quiz_question': 'Why expire access tokens?',
                        'quiz_options': ['Limit risk window', 'Speed up SQL queries', 'Avoid HTTPS'],
                        'correct_answer': 'Limit risk window',
                    },
                    {
                        'title': 'CORS and Browser Security Basics',
                        'content': 'CORS controls browser-origin access, not backend auth.\n\nPair origin policies with proper token checks.',
                        'difficulty': 'easy',
                        'quiz_question': 'What does CORS primarily govern?',
                        'quiz_options': ['Browser cross-origin access', 'Database migrations', 'Password hashing strength'],
                        'correct_answer': 'Browser cross-origin access',
                    },
                ],
            },
        ],
    },
    {
        'title': 'Practical AI for Learning Products',
        'description': 'Apply recommendation, context, and feedback loops to ship AI-enabled learning experiences.',
        'category': 'AI',
        'difficulty': 'advanced',
        'modules': [
            {
                'title': 'Recommendation Systems Basics',
                'lessons': [
                    {
                        'title': 'Rule-based Recommendation Logic',
                        'content': 'Rules provide deterministic behavior and explainability.\n\nThey are great foundations before probabilistic ranking.',
                        'difficulty': 'medium',
                        'quiz_question': 'What is a key strength of rule-based recommenders?',
                        'quiz_options': ['Explainability', 'Zero maintenance', 'No data needed ever'],
                        'correct_answer': 'Explainability',
                    },
                    {
                        'title': 'Feedback Loops and Drift',
                        'content': 'Model outputs influence user behavior and future data.\n\nMonitor drift and bias amplification continuously.',
                        'difficulty': 'hard',
                        'quiz_question': 'Why monitor feedback loops?',
                        'quiz_options': ['To detect drift and bias', 'To remove all logging', 'To avoid recommendations'],
                        'correct_answer': 'To detect drift and bias',
                    },
                ],
            },
            {
                'title': 'Assistant and Learning Context',
                'lessons': [
                    {
                        'title': 'Context Windows and Personalization',
                        'content': 'Assistant quality depends on relevance of context.\n\nInclude progress, weak topics, and recent actions.',
                        'difficulty': 'medium',
                        'quiz_question': 'What improves assistant guidance quality most?',
                        'quiz_options': ['Personalized context', 'Longer generic prompts', 'No user history'],
                        'correct_answer': 'Personalized context',
                    },
                    {
                        'title': 'Instruction Quality and Guardrails',
                        'content': 'Clear constraints prevent unsafe or low-value outputs.\n\nUse explicit objectives and fallback behavior.',
                        'difficulty': 'hard',
                        'quiz_question': 'Why define assistant guardrails?',
                        'quiz_options': ['To keep responses safe and useful', 'To disable personalization', 'To avoid testing'],
                        'correct_answer': 'To keep responses safe and useful',
                    },
                ],
            },
        ],
    },
    {
        'title': 'Product Leadership for Technical Teams',
        'description': 'Lead roadmap execution with measurable outcomes, prioritization frameworks, and delivery cadences.',
        'category': 'Product',
        'difficulty': 'beginner',
        'modules': [
            {
                'title': 'Outcome-driven Planning',
                'lessons': [
                    {
                        'title': 'Defining Product Outcomes',
                        'content': 'Outcomes describe change in user behavior or business impact.\n\nAvoid output-only roadmaps.',
                        'difficulty': 'easy',
                        'quiz_question': 'What is an outcome?',
                        'quiz_options': ['A measurable impact', 'A list of tasks', 'A sprint board column'],
                        'correct_answer': 'A measurable impact',
                    },
                    {
                        'title': 'Prioritization under Constraints',
                        'content': 'Good prioritization balances impact, effort, and confidence.\n\nRevisit decisions as data changes.',
                        'difficulty': 'medium',
                        'quiz_question': 'Which triad helps prioritization?',
                        'quiz_options': ['Impact, effort, confidence', 'Velocity, aesthetics, luck', 'Deadlines only'],
                        'correct_answer': 'Impact, effort, confidence',
                    },
                ],
            },
            {
                'title': 'Execution and Communication',
                'lessons': [
                    {
                        'title': 'Writing Clear Product Specs',
                        'content': 'Specs align teams on problem, constraints, and acceptance criteria.\n\nKeep scope explicit.',
                        'difficulty': 'easy',
                        'quiz_question': 'What should a good spec include?',
                        'quiz_options': ['Problem and acceptance criteria', 'Only design mockups', 'Only engineering tasks'],
                        'correct_answer': 'Problem and acceptance criteria',
                    },
                    {
                        'title': 'Retrospectives that Drive Improvement',
                        'content': 'Retrospectives should create action, not just discussion.\n\nTrack owners and follow-through.',
                        'difficulty': 'medium',
                        'quiz_question': 'What makes a retro valuable?',
                        'quiz_options': ['Actionable follow-ups', 'Longer meetings', 'No accountability'],
                        'correct_answer': 'Actionable follow-ups',
                    },
                ],
            },
        ],
    },
    {
        'title': 'DevOps Delivery and Platform Reliability',
        'description': 'Ship faster with CI/CD, observability, and resilient deployment workflows.',
        'category': 'DevOps',
        'difficulty': 'intermediate',
        'modules': [
            {
                'title': 'Continuous Delivery Foundations',
                'lessons': [
                    {
                        'title': 'Pipeline Stages and Quality Gates',
                        'content': 'Reliable delivery pipelines separate build, test, and deploy concerns.\n\nQuality gates keep regressions from reaching production.',
                        'difficulty': 'medium',
                        'quiz_question': 'What is the purpose of a quality gate?',
                        'quiz_options': ['Block risky changes', 'Increase commit frequency', 'Skip integration tests'],
                        'correct_answer': 'Block risky changes',
                    },
                    {
                        'title': 'Release Strategies in Production',
                        'content': 'Blue-green and canary releases reduce deployment risk.\n\nRollback plans should be prepared before rollout.',
                        'difficulty': 'medium',
                        'quiz_question': 'Why use canary releases?',
                        'quiz_options': ['Reduce blast radius', 'Avoid monitoring', 'Eliminate feature flags'],
                        'correct_answer': 'Reduce blast radius',
                    },
                ],
            },
            {
                'title': 'Observability and Operations',
                'lessons': [
                    {
                        'title': 'Metrics, Logs, and Traces',
                        'content': 'Modern observability combines metrics, logs, and traces.\n\nTogether they shorten incident response time.',
                        'difficulty': 'easy',
                        'quiz_question': 'What does trace data help with most?',
                        'quiz_options': ['Understanding request flow', 'Styling dashboards', 'Compressing backups'],
                        'correct_answer': 'Understanding request flow',
                    },
                    {
                        'title': 'SLOs and Alert Design',
                        'content': 'Alerts should map to user-impacting SLO violations.\n\nToo many noisy alerts reduce response effectiveness.',
                        'difficulty': 'hard',
                        'quiz_question': 'What is a good alert characteristic?',
                        'quiz_options': ['Actionable and user-impacting', 'Frequent but vague', 'Only CPU-based'],
                        'correct_answer': 'Actionable and user-impacting',
                    },
                ],
            },
        ],
    },
    {
        'title': 'SQL and Data Modeling Essentials',
        'description': 'Master relational modeling, query optimization, and reporting-ready datasets.',
        'category': 'Data',
        'difficulty': 'beginner',
        'modules': [
            {
                'title': 'Relational Design',
                'lessons': [
                    {
                        'title': 'Normalization and Trade-offs',
                        'content': 'Normalization prevents redundancy but can increase join complexity.\n\nModeling depends on workload patterns.',
                        'difficulty': 'easy',
                        'quiz_question': 'Why normalize a schema?',
                        'quiz_options': ['Reduce redundancy', 'Increase nulls', 'Avoid indexes'],
                        'correct_answer': 'Reduce redundancy',
                    },
                    {
                        'title': 'Primary and Foreign Keys',
                        'content': 'Keys enforce integrity and joinability across entities.\n\nThey are critical for reliable analytics.',
                        'difficulty': 'easy',
                        'quiz_question': 'What does a foreign key enforce?',
                        'quiz_options': ['Referential integrity', 'Query caching', 'Column encryption'],
                        'correct_answer': 'Referential integrity',
                    },
                ],
            },
            {
                'title': 'Query Performance',
                'lessons': [
                    {
                        'title': 'Index Basics for Product Workloads',
                        'content': 'Indexes speed reads but add write overhead.\n\nChoose indexes based on actual query patterns.',
                        'difficulty': 'medium',
                        'quiz_question': 'What is the main benefit of an index?',
                        'quiz_options': ['Faster lookups', 'Automatic denormalization', 'Lower storage usage'],
                        'correct_answer': 'Faster lookups',
                    },
                    {
                        'title': 'Reading Query Plans',
                        'content': 'Execution plans reveal scans, joins, and bottlenecks.\n\nUse plans before and after tuning changes.',
                        'difficulty': 'medium',
                        'quiz_question': 'Why inspect execution plans?',
                        'quiz_options': ['Identify bottlenecks', 'Hide SQL errors', 'Avoid constraints'],
                        'correct_answer': 'Identify bottlenecks',
                    },
                ],
            },
        ],
    },
    {
        'title': 'Mobile Product Development Basics',
        'description': 'Build mobile-first product intuition for onboarding, engagement, and release quality.',
        'category': 'Mobile',
        'difficulty': 'beginner',
        'modules': [
            {
                'title': 'Mobile UX Fundamentals',
                'lessons': [
                    {
                        'title': 'Designing Onboarding for Mobile',
                        'content': 'Mobile onboarding must be concise and progressive.\n\nReduce friction while preserving context.',
                        'difficulty': 'easy',
                        'quiz_question': 'What is key for mobile onboarding?',
                        'quiz_options': ['Low friction', 'Long forms first', 'No personalization'],
                        'correct_answer': 'Low friction',
                    },
                    {
                        'title': 'Touch Targets and Accessibility',
                        'content': 'Accessible touch targets reduce interaction errors.\n\nReadable typography improves usability across devices.',
                        'difficulty': 'easy',
                        'quiz_question': 'Why matter touch target size?',
                        'quiz_options': ['Reduce mis-taps', 'Increase battery life', 'Improve backend speed'],
                        'correct_answer': 'Reduce mis-taps',
                    },
                ],
            },
            {
                'title': 'Release and Quality',
                'lessons': [
                    {
                        'title': 'Crash Monitoring Essentials',
                        'content': 'Crash analytics should include affected flows and app versions.\n\nPrioritize fixes by impact and frequency.',
                        'difficulty': 'medium',
                        'quiz_question': 'How prioritize crash fixes?',
                        'quiz_options': ['Impact and frequency', 'Code age only', 'Random order'],
                        'correct_answer': 'Impact and frequency',
                    },
                    {
                        'title': 'Feature Flags on Mobile',
                        'content': 'Flags enable gradual rollout and safer experimentation.\n\nThey help decouple deployment from release.',
                        'difficulty': 'medium',
                        'quiz_question': 'Why use feature flags?',
                        'quiz_options': ['Safer rollouts', 'No testing needed', 'Fewer app stores'],
                        'correct_answer': 'Safer rollouts',
                    },
                ],
            },
        ],
    },
    {
        'title': 'UX Research and Product Discovery',
        'description': 'Run lean discovery loops, user interviews, and evidence-based product decisions.',
        'category': 'UX',
        'difficulty': 'intermediate',
        'modules': [
            {
                'title': 'Interviewing Users',
                'lessons': [
                    {
                        'title': 'Planning Discovery Interviews',
                        'content': 'Interview scripts should test assumptions without leading users.\n\nCapture evidence, not opinions alone.',
                        'difficulty': 'medium',
                        'quiz_question': 'What is a discovery interview objective?',
                        'quiz_options': ['Validate assumptions with evidence', 'Pitch final solution', 'Collect only feature requests'],
                        'correct_answer': 'Validate assumptions with evidence',
                    },
                    {
                        'title': 'Synthesizing Qualitative Insights',
                        'content': 'Cluster recurring themes and contradictions.\n\nInsight synthesis should drive actionable next bets.',
                        'difficulty': 'medium',
                        'quiz_question': 'What is a strong synthesis output?',
                        'quiz_options': ['Actionable themes', 'Raw notes only', 'Single anecdote'],
                        'correct_answer': 'Actionable themes',
                    },
                ],
            },
            {
                'title': 'Experiment Design',
                'lessons': [
                    {
                        'title': 'Hypothesis-driven Experiments',
                        'content': 'Experiments should define expected behavior change and measurement window.\n\nGood hypotheses reduce ambiguous outcomes.',
                        'difficulty': 'medium',
                        'quiz_question': 'What should every experiment include?',
                        'quiz_options': ['Clear hypothesis and metric', 'Only UI mockups', 'No baseline'],
                        'correct_answer': 'Clear hypothesis and metric',
                    },
                    {
                        'title': 'Interpreting Experiment Outcomes',
                        'content': 'Results should be read in context of sample size and bias.\n\nDecision logs preserve organizational learning.',
                        'difficulty': 'hard',
                        'quiz_question': 'Why keep experiment decision logs?',
                        'quiz_options': ['Preserve learning context', 'Replace analytics', 'Avoid follow-up tests'],
                        'correct_answer': 'Preserve learning context',
                    },
                ],
            },
        ],
    },
]


def _ensure_seed_metadata_table(db: Session) -> None:
    db.execute(
        text(
            '''
            CREATE TABLE IF NOT EXISTS seed_metadata (
                key VARCHAR(120) PRIMARY KEY,
                value VARCHAR(200) NOT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            '''
        )
    )


def _set_seed_version(db: Session, version: str) -> None:
    db.execute(
        text(
            '''
            INSERT INTO seed_metadata (key, value)
            VALUES ('catalog_version', :version)
            ON CONFLICT (key)
            DO UPDATE SET
                value = EXCLUDED.value,
                updated_at = CURRENT_TIMESTAMP
            '''
        ),
        {'version': version},
    )


def _ensure_demo_user(
    db: Session,
    *,
    email: str,
    role: str,
    level: str,
    learning_style: str,
    password: str = '123456',
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is not None:
        if user.role != role:
            user.role = role
        if user.level != level:
            user.level = level
        if user.learning_style != learning_style:
            user.learning_style = learning_style
        # Keep demo credentials deterministic for portfolio walkthroughs.
        user.hashed_password = get_password_hash(password)
        return user

    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        role=role,
        level=level,
        learning_style=learning_style,
    )
    db.add(user)
    return user


def seed_if_empty(db: Session) -> None:
    _ensure_seed_metadata_table(db)

    _ensure_demo_user(
        db,
        email='student@test.com',
        role='student',
        level='BEGINNER',
        learning_style='MIXED',
        password='123456',
    )
    _ensure_demo_user(
        db,
        email='instructor@test.com',
        role='instructor',
        level='ADVANCED',
        learning_style='PRACTICAL',
        password='123456',
    )
    _ensure_demo_user(
        db,
        email='admin@test.com',
        role='admin',
        level='INTERMEDIATE',
        learning_style='VISUAL',
        password='123456',
    )

    _ensure_demo_user(
        db,
        email='demo@edunova.ai',
        role='admin',
        level='INTERMEDIATE',
        learning_style='VISUAL',
        password='123456',
    )
    _ensure_demo_user(
        db,
        email='student@edunova.ai',
        role='student',
        level='BEGINNER',
        learning_style='MIXED',
    )
    _ensure_demo_user(
        db,
        email='instructor@edunova.ai',
        role='instructor',
        level='ADVANCED',
        learning_style='PRACTICAL',
    )
    _ensure_demo_user(
        db,
        email='admin@edunova.ai',
        role='admin',
        level='INTERMEDIATE',
        learning_style='VISUAL',
    )

    existing_titles = {
        title
        for title in db.scalars(select(Course.title)).all()
    }

    for course_blueprint in COURSE_BLUEPRINTS:
        if course_blueprint['title'] in existing_titles:
            continue

        course = Course(
            title=course_blueprint['title'],
            description=course_blueprint['description'],
            category=course_blueprint['category'],
            difficulty=course_blueprint['difficulty'],
            is_premium=course_blueprint['difficulty'].lower() in {'advanced', 'hard'} or course_blueprint['category'].lower() in {'ai', 'devops'},
        )
        db.add(course)
        db.flush()

        for module_blueprint in course_blueprint['modules']:
            module = Module(title=module_blueprint['title'], course_id=course.id)
            db.add(module)
            db.flush()

            lessons: list[Lesson] = []
            for index, lesson_blueprint in enumerate(module_blueprint['lessons'], start=1):
                video_bundle = choose_curated_video(
                    lesson_title=lesson_blueprint['title'],
                    module_title=module_blueprint['title'],
                    course_category=course_blueprint['category'],
                )
                key_concepts = extract_key_concepts(
                    lesson_title=lesson_blueprint['title'],
                    module_title=module_blueprint['title'],
                    content=lesson_blueprint['content'],
                )

                quiz_question = lesson_blueprint.get('quiz_question') or build_topic_aligned_quiz_question(
                    lesson_title=lesson_blueprint['title'],
                    key_concepts=key_concepts,
                )

                lessons.append(
                    Lesson(
                        title=lesson_blueprint['title'],
                        content=lesson_blueprint['content'],
                        difficulty=lesson_blueprint['difficulty'],
                        module_id=module.id,
                        order_index=index,
                        quiz_question=quiz_question,
                        quiz_options=json.dumps(lesson_blueprint['quiz_options']),
                        correct_answer=lesson_blueprint['correct_answer'],
                        video_url=video_bundle['video_url'],
                        video_duration_seconds=video_bundle['video_duration_seconds'],
                    )
                )

            db.add_all(lessons)

    all_lessons = db.scalars(select(Lesson)).all()
    for lesson in all_lessons:
        module = lesson.module
        course = module.course if module else None
        module_title = module.title if module else 'General'
        category = course.category if course else 'General'

        if lesson.video_url is None or is_generic_video(lesson.video_url):
            video_bundle = choose_curated_video(
                lesson_title=lesson.title,
                module_title=module_title,
                course_category=category,
            )
            lesson.video_url = video_bundle['video_url']
            lesson.video_duration_seconds = video_bundle['video_duration_seconds']

        key_concepts = extract_key_concepts(
            lesson_title=lesson.title,
            module_title=module_title,
            content=lesson.content,
        )
        if lesson.quiz_question is None or len(lesson.quiz_question.strip()) < 12:
            lesson.quiz_question = build_topic_aligned_quiz_question(
                lesson_title=lesson.title,
                key_concepts=key_concepts,
            )

        if not lesson.quiz_options:
            lesson.quiz_options = json.dumps(
                [
                    f"It strengthens understanding of {key_concepts[0] if key_concepts else lesson.title.lower()}",
                    'It removes the need for practice',
                    'It is unrelated to lesson objectives',
                ]
            )

    all_courses = db.scalars(select(Course)).all()
    for course in all_courses:
        should_be_premium = course.difficulty.lower() in {'advanced', 'hard'} or course.category.lower() in {'ai', 'devops'}
        if should_be_premium:
            course.is_premium = True

    _set_seed_version(db=db, version=SEED_CATALOG_VERSION)
    db.commit()
