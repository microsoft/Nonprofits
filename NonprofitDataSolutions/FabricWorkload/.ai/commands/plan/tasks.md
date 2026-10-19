# Break Down Issue Into Implementation Tasks

You are breaking down a PRD or feature GitHub issue into specific, implementable task sub-issues. The primary goal is to create individual GitHub sub-issues for each identified task and attach them to the parent issue for proper tracking and implementation workflow.

**Task:** Break down GitHub issue $ARGUMENTS into implementation task sub-issues

## Step 1: Fetch and Analyze Source Issue

**Use the GitHub tool to gather complete information:**

1. Fetch the source issue details using the issue number from $ARGUMENTS
2. Read the full issue description and all requirements
3. Identify the issue type (PRD vs Feature) from labels and title
4. Extract all acceptance criteria and technical requirements
5. Review any comments or additional context provided

## Step 2: Perform Deep Requirements Analysis

**For complex breakdowns, engage in extended thinking:**
Think deeply about breaking down this work from issue $ARGUMENTS. Consider all technical areas, integration challenges, dependency ordering, and the most logical decomposition into implementable tasks. Consider edge cases, testing requirements, and incremental delivery opportunities. What are the natural phases of implementation?

**Apply systematic analysis framework:**

1. **Extract acceptance criteria**: List all testable requirements from the issue
2. **Identify functional requirements**: Determine core capabilities needed
3. **Map technical scope**: Identify affected system areas (Frontend, Backend, CLI, Database, Infrastructure)
4. **Note dependencies**: Document prerequisites and integration points
5. **Assess complexity**: Evaluate implementation difficulty and unknowns

## Step 3: Assess Technical Scope and Sequence

**Analyze which system areas will be affected:**

1. **Frontend**: Identify needed components, user interactions, state management, routing changes
2. **Backend**: Determine required APIs, business logic, data models, validation, authentication
3. **CLI**: Note needed commands, help text, configuration handling, user experience improvements
4. **Database**: Check for schema changes, migrations, queries, performance optimization needs
5. **Infrastructure**: Consider deployment, monitoring, configuration, scaling requirements
6. **Testing**: Plan unit tests, integration tests, end-to-end testing, performance testing
7. **Documentation**: Identify user guides, API docs, development documentation needs

**Map integration points that require attention:**

1. External service integrations and their dependencies
2. Inter-service communication patterns
3. Data flow and transformation requirements
4. Security and authentication boundaries

**Determine logical implementation sequence:**

1. **Foundation first**: Database schema, core models, basic infrastructure
2. **Backend then Frontend**: API endpoints before UI components that consume them
3. **Core before Extensions**: Essential functionality before nice-to-have features
4. **Testing alongside**: Unit tests with implementation, integration tests after core features
5. **Documentation last**: Comprehensive docs after implementation is stable

## Step 4: Determine Task Breakdown Strategy and Numbering

**Choose your breakdown approach based on complexity:**

**For Simple Issues (2-4 tasks):**

1. Core implementation task
2. Testing task
3. Documentation task

**For Moderate Issues (4-8 tasks):**

1. Research/design task
2. Backend implementation task(s)
3. Frontend implementation task(s)
4. Integration testing task
5. Documentation task

**For Complex Issues (8+ tasks):**

1. Research and architecture task
2. Backend implementation tasks
   - 2.1. Database schema and models
   - 2.2. API endpoints
   - 2.3. Business logic
3. Frontend implementation tasks
   - 3.1. Components and UI
   - 3.2. State management
   - 3.3. Integration
4. Testing tasks
   - 4.1. Unit tests
   - 4.2. Integration tests
   - 4.3. End-to-end tests
5. Documentation and deployment

**Hierarchical Numbering Rules:**

- **First level (1, 2, 3...)**: Major implementation phases or areas
- **Second level (1.1, 1.2, 1.3...)**: Specific tasks within each major area
- **Third level (1.1.1, 1.1.2...)**: Sub-components of complex tasks (use sparingly)
- **Logical sequencing**: Number tasks in the order they should be implemented
- **Dependency consideration**: Tasks with dependencies should be numbered to reflect implementation order

## Step 5: Create Task Sub-Issues with Parent Relationships

**For each identified task, use the GitHub tool to create task sub-issues with proper parent relationships:**

**Use this title pattern:** `[Task {Number}] {Area}: {Specific Implementation}`

**Example titles to guide your formatting:**

- `[Task 1] Research: User authentication requirements and architecture`
- `[Task 2.1] Backend: User schema and database migrations`
- `[Task 2.2] Backend: Authentication API endpoints`
- `[Task 2.3] Backend: JWT token management and validation`
- `[Task 3.1] Frontend: Login form component`
- `[Task 3.2] Frontend: Authentication state management`
- `[Task 4.1] Testing: Unit tests for authentication API`
- `[Task 4.2] Testing: Integration tests for login flow`
- `[Task 5] Documentation: API documentation and user guide`

**Use this template for each task issue body:**

```markdown
# Task {Number}: {Specific Implementation}

**Parent Issue:** #{parent_issue_number} (Part of parent issue)
**Task Number:** {Number} (e.g., 2.1, 3.2, 4)
**Area:** {Frontend/Backend/CLI/Database/Infrastructure/Testing/Documentation}
**Estimated Effort:** {S/M/L} ({timeframe})

## Description

{Clear description of what needs to be implemented}

## Acceptance Criteria

- [ ] {Specific deliverable 1}
- [ ] {Specific deliverable 2}
- [ ] {Specific deliverable 3}
- [ ] Tests written and passing
- [ ] Documentation updated (if needed)

## Implementation Details

### Approach

{Step-by-step implementation approach}

### Files to Modify/Create

- {File 1}: {Changes needed}
- {File 2}: {Changes needed}

### Technical Specifications

{API changes, data models, configuration updates}

## Testing Requirements

- [ ] {Test scenario 1}
- [ ] {Test scenario 2}

## Dependencies

- **Prerequisite Tasks:** Task {Number}, Task {Number}
- **Blocks Tasks:** Task {Number}, Task {Number}
- **External:** {library/service}

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Code reviewed and merged
```

