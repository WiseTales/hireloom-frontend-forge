# Functional Specification: HireLoom

## 1. Overview
HireLoom is a clone of Eightfold AI's core business logic, providing deep-learning talent matching for acquisition and internal mobility.

## 2. Personas
- **Recruiters**: Manage jobs, source candidates using vector matching, and track pipeline.
- **Employees**: Explore internal roles, see skill gaps, and simulate career trajectories.
- **System Agents**: Autonomous Deno functions that execute sourcing and screening tasks.

## 3. Core Features

### 3.1 Skills Ontology & Vector DB
- Integrate 1.6M+ skills from O*NET/ESO.
- Store semantic embeddings using pgvector.
- Support cosine similarity matching for `Candidate <-> Job` and `Job <-> Job`.

### 3.2 Talent Acquisition (ATS)
- **Job Dashboard**: Create and manage job postings.
- **Auto-Filter**: Generate search filters based on skill vector density in the candidate pool.
- **Vector Sourcing**: Single-click 'Find Matches' triggering a Supabase RPC call.

### 3.3 Internal Mobility
- **Career Hub**: Personal dashboard for employees.
- **Skill Gap Analysis**: Visualization of skills owned vs. skills required for aspirational roles.
- **Pathing Simulator**: Graph-based visualization of potential role sequences.

### 3.4 Agentic AI Simulation
- **Autonomous Sourcing**: Agents pick up new job postings and run sourcing loops.
- **Natural Language Interaction**: Use `compromise.js` for lightweight NLP in agent logs.

## 4. User Flows
1. **Recruiter**: Create Job -> AI extracts skills -> Recruiter clicks Source -> Candidates ranked by vector similarity.
2. **Employee**: Login -> Sync Profile (extract symbols/skills) -> View Matches -> Role Simulation -> Career Pathing.
