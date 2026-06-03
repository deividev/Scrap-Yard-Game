---
name: scrap-yard-test-coverage
description: >
  Enforces test coverage rules for Scrap Yard, including staged threshold ratcheting toward global coverage above 90%.
  Trigger: When adding features, modifying implemented behavior, creating tests, or changing coverage scripts and thresholds.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- When changing any implemented gameplay, UI, persistence, or service behavior
- When adding or updating tests
- When editing `package.json`, `angular.json`, or any coverage-related configuration
- When deciding whether coverage thresholds can be raised

## Critical Patterns

- The project standard is global coverage above 90% for statements, branches, functions, and lines.
- Until the repo reaches that target, coverage thresholds must ratchet upward only after a measured passing run of `pnpm test:coverage`.
- Never fake compliance by excluding real production files, lowering scope, or replacing behavior tests with empty smoke tests.
- Every non-trivial code change must include or update tests that exercise the changed behavior.
- If a requested threshold is above the current measured coverage, write the missing tests first and then raise `angular.json` thresholds to the highest passing floor.
- Do not lower thresholds unless the user explicitly approves a temporary exception and the reason is documented.
- Prefer service and orchestration tests before giant component mocks when seeking the fastest real coverage gain.

## Code Examples

```json
{
  "scripts": {
    "test:coverage": "ng test --watch=false --coverage"
  }
}
```

```json
{
  "projects": {
    "scrap-yard": {
      "architect": {
        "test": {
          "options": {
            "coverageThresholds": {
              "statements": 30,
              "branches": 30,
              "functions": 25,
              "lines": 30
            }
          }
        }
      }
    }
  }
}
```

## Commands

```bash
pnpm test:coverage
npx ng test --watch=false --include src/app/services/resources.service.spec.ts
npx ng test --watch=false --include src/app/services/machines.service.spec.ts
```

## Resources

- Angular coverage config: [angular.json](angular.json)
- Coverage script: [package.json](package.json)