**Set up GitHub relationships and labels:**

1. **Create sub-issue relationship**: Use GitHub's issue creation with parent relationship
2. **Add labels**: `task`, `{area}` (frontend/backend/etc.), `{size}` (S/M/L)
3. **Link to parent**: Ensure proper parent-child relationship is established in GitHub
4. **Reference in description**: Include "Part of #{parent_issue_number}" in the issue body

## Step 6: Organize and Link Tasks

**Manage task dependencies:**

1. Identify which tasks must be completed before others can start
2. Note external dependencies (libraries, services, approvals)
3. Plan the critical path through the work

**Establish issue relationships:**

1. **Create parent-child relationships**: Use GitHub's sub-issue functionality when creating each task
2. **Link in descriptions**: Include "Part of #{parent_issue_number}" in each task description
3. **Cross-reference tasks**: Link related tasks using "Depends on #issue" or "Blocks #issue"
4. **Update parent checklist**: Create comprehensive task checklist in parent issue description

**Set task priorities:**

1. **High**: Foundational work, blocking other tasks, high risk/uncertainty
2. **Medium**: Core functionality, standard implementation
3. **Low**: Enhancements, nice-to-have features, optimization

## Step 7: Update Parent Issue

**Use the GitHub tool to update the parent issue:**

1. Add a task breakdown summary to the issue description
2. Create a checklist of all created task issues
3. Update labels to indicate "ready for implementation"
4. Add a comment summarizing the breakdown

**Parent Issue Update:**

```markdown
## Task Breakdown

This issue has been broken down into the following implementation tasks:

### 1. Research & Architecture

- [ ] #{task1} - [Task 1] Research: Requirements and architecture analysis

### 2. Backend Implementation

- [ ] #{task2.1} - [Task 2.1] Backend: Database schema and models
- [ ] #{task2.2} - [Task 2.2] Backend: API endpoints implementation
- [ ] #{task2.3} - [Task 2.3] Backend: Business logic and validation

### 3. Frontend Implementation

- [ ] #{task3.1} - [Task 3.1] Frontend: UI components
- [ ] #{task3.2} - [Task 3.2] Frontend: State management and integration

### 4. Testing & Quality

- [ ] #{task4.1} - [Task 4.1] Testing: Unit tests
- [ ] #{task4.2} - [Task 4.2] Testing: Integration tests

### 5. Documentation & Deployment

- [ ] #{task5} - [Task 5] Documentation: API docs and user guides

**Total Tasks:** {count}
**Estimated Effort:** {total_estimate}
**Critical Path:** Task 1 → Task 2.1 → Task 2.2 → Task 3.1 → Task 4.2
**Implementation Order:** Follow task numbering sequence for optimal dependency flow
```

## Step 8: Validate Task Breakdown

**Check completeness:**

1. Verify all acceptance criteria are covered by tasks
2. Ensure no implementation areas are missing
3. Confirm dependencies are identified and sequenced
4. Verify testing tasks are included for each major component

**Check clarity:**

1. Ensure each task has clear, actionable deliverables
2. Verify implementation approach is obvious to developers
3. Confirm effort estimates are realistic
4. Check that dependencies don't create circular blocking

**Check quality:**

1. Verify tasks are appropriately sized (avoid too large or too small)
2. Ensure critical path is clearly identified
3. Confirm risk/uncertainty tasks are prioritized early

## Step 9: Request Human Review If Needed

**Stop and request human review when:**

- Task breakdown reveals significantly higher complexity than expected
- New architectural decisions are needed that weren't in the original issue
- External dependencies or approvals are required
- Security or performance implications are discovered

## Step 10: Deliver Sub-Issues and Summary

**Primary Output: Created Sub-Issues**
Ensure all identified task sub-issues have been created and properly linked to the parent issue. Each sub-issue should be immediately actionable with clear acceptance criteria and implementation details.

**Create a detailed breakdown summary:**

- **Parent Issue**: Issue number and full title
- **Sub-Issues Created**: List of all created task sub-issue numbers with hierarchical numbering
  - Task 1: [Title and link]
  - Task 2.1: [Title and link]
  - Task 2.2: [Title and link]
  - Task 3.1: [Title and link]
  - etc.
- **Task Categories**: Distribution across areas (Frontend, Backend, Testing, etc.)
- **Critical Path**: Key dependency chain showing numbered sequence (e.g., Task 1 → Task 2.1 → Task 3.1)
- **Implementation Order**: Follow numerical sequence for optimal workflow
- **Dependencies**: Any blocking factors or prerequisites identified

**Success Criteria:**

- ✅ All identified tasks are captured as individual GitHub sub-issues
- ✅ All sub-issues have proper parent-child relationships established in GitHub
- ✅ All sub-issues are properly linked to the parent issue with "Part of #{parent_issue}" references
- ✅ Parent issue has been updated with numbered task checklist
- ✅ Task dependencies are clearly documented with cross-references
- ✅ Implementation team can immediately begin work following numerical task sequence

This systematic approach ensures comprehensive task breakdown while maintaining clear traceability through GitHub's issue system, with the primary deliverable being a complete set of actionable sub-issues.
