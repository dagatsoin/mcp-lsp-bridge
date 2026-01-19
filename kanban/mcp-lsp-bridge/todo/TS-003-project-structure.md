# add(project): BS-001.1 Set up project directory structure

**Labels:** Technical Story, US-Project-Setup

## Context

**User Story:** US-001 Project Setup & Build Configuration

A clear directory structure helps organize code and makes the project maintainable. We establish conventions for source, tests, and configuration.

## Impact
- add(project): BS-001.1 Create src/ directory for source code
- add(project): BS-001.1 Create src/tools/ for tool implementations
- add(project): BS-001.1 Create src/tsserver/ for tsserver wrapper
- add(project): BS-001.1 Create tests/ directory for test files
- add(project): BS-001.1 Create test-fixtures/ for test projects

## Acceptance Tests
- BS-001.1: src/ directory exists
- BS-001.1: src/index.ts exists as entry point
- BS-001.1: src/tools/ directory exists
- BS-001.1: src/tsserver/ directory exists
- BS-001.1: tests/ directory exists
- BS-001.1: test-fixtures/ directory exists with sample TS project
