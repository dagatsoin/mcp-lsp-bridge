# add(config): BS-001.1 Configure tsconfig.json for ES modules

**Labels:** Technical Story, US-Project-Setup

## Context

**User Story:** US-001 Project Setup & Build Configuration

TypeScript needs proper configuration for ES modules, strict type checking, and source maps. This ensures consistent builds and good developer experience.

## Impact
- add(config): BS-001.1 Create tsconfig.json with ES module target
- add(config): BS-001.1 Enable strict mode for type safety
- add(config): BS-001.1 Configure source maps for debugging

## Acceptance Tests
- BS-001.1: tsconfig.json exists in project root
- BS-001.1: "module": "NodeNext" or "ES2022" is set
- BS-001.1: "moduleResolution": "NodeNext" or "bundler" is set
- BS-001.1: "strict": true is enabled
- BS-001.1: "sourceMap": true for debugging
- BS-001.1: "outDir" points to dist/ or build/
- BS-001.1: "rootDir" points to src/
