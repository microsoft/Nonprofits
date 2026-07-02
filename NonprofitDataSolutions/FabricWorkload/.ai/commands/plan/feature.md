# Create Technical Feature

You are creating a focused technical feature document as a GitHub issue for direct implementation. Follow this systematic approach to create a well-scoped, implementable feature.

**Task:** Create a technical feature for: $ARGUMENTS

## Step 1: Analyze Feature Scope

**Determine what type of feature this is:**

1. **New functionallity (Item)**: A new item that should be created for Fabric
2. **UI/UX Enhancement**: User interface improvements, new interactions
3. **Technical Integration**: APIs, services, third-party integrations
4. **Infrastructure**: Performance, security, deployment improvements
5. **Developer Experience**: Tooling, debugging, development workflow
6. **Developer Experience**: Tooling, debugging, development workflow

**Assess the complexity level:**

1. **Simple**: Single component or straightforward addition
2. **Moderate**: Multiple components with integration points
3. **Complex**: Cross-system changes or new architecture patterns

## Step 2: Adapt to Project Context

**Use analysis tools to understand the project:**

1. Use file analysis tools to detect project type and structure
2. Use the Read tool to check current technology stack
3. Use the Glob tool to identify existing patterns and architectural decisions
4. Determine appropriate feature focus areas for this project type

**Focus your feature based on project type:**

- **Web Apps**: User experience, responsive design, performance impact
- **APIs**: Endpoint design, data models, integration patterns
- **CLI Tools**: Command interface, user experience, cross-platform support
- **SaaS Platforms**: Multi-tenancy, scalability, service boundaries

## Step 3: Perform Extended Thinking (for Complex Features)

**If you assessed this as a complex feature, engage in deep thinking:**
Think deeply about this technical feature: '$ARGUMENTS'. Consider the system architecture, integration patterns, data flow, error handling, testing strategy, and how this fits into the overall system design. What are the key technical decisions and potential challenges?

## Step 4: Analyze Technical Requirements

**Assess system impact across all areas:**

1. **Frontend**: Identify needed components, state management changes, user interactions, routing updates
2. **Backend**: Determine required APIs, business logic changes, data processing, validation rules
3. **Database**: Check for schema changes, new queries, performance implications
4. **Infrastructure**: Consider configuration, deployment, monitoring requirements

**Analyze integration requirements:**

1. Identify external service dependencies
2. Map internal system communication needs
3. Define data flow and transformation requirements
4. Assess authentication and authorization impact

**Define non-functional requirements:**

1. Set performance expectations and constraints
2. Identify security considerations and requirements
3. Define scalability and reliability needs
4. Ensure accessibility and usability standards are met

## Step 5: Create GitHub Issue

**Use the GitHub tool to create a focused feature issue:**

1. Set the title using format: `[Feature] {Feature Name}`
2. Add labels: `feature`, `enhancement`, and area labels (e.g., `frontend`, `backend`, `api`)
3. Use this template for the issue body:

```markdown
# Feature: {Feature Name}

## Overview

{2-3 sentence description of the feature}

## User Story

As a {user type}, I want to {capability} so that {benefit}.

## Problem Statement

{Specific problem this feature solves}

## Acceptance Criteria

- [ ] Given {condition}, when {action}, then {expected result}
- [ ] Given {condition}, when {action}, then {expected result}
- [ ] Given {condition}, when {action}, then {expected result}

## Technical Requirements

### System Areas Affected

- [ ] Frontend
- [ ] Backend
- [ ] CLI
- [ ] Database
- [ ] Infrastructure

### Implementation Approach

{High-level approach to implementation}

### Key Components

- {Component 1}: {Description}
- {Component 2}: {Description}

### Data Requirements

{Any data model changes, API endpoints, or storage needs}

## Dependencies

### Internal Dependencies

- {Dependency 1}
- {Dependency 2}

### External Dependencies

- {Library/Service 1}
- {Library/Service 2}

## Success Criteria

### Definition of Done

- [ ] All acceptance criteria met
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed and merged
- [ ] Feature deployed and verified

### Success Metrics

- {Metric 1}: {Target}
- {Metric 2}: {Target}

## Risk Assessment

### Technical Risks

- {Risk 1}: {Mitigation}
- {Risk 2}: {Mitigation}

### Timeline Risks

- {Risk 1}: {Mitigation}
- {Risk 2}: {Mitigation}

## Technical Notes

{Key implementation details and considerations}
```

## Step 6: Validate Feature Quality

**Check technical completeness:**

1. Verify clear scope and requirements are defined
2. Ensure implementation approach is validated and feasible
3. Confirm dependencies and risks are identified
4. Verify testing strategy is outlined

**Verify quality standards:**

1. Ensure acceptance criteria are specific and testable
2. Confirm security considerations are addressed
3. Verify performance requirements are defined
4. Check that error handling is planned

**Confirm implementation readiness:**

1. Verify there are no blocking dependencies
2. Ensure technical approach is feasible with current technology stack
3. Confirm resource requirements are realistic
4. Verify timeline is achievable

## Step 7: Provide Feature Summary

**Create a comprehensive summary of what you accomplished:**

- **GitHub Issue Created**: Issue number and full title
- **Project Type and Focus**: Areas identified and feature scope
- **Key Technical Considerations**: Important architecture and integration decisions
- **Next Steps**: Recommended approach for task breakdown and implementation
- **Reference**: Note that this feature can be referenced by its GitHub issue number

This systematic approach ensures your feature is well-scoped, technically sound, and ready for task breakdown and implementation.
