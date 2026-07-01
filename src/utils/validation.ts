/**
 * Centralized global validation utilities for the storefront checkouts.
 */

/**
 * Validates if the given string is a valid 10-digit Indian mobile number.
 * Starts with 6, 7, 8, or 9 and has exactly 10 digits.
 */
export const validateIndianMobile = (mobile: string): boolean => {
  return /^[6-9]\d{9}$/.test(mobile.trim());
};

/**
 * Validates if the given string is a valid 6-digit Indian PIN code.
 */
export const validatePincode = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode.trim());
};

/**
 * Validates standard email address formats.
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Validates if a required field is non-empty.
 */
export const validateRequired = (val: string): boolean => {
  return val.trim().length > 0;
};
