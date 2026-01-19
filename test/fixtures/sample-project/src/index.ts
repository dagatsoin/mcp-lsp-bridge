/**
 * Main entry point for the sample project
 */

import { greet, add, createUser, User } from './utils.js';

// Use the greet function
const greeting = greet('World');
console.log(greeting);

// Use the add function
const sum = add(1, 2);
console.log(`Sum: ${sum}`);

// Use the createUser function
const user: User = createUser(1, 'John', 'john@example.com');
console.log(`User: ${user.name}`);

// Export for testing
export { greeting, sum, user };
