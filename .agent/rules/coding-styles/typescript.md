# TypeScript Coding Style

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate. Use TypeScript interfaces to create strictly typed immutable updates.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// WRONG: Mutation
function updateUser(user: User, name: string): User {
  user.name = name; // MUTATION!
  return user;
}

// CORRECT: Immutability
// Using pure functions that return new instances
function updateUser(user: User, name: string): User {
  return {
    ...user,
    name
  };
}
```

## Type Safety (TypeScript Specific)

- **Avoid `any`**: Always use `unknown` if the type is truly not known yet, or use generic variables.
- **Strict Null Checks**: Always handle `null` and `undefined`.
- **Explicit Return Types**: Explicitly define return types for improved readability and compiler checking.

```typescript
// WRONG: Using any
function parseData(data: any) {
  return JSON.parse(data);
}

// CORRECT: Using proper types and validation
function parseData<T>(data: string): T {
  return JSON.parse(data) as T;
}
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:

- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large components
- Organize by feature/domain, not by type

## Error Handling

ALWAYS handle errors comprehensively. In TypeScript, errors in catch blocks are `unknown` by default (in strict mode).

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error: unknown) {
  // Safe error handling in TypeScript
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error('Operation failed:', errorMessage);
  
  throw new Error(`Detailed user-friendly message: ${errorMessage}`);
}
```

## Input Validation

ALWAYS validate user input. Use libraries like Zod to bridge runtime validation with static types.

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
});

// Infer TypeScript type from schema to ensure single source of truth
type UserInput = z.infer<typeof UserSchema>;

function processUser(input: unknown): UserInput {
  // Throws if validation fails
  return UserSchema.parse(input);
}
```

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
- [ ] **No `any` types used**
- [ ] **Interfaces/Types defined for all data structures**
