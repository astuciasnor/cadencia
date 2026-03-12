# Cadência V2 — Foundation

## Product Vision
Cadência is a focus and execution planner for intellectual work. It is designed to reduce procrastination, task ambiguity, anxiety, and overload by turning diffuse work into executable action with visible, calm progress.

## Primary Audience
- university professors
- researchers
- people dealing with complex intellectual work
- routines involving teaching, class delivery, reading, study, research execution, research practices, experimental planning, article writing, project writing, project reports, administrative work, committee meetings, student advising, advisee follow-up, advisee text review, and advising meetings

## Core Problem
The main problem is not only lack of time. The product addresses:
- task ambiguity
- difficulty starting
- excessive perceived load
- anxiety in front of work
- lack of connection between project, task, and concrete next action

## Core Principles
- current focus is the center of the system
- clarity before density
- visible progress without visual noise
- calm control and smooth progress
- cognitive support for work
- explicit separation between structuring, selecting, focusing, executing, and tracking
- desktop/notebook first

## Conceptual Architecture
- Project
- Task
- Subtask
- Day Plan
- Rhythm
- Execution
- Timer
- Progress

## Concept Definitions

### Project
Main container of work. Represents a structured front such as a course, article, research project, advising front, report, committee agenda, or administrative activity.

### Task
Relevant work unit inside a project.

### Subtask
Concrete and more executable unit inside a task.

### Day Plan
Operational selection of what actually enters today. It is not a parallel structure to projects.

### Rhythm
Panel for the current focused work item. It shows and allows editing:
- current status
- start ease
- associated anxiety
- perceived load
- next step
- execution framing

### Execution
Operational dimension of the current focused work item:
- how it will be done
- materials
- actions
- contacts
- practical notes

Execution does not need to exist as an independent top-level tab. It belongs inside the Rhythm surface.

### Timer
Temporal engine of focus:
- focus session
- short break
- long break

### Progress
Aggregated reading of the day:
- completed sessions
- focused minutes
- completed tasks
- completed subtasks
- overall progress

## Cognitive Support
Cadência does not only measure time. It makes work more executable.

### Core Indicators
- start ease
- associated anxiety
- perceived load

## Main Flows

### Flow 1 — Structure
Projects → Tasks → Subtasks

### Flow 2 — Select the Day
Projects / standalone items → Day Plan

### Flow 3 — Enter Focus
Day Plan or Projects → define current focus → Rhythm → Timer

### Flow 4 — Execute Clearly
Rhythm → practical execution framing → Timer

### Flow 5 — Track
Timer → Progress

## Main Screens
- Timer
- Projects
- Day Plan
- Rhythm
- Progress

## Visual Direction
The interface must convey:
- clarity
- lightness
- calm support
- control
- smooth progress
- efficient use of screen space

Current layout priority:
- 10-inch tablet first
- notebook second
- no mobile optimization for now

Avoid:
- visual pollution
- excessive explanatory text
- too many simultaneous controls
- confused hierarchy
- tall blocks without clear payoff
- decorative columns without functional value

Prefer:
- compact, useful panels
- practical reading over decorative explanation
- stable hierarchy with dense but calm information

## Technical Direction
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table

## High-Level Technical Structure
- `src/domain/`
- `src/features/projects/`
- `src/features/day-plan/`
- `src/features/rhythm/`
- `src/features/timer/`
- `src/features/progress/`
- `src/components/ui/`
- `src/stores/`
- `src/adapters/`

## What Comes From Legacy
- product vision
- approved flows
- conceptual architecture
- cognitive support model
- provisional project `Sem projeto`
- current focus as system core

## What Does Not Come From Legacy
- current HTML/CSS
- current manual DOM rendering
- native prompts as primary interaction
- patched visual hierarchies
- inferred structure where real relations should exist

## Strategic Decision
Cadência V2 is a reconstruction of the interface and application shell, not a blind rewrite of the product concept. The current project is preserved as a legacy reference and idea archive.
