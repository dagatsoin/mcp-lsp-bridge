# add(tools): FS-001.2 Handle external definition detection

**Labels:** Technical Story, US-Go-To-Definition

## Context

**User Story:** US-004 Go To Definition Tool

Definitions may be in node_modules or .d.ts files. These need to be marked as external and use absolute paths.

## Impact
- add(tools): FS-001.2 Detect if path is in node_modules
- add(tools): FS-001.2 Detect if path is a .d.ts file
- add(tools): FS-001.2 Set isExternal flag appropriately

## Acceptance Tests
- FS-001.2: node_modules paths have isExternal: true
- FS-001.2: .d.ts files from dependencies have isExternal: true
- FS-001.2: Project .d.ts files have isExternal: false
- FS-001.2: External paths remain absolute in output
- FS-001.2: Project paths are relative in output
