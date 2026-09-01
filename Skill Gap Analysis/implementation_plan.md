# Skill Gap Analyzer — Full-Stack Integration

Integrate the existing `skill_service.py` (LangGraph pipeline: resume → skill extraction → vector search → gap analysis → validated gaps → resource fetching → roadmap generation) into the ASQapplication as a new **"Skill Analyzer"** feature — distinct from the existing company-specific Roadmap Generator.

## User Review Required

> [!IMPORTANT]
> **Separate from Company Roadmaps**: Skill Analyzer roadmaps are resume-based and user-scoped. They will be stored in a new `skill_roadmaps` collection (not `roadmaps`), tracked separately via `user_skill_roadmaps` (not `user_roadmaps`). The existing Roadmap Generator and Profile "My Roadmaps" section remain untouched.

> [!WARNING]
> **File Upload**: The endpoint accepts PDF resumes. The current `skill_service.py` uses `PyPDFLoader` which writes a temp file. We'll use FastAPI's `UploadFile` to receive the file, write it to a temp path, then pass it to the pipeline. The `python-multipart` package is required (already implicitly installed with FastAPI, but we'll add it to `requirements.txt` to be safe).

> [!IMPORTANT]
> **Pipeline Execution Time**: The LangGraph pipeline makes ~10+ sequential LLM calls (analyze → expand → vector search → gap analysis → validation → resource fetching per skill → roadmap per skill → metadata). This can take **60-120+ seconds**. The endpoint will use `asyncio.to_thread()` to avoid blocking the event loop, and the frontend will show a multi-step progress indicator.

---

## Proposed Changes

### Backend — Data Models

#### [NEW] [skill_gap.py](file:///e:/Agentic%20AI/Final_Year_Project/Backend/app/models/skill_gap.py)

New Pydantic models for the Skill Gap feature, keeping them fully isolated from the existing `roadmap.py` / `user_roadmap.py` models:

- **`SkillGapRoadmapCreate`** — stores the pipeline's full output:
  - `user_id`, `profile_summary`, `seniority_level`, `target_roles: List[str]`
  - `explicit_skills: List[dict]` (name, context, level)
  - `implied_skills: List[dict]` (name, inferred_from, reasoning)
  - `job_matches: List[dict]` (title, required_skills, score, url)
  - `validated_gaps: List[dict]` (skill, importance, frequency, validation_reason)
  - `roadmap: dict` (seniority_level, total_timeline, learning_sequence, action_plan, market_outlook)
  - `metadata: dict` (created_at, file_name)

- **`UserSkillRoadmap`** — progress tracking (mirrors `UserRoadmap` pattern):
  - `user_id`, `skill_roadmap_id`, `status` (in-progress | completed | paused)
  - `overall_progress: int` (0-100)
  - `skill_progress: List[dict]` — per-skill completion (skill name, is_completed, completed_at, notes)
  - `start_date`, `last_accessed`

- **`SkillGapRoadmapResponse`**, **`UserSkillRoadmapResponse`** — API response shapes

---

### Backend — Service Layer

#### [MODIFY] [skill_service.py](file:///e:/Agentic%20AI/Final_Year_Project/Backend/app/services/skill_service.py)

Refactor the standalone script into an importable service function:

1. **Remove** the direct execution code at the bottom (lines 861-997: `app = workflow.compile()`, `final_state = app.invoke(...)`, `print_roadmap(...)`, `print_agent_state(...)`).
2. **Extract** the LangGraph workflow compilation into a module-level `compiled_app` variable.
3. **Add** a clean function `run_skill_pipeline(file_path: str) -> dict` that:
   - Invokes `compiled_app` with `{"file_path": file_path}`
   - Returns the full `AgentState` dict (or raises an error if the pipeline fails)
   - Serializes Pydantic models (ResumeProfile, ExpandedSkillSet) to dicts for storage
4. **Keep** all node functions, models, and prompts unchanged — they're well-structured already.

---

### Backend — Routes

#### [NEW] [skill_routes.py](file:///e:/Agentic%20AI/Final_Year_Project/Backend/app/api/routes/skill_routes.py)

New API router (`prefix="/api/skills"`) with endpoints:

| Method   | Path                 | Description                                                         |
| -------- | -------------------- | ------------------------------------------------------------------- |
| `POST`   | `/analyze`           | Upload PDF resume → runs pipeline → returns full analysis + roadmap |
| `POST`   | `/save`              | Save a generated skill roadmap to user's profile                    |
| `GET`    | `/user/{user_id}`    | List all saved skill roadmaps for a user                            |
| `GET`    | `/{roadmap_id}`      | Get a specific skill roadmap by ID                                  |
| `PUT`    | `/progress`          | Update per-skill progress (mark skill as completed, add notes)      |
| `DELETE` | `/user/{roadmap_id}` | Delete a saved skill roadmap                                        |

**`POST /analyze`** details:
- Accepts `multipart/form-data` with `file: UploadFile`
- Writes uploaded PDF to a temp file
- Calls `run_skill_pipeline(temp_path)` via `asyncio.to_thread()`
- Returns the full pipeline output as JSON (profile, gaps, roadmap)
- Cleans up temp file after processing

**`POST /save`** details:
- Accepts `{ "analysis_data": {...}, "userId": "..." }`
- Stores in `skill_roadmaps` collection + creates `user_skill_roadmaps` entry
- Pattern mirrors existing [roadmaps.py save endpoint](file:///e:/Agentic%20AI/Final_Year_Project/Backend/app/api/routes/roadmaps.py#L21-L107)

---

### Backend — Database

#### [MODIFY] [mongodb.py](file:///e:/Agentic%20AI/Final_Year_Project/Backend/app/db/mongodb.py)

Add indexes for the two new collections in `create_indexes()`:

```python
# Skill Roadmap indexes
skill_roadmaps = db.get_collection("skill_roadmaps")
await skill_roadmaps.create_indexes([
    IndexModel([("userId", ASCENDING)]),
    IndexModel([("metadata.createdAt", ASCENDING)])
])

# User Skill Roadmap indexes
user_skill_roadmaps = db.get_collection("user_skill_roadmaps")
await user_skill_roadmaps.create_indexes([
    IndexModel([("userId", ASCENDING), ("skillRoadmapId", ASCENDING)], unique=True),
    IndexModel([("userId", ASCENDING), ("status", ASCENDING)]),
    IndexModel([("lastAccessed", ASCENDING)])
])
```

#### [MODIFY] [main.py](file:///e:/Agentic%20AI/Final_Year_Project/Backend/app/main.py)

Register new router: `app.include_router(skill_routes.router)`

#### [MODIFY] [requirements.txt](file:///e:/Agentic%20AI/Final_Year_Project/Backend/requirements.txt)

Add `python-multipart` (for file uploads) and `motor` (if not already installed — it's used by the async MongoDB layer).

---

### Frontend — Types

#### [MODIFY] [api.ts](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/types/api.ts)

Add new TypeScript interfaces:

```typescript
// Skill Gap Analysis types
export interface SkillContext {
  name: string;
  context: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ImpliedSkill {
  name: string;
  inferred_from: string;
  reasoning: string;
}

export interface ValidatedGap {
  skill: string;
  importance: 'Critical' | 'Competitive Edge';
  frequency: number;
  validation_reason?: string;
}

export interface LearningResource {
  title: string;
  url: string;
  resource_type: string;
  is_free: boolean;
}

export interface WeeklyTask {
  week_label: string;
  topic: string;
  tasks: string[];
  milestone: string;
}

export interface SkillLearningStep {
  skill: string;
  importance: string;
  why_it_matters: string;
  leverage_from_background: string;
  time_estimate: string;
  resources: LearningResource[];
  weekly_breakdown: WeeklyTask[];
  capstone_project: string;
  resume_bullet: string;
}

export interface SkillGapAnalysis {
  profile: {
    summary: string;
    skills: SkillContext[];
    target_roles: string[];
    seniority_level: string;
  };
  expanded_skills: {
    all_skills: string[];
    implied_skills: ImpliedSkill[];
  };
  matches: { title: string; required_skills: string[]; score: number; url: string }[];
  validated_gaps: ValidatedGap[];
  roadmap: {
    seniority_level: string;
    total_timeline: string;
    learning_sequence: string[];
    action_plan: SkillLearningStep[];
    market_outlook: string;
  };
}

export interface UserSkillRoadmap {
  _id: string;
  userId: string;
  skillRoadmapId: string;
  status: 'in-progress' | 'completed' | 'paused';
  overallProgress: number;
  skillProgress: { skill: string; isCompleted: boolean; completedAt?: string; notes?: string }[];
  startDate: string;
  lastAccessed: string;
  analysis?: SkillGapAnalysis;
}
```

---

### Frontend — Service Layer

#### [NEW] [skillAnalyzerService.ts](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/services/skillAnalyzerService.ts)

Service class (singleton pattern, mirroring `roadmapService.ts`):

| Method                         | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `analyzeResume(file: File)`    | `POST /api/skills/analyze` (multipart upload, 180s timeout) |
| `saveAnalysis(data, userId)`   | `POST /api/skills/save`                                     |
| `getUserSkillRoadmaps(userId)` | `GET /api/skills/user/{userId}`                             |
| `getSkillRoadmapById(id)`      | `GET /api/skills/{id}`                                      |
| `updateSkillProgress(...)`     | `PUT /api/skills/progress`                                  |
| `deleteSkillRoadmap(id)`       | `DELETE /api/skills/user/{id}`                              |

---

### Frontend — State Management

#### [NEW] [skillAnalyzerAtoms.ts](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/store/skillAnalyzerAtoms.ts)

Jotai atoms (pattern matches `profileAtoms.ts`):

- `skillAnalysisAtom` — stores the current analysis result (`SkillGapAnalysis | null`)
- `skillAnalysisLoadingAtom` — boolean
- `skillAnalysisErrorAtom` — string | null
- `skillAnalysisStepAtom` — string (current pipeline step label for progress UI)
- `userSkillRoadmapsAtom` — `UserSkillRoadmap[]`
- `selectedSkillRoadmapAtom` — `UserSkillRoadmap | null`

#### [NEW] [useSkillAnalyzer.ts](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/hooks/useSkillAnalyzer.ts)

Custom hook (pattern matches `useProfile.ts`):

- `analyzeResume(file: File)` — uploads, sets loading/step states, returns analysis
- `saveToProfile(analysis, userId)` — saves and refreshes list
- `fetchUserSkillRoadmaps(userId)` — loads saved roadmaps
- `updateSkillProgress(roadmapId, skill, isCompleted, notes?)` — updates progress
- `deleteSkillRoadmap(id)` — deletes
- All loading/error states managed via atoms

---

### Frontend — Screen & Components

#### [NEW] [SkillAnalyzer.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/screens/SkillAnalyzer.tsx)

Main screen — follows the exact layout pattern of `Roadmap.tsx` and `JobChat.tsx`:

**Layout**: `Header` → Hero Section → Upload Area → Results → Footer

**Sections**:
1. **Hero** — "Skill Gap Analyzer" title with gradient text (matches Roadmap.tsx style)
2. **Upload Zone** — Drag-and-drop PDF upload area with file validation, animated border
3. **Pipeline Progress** — Multi-step progress indicator showing current pipeline stage (Parsing → Analyzing → Expanding Skills → Matching Jobs → Finding Gaps → Validating → Fetching Resources → Building Roadmap)
4. **Results Dashboard** (shown after analysis completes):
   - **Profile Summary Card** — seniority level, target roles, skill count
   - **Skills Breakdown** — explicit skills with levels + implied skills with reasoning
   - **Job Matches** — top matched jobs with scores (similar to `RoadmapJobsUsed`)
   - **Validated Gaps** — critical vs competitive edge, with frequency badges
   - **Personalized Roadmap** — accordion-style per-skill learning plan with resources, weekly breakdown, capstone
   - **"Save to Profile" button** — saves to `user_skill_roadmaps`

**Components to create**:

#### [NEW] [SkillUploadZone.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/components/skillAnalyzer/SkillUploadZone.tsx)
Drag-and-drop PDF upload with file preview, validation, and animated states.

#### [NEW] [PipelineProgress.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/components/skillAnalyzer/PipelineProgress.tsx)
Multi-step progress indicator with animated transitions between pipeline stages.

#### [NEW] [SkillsBreakdown.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/components/skillAnalyzer/SkillsBreakdown.tsx)
Two-column display: Explicit skills (with level badges) + Implied skills (with inference reasoning tooltips).

#### [NEW] [GapAnalysisCard.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/components/skillAnalyzer/GapAnalysisCard.tsx)
Card showing validated gaps categorized as Critical (red badge) vs Competitive Edge (amber badge), with frequency count.

#### [NEW] [SkillRoadmapAccordion.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/components/skillAnalyzer/SkillRoadmapAccordion.tsx)
Expandable accordion for each skill's learning plan — resources, weekly tasks, capstone project, resume bullet.

#### [NEW] [SavedSkillRoadmapCard.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/components/skillAnalyzer/SavedSkillRoadmapCard.tsx)
Card for displaying saved skill roadmaps in the Profile page (mirrors `RoadmapCard.tsx` pattern).

#### [NEW] [SkillRoadmapDetailModal.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/components/skillAnalyzer/SkillRoadmapDetailModal.tsx)
Full-screen modal for viewing/tracking a saved skill roadmap (mirrors `RoadmapDetailModal.tsx`).

---

### Frontend — Navigation & Routing

#### [MODIFY] [AppRoute.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/Routes/AppRoute.tsx)

Add: `<Route path="/skills" element={<SkillAnalyzer />} />`

#### [MODIFY] [Header.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/components/Header.tsx)

Add "Skills" nav link between "Roadmap" and "Chat" with the same active-state styling pattern.

#### [MODIFY] [Profile.tsx](file:///e:/Agentic%20AI/Final_Year_Project/Frontend/src/screens/Profile.tsx)

Add a new section below "My Roadmaps" called **"My Skill Analyses"** displaying saved skill roadmaps using `SavedSkillRoadmapCard`. Uses the same grid layout and empty-state pattern.

---

## File Summary

### Backend (6 files)

| Action | File                             | Description                               |
| ------ | -------------------------------- | ----------------------------------------- |
| NEW    | `app/models/skill_gap.py`        | Pydantic models for skill gap data        |
| NEW    | `app/api/routes/skill_routes.py` | API routes for skill analysis             |
| MODIFY | `app/services/skill_service.py`  | Refactor from script → importable service |
| MODIFY | `app/db/mongodb.py`              | Add indexes for new collections           |
| MODIFY | `app/main.py`                    | Register new router                       |
| MODIFY | `requirements.txt`               | Add `python-multipart`, `motor`           |

### Frontend (14 files)

| Action | File                                                       | Description                          |
| ------ | ---------------------------------------------------------- | ------------------------------------ |
| NEW    | `src/screens/SkillAnalyzer.tsx`                            | Main skill analyzer screen           |
| NEW    | `src/services/skillAnalyzerService.ts`                     | API service for skill endpoints      |
| NEW    | `src/store/skillAnalyzerAtoms.ts`                          | Jotai state atoms                    |
| NEW    | `src/hooks/useSkillAnalyzer.ts`                            | Custom hook for skill analyzer logic |
| NEW    | `src/components/skillAnalyzer/SkillUploadZone.tsx`         | File upload component                |
| NEW    | `src/components/skillAnalyzer/PipelineProgress.tsx`        | Progress indicator                   |
| NEW    | `src/components/skillAnalyzer/SkillsBreakdown.tsx`         | Skills visualization                 |
| NEW    | `src/components/skillAnalyzer/GapAnalysisCard.tsx`         | Gap analysis display                 |
| NEW    | `src/components/skillAnalyzer/SkillRoadmapAccordion.tsx`   | Roadmap per-skill accordion          |
| NEW    | `src/components/skillAnalyzer/SavedSkillRoadmapCard.tsx`   | Saved roadmap card                   |
| NEW    | `src/components/skillAnalyzer/SkillRoadmapDetailModal.tsx` | Detail/tracking modal                |
| MODIFY | `src/types/api.ts`                                         | Add skill gap TypeScript interfaces  |
| MODIFY | `src/Routes/AppRoute.tsx`                                  | Add `/skills` route                  |
| MODIFY | `src/components/Header.tsx`                                | Add "Skills" nav link                |

---

## Open Questions

> [!IMPORTANT]
> **Profile Integration**: Should the "My Skill Analyses" section appear directly on the Profile page (alongside "My Roadmaps"), or should it be a separate tab within Profile? Currently planning for a separate section on the same page.

> [!NOTE]
> **Authentication**: The existing endpoints don't use auth middleware — they receive `userId` as a body parameter (from Clerk on the frontend). Should we follow the same pattern, or is this a good time to add proper auth middleware? Currently planning to follow the existing pattern for consistency.

---

## Verification Plan

### Automated Tests
- **Backend**: Test the refactored `run_skill_pipeline()` with a sample PDF to verify it returns the expected AgentState structure
- **API**: Hit `POST /api/skills/analyze` via curl/Postman with a test resume PDF and verify JSON response structure
- **Save/Load**: Test the full save → fetch → update progress → delete cycle via API

### Manual Verification
- **Frontend**: Navigate to `/skills`, upload a resume PDF, wait for pipeline completion, and verify all result sections render correctly
- **Save flow**: Click "Save to Profile", navigate to Profile, verify the skill roadmap appears in the new section
- **Progress tracking**: Open a saved skill roadmap, mark skills as completed, verify progress updates
- **Theme consistency**: Verify dark/light mode works correctly across all new components
- **Responsive design**: Test on mobile, tablet, and desktop viewports
