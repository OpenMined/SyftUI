/**
 * Utility functions for session storage operations
 */

/**
 * Save a value to session storage with error handling
 */
export const saveToSessionStorage = (key: string, value: any) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
  }
};

/**
 * Retrieve a value from session storage with error handling
 */
export const getFromSessionStorage = (key: string) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return null;
  }
};
