# Create Product Requirements Document (PRD)

You are creating a comprehensive Product Requirements Document for a high-level product feature. Follow this systematic approach to create a thorough, well-researched PRD as a GitHub issue.

**Task:** Create a comprehensive PRD for: $ARGUMENTS

## Step 1: Perform Deep Analysis

**For complex product features, engage in extended thinking:**
Think deeply about this product requirement: '$ARGUMENTS'. Consider market positioning, competitive analysis, user research implications, technical architecture decisions, business model impacts, and long-term strategic implications. Think about scalability, security, and integration with existing systems.

## Step 2: Analyze Current Project Context

**Use file analysis tools to understand the project:**

1. Use the Read tool to check for package.json (indicates web-app), requirements.txt (api-service), go.mod (cli-tool), etc.
2. Identify the technology stack: React, FastAPI, Express, Django, Next.js, etc.
3. Use the Glob tool to review existing architecture patterns and system design
4. Determine the project's current scale and complexity level

## Step 3: Conduct Market Research

**Perform targeted research based on your identified project type:**

**If this is a Web Application:**

1. Research current user experience patterns and design trends
2. Analyze the frontend technology ecosystem for relevant solutions
3. Look up performance and accessibility benchmarks for similar features
4. Consider mobile-first design requirements and constraints

**If this is an API Service:**

1. Research API design patterns and standards (REST, GraphQL, etc.)
2. Study service architecture and integration patterns
3. Find performance and scalability benchmarks for similar services
4. Review developer experience and documentation standards

**If this is a CLI Tool:**

1. Research command-line UX patterns and conventions
2. Investigate cross-platform compatibility requirements
3. Study installation and distribution strategies
4. Analyze developer workflow integration patterns

## Step 4: Create Comprehensive GitHub Issue

**Use the GitHub tool to create a new issue with this structure:**

1. Set the title using format: `[PRD] {Feature Name}`
2. Add labels: `prd`, `planning`, and project-type label (e.g., `web-app`, `api-service`)
3. Use this template for the issue body:

```markdown
# PRD: {Feature Name}

## Executive Summary

{Brief 2-3 sentence overview of the product requirement}

## Problem Statement

{Detailed description of the problem this PRD addresses}

## User Stories

### Primary User Story

As a {user type}, I want to {capability} so that {benefit}.

### Additional User Stories

- As a {user type}, I want to {capability} so that {benefit}
- As a {user type}, I want to {capability} so that {benefit}

## Market Research

{Research findings based on project type}

## Functional Requirements

- {Requirement 1}
- {Requirement 2}
- {Requirement 3}

## Non-Functional Requirements

- **Performance:** {Performance criteria}
- **Security:** {Security requirements}
- **Scalability:** {Scalability requirements}
- **Usability:** {Usability standards}

## Success Metrics

### Primary Metrics

- {Metric 1}: {Target}
- {Metric 2}: {Target}

### Secondary Metrics

- {Metric 3}: {Target}
- {Metric 4}: {Target}

## Technical Considerations

{High-level technical architecture and integration requirements}

## Implementation Phases

### Phase 1: {Phase Name}

{Core functionality and MVP requirements}

### Phase 2: {Phase Name}

{Enhanced features and optimizations}

### Phase 3: {Phase Name}

{Advanced features and integrations}

## Risk Assessment

### Technical Risks

- {Risk 1}: {Mitigation strategy}
- {Risk 2}: {Mitigation strategy}

### Business Risks

- {Risk 1}: {Mitigation strategy}
- {Risk 2}: {Mitigation strategy}

## Dependencies

### Internal Dependencies

- {Dependency 1}
- {Dependency 2}

### External Dependencies

- {Dependency 1}
- {Dependency 2}
```

## Step 5: Validate PRD Quality

**Review your created PRD against these quality standards:**

**Strategic Alignment Check:**

1. Verify clear business value and strategic rationale is documented
2. Ensure market opportunity is quantified and validated with research
3. Confirm competitive positioning is clearly defined
4. Validate that success metrics are established and measurable

**User Focus Check:**

1. Confirm user personas and needs are clearly defined
2. Verify user stories are comprehensive and validated
3. Ensure user experience requirements are detailed
4. Check that accessibility and usability are considered

**Technical Feasibility Check:**

1. Validate architecture approach is appropriate for your project type
2. Ensure integration requirements are identified
3. Confirm performance and scalability requirements are defined
4. Verify security and compliance requirements are addressed

**Implementation Planning Check:**

1. Ensure phased approach with clear milestones is documented
2. Verify resource requirements are estimated realistically
3. Confirm dependencies and risks are identified
4. Check that timeline and budget considerations are included

## Step 6: Provide Summary

**Create a comprehensive summary of what you accomplished:**

- **GitHub Issue Created**: Issue number and full title
- **Project Type**: Type identified and template adaptation used
- **Key Research Findings**: Strategic insights from your market research
- **Next Steps**: Recommended approach for task breakdown and implementation
- **Reference**: Note that this PRD can be referenced by its GitHub issue number

This systematic approach ensures your PRD is comprehensive, well-researched, and actionable for future task breakdown and implementation.
