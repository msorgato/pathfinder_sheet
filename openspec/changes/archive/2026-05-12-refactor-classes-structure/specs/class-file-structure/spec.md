## ADDED Requirements

### Requirement: One file per class
Each Pathfinder class SHALL be defined in its own dedicated TypeScript file under `src/data/classes/<class-id>.ts`. The file SHALL export a single named constant of type `ClassDefinition`.

#### Scenario: File exists for every class
- **WHEN** the codebase is built
- **THEN** a file `src/data/classes/<class-id>.ts` SHALL exist for each of the 11 base classes: barbarian, bard, cleric, druid, fighter, monk, paladin, ranger, rogue, sorcerer, wizard

#### Scenario: File exports a named constant
- **WHEN** a class file is imported
- **THEN** it SHALL export a named constant in ALL_CAPS (e.g. `BARBARIAN`) of type `ClassDefinition`

### Requirement: Barrel index aggregates all classes
The file `src/data/classes/index.ts` SHALL import all individual class constants and export a single `CLASSES` array and a `getClass` helper.

#### Scenario: CLASSES array contains all classes
- **WHEN** `CLASSES` is imported from `src/data/classes/index.ts`
- **THEN** it SHALL contain all 11 class definitions in deterministic order

#### Scenario: getClass returns class by id
- **WHEN** `getClass('wizard')` is called
- **THEN** it SHALL return the `ClassDefinition` with `id === 'wizard'`

#### Scenario: getClass returns undefined for unknown id
- **WHEN** `getClass('unknown')` is called
- **THEN** it SHALL return `undefined`

### Requirement: Public API remains unchanged
The file `src/data/classes.ts` SHALL re-export `CLASSES` and `getClass` from `src/data/classes/index.ts` so that existing consumers require no changes.

#### Scenario: Existing imports continue to work
- **WHEN** any module imports `{ CLASSES }` or `{ getClass }` from `src/data/classes`
- **THEN** it SHALL receive the same values as before the refactor

### Requirement: Legacy files removed
The files `src/data/classes_part1.ts` and `src/data/classes_part2.ts` SHALL be deleted.

#### Scenario: No references to removed files
- **WHEN** the project is built with TypeScript
- **THEN** no import in the codebase SHALL reference `classes_part1` or `classes_part2`
