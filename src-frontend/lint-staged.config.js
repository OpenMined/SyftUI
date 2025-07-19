module.exports = {
  // Run prettier on all supported files
  "**/*.{js,jsx,ts,tsx,json,css,scss,md}": ["prettier --check"],

  // Run eslint on JavaScript and TypeScript files
  "**/*.{js,jsx,ts,tsx}": ["eslint"],

  // Run TypeScript compiler check on TypeScript files
  "**/*.{ts,tsx}": () => "tsc --noEmit",
};
