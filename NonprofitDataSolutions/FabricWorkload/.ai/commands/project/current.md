# Show Current Project Context

You are analyzing and displaying the current project context, active work, and providing intelligent next-action suggestions. Follow this systematic approach to give comprehensive situational awareness.

**Task:** Analyze and display current project status and suggest next actions

## Step 1: Detect Project Type and Technology

**Use file analysis tools to understand the project:**

1. Use the Read tool to check for package.json (indicates web-app), requirements.txt (api-service), go.mod (cli-tool)
2. Identify the technology stack: React, Next.js, FastAPI, Express, Django, etc.
3. Use the Glob tool to determine project patterns and architecture
4. Analyze the codebase structure to understand complexity and scale

**Prepare project context summary:**

1. Document the project type and detected technologies
2. Note current architecture patterns and frameworks
3. Identify recommended workflow adaptations for this project type

## Step 2: Analyze Active Work

**Use the GitHub tool to gather comprehensive work status:**

1. List all GitHub issues with `prd` and `feature` labels
2. Check issue status for each (open, in-progress, closed)
3. Identify linked task issues for each PRD/feature
4. Calculate completion percentages based on closed vs total task issues

**Analyze PRDs and Features:**

1. Fetch all issues labeled with `prd` to see active product requirements
2. Fetch all issues labeled with `feature` to see technical features in progress
3. Determine current status and progress for each major work item

**Calculate task progress:**

1. Count total task issues vs completed (closed) task issues for each parent issue
2. Identify tasks currently labeled as "in-progress"
3. Highlight blocked or overdue tasks based on labels and comments
4. Note any tasks with missing dependencies or prerequisites

**Example analysis format:**

- Issue #4: User Authentication PRD (60% complete, 3/5 tasks done)
- Issue #7: Dark Mode Feature (planning phase, 0/3 tasks)

## Step 3: Generate Intelligent Suggestions

**Create context-aware next action recommendations:**

1. Base suggestions on current work state and project type
2. Prioritize by dependencies and strategic importance
3. Consider realistic capacity and skill requirements
4. Account for any blocking factors or prerequisites

**Generate smart, actionable suggestions:**

1. If PRDs need task breakdown: suggest `/project:plan:tasks #4`
2. If tasks are ready for implementation: suggest `/project:do:task #12`
3. If no active work exists: suggest `/project:plan:prd [idea]` or `/project:plan:feature [capability]`
4. If work is blocked: suggest specific unblocking actions

## Step 4: Analyze Workflow Status

**Assess recent activity patterns:**

1. Look at recent GitHub issue activity to identify workflow patterns
2. Identify any workflow bottlenecks or stalled work
3. Note process improvements that could be made

**Evaluate progress momentum:**

1. Count tasks completed recently to gauge velocity
2. Identify current trends in work completion
3. Project completion timelines based on current pace

## Step 5: Present Available Actions

**Include planning command options:**

- `/project:plan:prd "idea"` - Create comprehensive product requirements
- `/project:plan:feature "capability"` - Create focused technical features
- `/project:plan:tasks "#4"` - Break down work into tasks

**Include implementation command options:**

- `/project:do:task "#12"` - Execute specific tasks
- `/project:do:commit "message"` - Create semantic commits

**Include context command options:**

- `/project:current` - Refresh current context view

## Step 6: Provide Reference Guide

**Explain GitHub issue reference patterns:**

- **PRDs**: "#4", "#8", "user authentication", "issue #4"
- **Features**: "#7", "#11", "dark mode", "issue #7"
- **Tasks**: "#12", "#15", "#18" (individual task issue numbers)

**Show common workflow patterns:**

- View PRD: refer by issue number or title
- Break down: `/project:plan:tasks #4`
- Implement: `/project:do:task #12`
- Check status: `/project:current`

## Step 7: Perform Project Health Check

**Assess quality indicators:**

1. Evaluate task breakdown completeness across all PRDs/features
2. Check implementation progress consistency
3. Review testing and documentation coverage
4. Identify technical debt and risk factors

5. Suggest specific process improvements based on identified bottlenecks
6. Recommend quality assurance improvements needed
7. Identify workflow optimization opportunities

## Step 8: Format and Present Output

**Present the analysis in this structured format:**

```
📋 Project Context: [Project Type] ([Technology Stack])

📂 Active Work:
├── Issue #4: User Authentication PRD (60% complete, 3/5 tasks)
│   ├── ✅ Issue #12: Research OAuth providers (closed)
│   ├── ✅ Issue #13: Backend API design (closed)
│   ├── 🔄 Issue #14: Frontend integration (in-progress)
│   ├── ⏳ Issue #15: Testing suite (open)
│   └── ⏳ Issue #16: Documentation (open)
├── Issue #7: Dark Mode Feature (planning, 0/3 tasks)
│   └── 📋 Ready for task breakdown

🎯 Suggested Next Actions:
├── Continue: /project:do:task #14
├── Plan: /project:plan:tasks #7
└── Create: /project:plan:feature "payment processing"

📈 Progress Summary:
├── Total Issues: 8 (3 closed, 1 in-progress, 4 open)
├── Completion Rate: 37.5%
└── Estimated Remaining: ~2-3 days

📍 Quick Reference:
├── PRDs: #4 (user auth), #8 (...)
├── Features: #7 (dark mode), #11 (...)
└── Commands: /project:plan:prd, /project:plan:tasks, /project:do:task
```

This systematic analysis provides comprehensive situational awareness using GitHub Issues as the source of truth for all project tracking and intelligent workflow navigation.
