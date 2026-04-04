# Resume-to-Career Roadmap Implementation Plan

This document outlines the systematic integration of the "Resume-to-Career Roadmap" features into the existing 3-agent ecosystem (Scraper, Adaptive RAG, Roadmap Generator). The existing backend employs FastAPI, LangChain, Groq, MongoDB vector search, and standard MongoDB collections.

> [!NOTE] 
> This feature will be built as a **completely new screen** on the frontend, independent of the existing Roadmap Generation screen. Correspondingly, new backend routes and services will be created to power it without interfering with the current [generate_roadmap](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/services/roadmap_service.py#347-373) functionality.

## 1. Core Implementation: Resume-to-Career Roadmap

### 1.1 Skill Extraction & Analysis
**Goal**: Parse user resumes (PDF/Docx), extract skills with context, and map them to job roles via Semantic Search.

- **Resume Parsing Endpoint**: Create a new API route (e.g., `POST /api/resume/upload`) that accepts `.pdf` and `.docx` files.
- **Text Extraction**: Use `PyMuPDF` or `pdfplumber` for PDFs and `python-docx` for Word documents to extract raw text safely.
- **LLM Contextual Extraction**: 
  - Create a new LangChain prompt specifically for extracting skills accurately with context. 
  - Use structured output (e.g., Pydantic `ResumeProfile` model containing `List[SkillContext]`, where `SkillContext` has `name` and [context](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/services/roadmap_service.py#113-117) like "Python for Backend").
- **Semantic Mapping**: Validate the structured output and embed the user's profile summary using the existing `OllamaEmbeddings` setup (`qwen3-embedding:0.6b`). Perform a vector search using MongoDB Atlas Vector Search against the `jobs_collection` to locate highly relevant role postings.

### 1.2 Gap Identification
**Goal**: Find the "Delta" between resume skills and industry requirements.

- **Job Aggregation**: Aggregate the "Required" and "Preferred" skills from the top `N` matching job roles retrieved in the previous step.
- **Delta Calculation**: Compute the set difference between the aggregated job skills and the user's extracted skills.
- **Frequency Analysis**: Count occurrences of each missing skill across the top matched jobs.

### 1.3 Strategic Recommendations
**Goal**: Categorize the gaps and provide actionable next steps.

- **Categorization Logic**: 
  - **Critical Gaps**: Skills that appear in >50% of the matched top roles but are missing in the user's profile.
  - **Competitive Advantages**: Skills that appear in ~20-50% of the roles, acting as differentiators (e.g., specific cloud certifications).
- **LLM Synthesis**: Feed these categorized gaps into the LLM to generate a personalized "Next Steps" action plan tailored to the user's inferred seniority level (e.g., Junior vs Mid-level).

---

## 2. Roadmap & Progress Tracking Enhancement

### 2.1 Detailed Learning Path (Why -> How -> Proof)
**Goal**: Create a new standalone roadmap generation service dedicated purely to the Resume-to-Career flow that outputs the Tri-factor construct.

- **New Prompt & Service**: Create a new `resume_roadmap_service.py` (or similar) with a prompt that enforces the generation of:
  - **The 'Why'**: Why the targeted company/market demands the skill.
  - **The 'How'**: Structured external links (Docs, free courses, YouTube).
  - **The 'Proof'**: A small project prompt to validate learning.
  - *Note: The existing [app/services/roadmap_service.py](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/services/roadmap_service.py) and [_build_roadmap_prompt](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/services/roadmap_service.py#139-313) will remain untouched to preserve current functionality.*
- **Data Model Setup**: Create new Pydantic models (e.g., `ResumeRoadmap`, `ResumeWeek`, `ResumeStudyPlanItem`) or extend the existing ones carefully to support fields like `why_context`, `how_resources`, and `proof_project` while isolating this from the existing screen's data structure. 

### 2.2 Interactive Progress Tracker
**Goal**: Allow natural language progress updates and provide gamified feedback on newly accessible job opportunities.

- **Update [UserRoadmap](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/models/user_roadmap.py#49-55) Model**: In [app/models/user_roadmap.py](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/models/user_roadmap.py), ensure we can store fine-grained status on individual skills (`skills_mastered` already exists, but needs stronger state binding for intermediate steps).
- **Agentic Update Endpoint**: Create a new LangGraph node or a standalone LLM service routing endpoint capable of parsing user messages like *"I've finished the SQL module"* and structurally tying it to a `skill_id` or `week_number` in their active roadmap.
- **Gamified Re-Evaluation Trigger**: 
  - Once the state in `user_roadmap_collection` is marked "Completed" for a skill, re-evaluate their updated professional profile.
  - Re-run the Vector Search with the newly acquired skill appended to their embeddings profile.
  - Return to the user: *"Congratulations! By mastering SQL, you now qualify for 42 newly scraped jobs at organizations like Morgan Stanley and Oracle."*

---

## 3. Implementation Steps Overview

### Phase 1: Models and Parsing (Backend)
1. Add dependencies: `PyMuPDF`, `python-docx`.
2. Update Pydantic models in [roadmap.py](file:///f:/Agentic%20AI/Final_Year_Project/Backend/roadmap.py) and [user_roadmap.py](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/models/user_roadmap.py) for Tri-factor guides.
3. Construct `resume_parser_service.py` to handle uploads and LLM extraction routes.

### Phase 2: Analysis Engine
1. Create `gap_analysis_service.py`.
2. Connect to the existing vector store initialized in [mongodb.py](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/db/mongodb.py) and [agent.py](file:///f:/Agentic%20AI/Final_Year_Project/Backend/naukri_agent.py) to match the resume against [jobs](file:///f:/Agentic%20AI/Final_Year_Project/Backend/app/services/roadmap_service.py#333-345).
3. Implement Delta calculation and categorization.

### Phase 3: Dedicated Roadmap Service
1. Create `resume_roadmap_service.py` utilizing the Groq LLM to weave the Gap Analysis results into a new Tri-factor roadmap prompt. 
2. Validate that the returned output parses cleanly into the new Why/How/Proof data models, supplying a new FastAPI endpoint (e.g., `POST /api/resume-roadmap/generate`).

### Phase 4: Interactive Tracking Pipeline
1. Add a new agent/route to translate natural language updates into DB `skills_mastered` pushes.
2. Link the completion hook to trigger a lightweight Vector Search, responding with newly unlocked job listings.

## 4. Verification Plan

### Automated Tests
- Create unit tests in a `tests/` directory simulating resume text uploads and ensuring the Pydantic schema properly structures the skills.
- Test the gap analysis by mocking job listings to ensure frequency counting reliably segregates "Critical" vs "Competitive" skills.

### Manual Verification
- **API Testing**: Upload a dummy PDF resume via Postman or Swagger UI and verify the returned "Delta" and specific "Critical Gaps".
- **Roadmap Verification**: Initiate a roadmap generation and observe that the response strictly follows the Why/How/Proof pattern.
- **Progress Walkthrough**: Hit the newly created progress update endpoint with a natural language text payload (e.g., "I finished week 1") and manually verify that a) the MongoDB record reflects completion, and b) the response yields gamified job matching feedback.
