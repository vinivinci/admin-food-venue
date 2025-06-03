// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock axios to avoid ESM parsing issues during tests
jest.mock('axios');
// Stub jspdf to avoid canvas errors during tests
jest.mock('jspdf', () => ({ jsPDF: function() {} }));
