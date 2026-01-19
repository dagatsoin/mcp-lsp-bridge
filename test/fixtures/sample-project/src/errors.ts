/**
 * File with intentional type errors for testing diagnostics
 */

// Error 1: Type mismatch
const num: number = 'not a number';

// Error 2: Missing property
interface Config {
  host: string;
  port: number;
}

const config: Config = {
  host: 'localhost',
  // missing port property
};

// Error 3: Function argument type mismatch
function multiply(a: number, b: number): number {
  return a * b;
}

const result = multiply('5', 10);
