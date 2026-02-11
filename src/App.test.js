// Basic smoke test for NutriNote+
// Note: Full integration tests require additional setup


const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

test("validation utilities work correctly", () => {
  // Test sanitizeString
  const { sanitizeString, sanitizeNumber } = require("./utils/validation");

  expect(sanitizeString("  hello world  ")).toBe("hello world");
  expect(sanitizeString('<script>alert("xss")</script>')).toBe("alert(xss)");
  expect(sanitizeString("normal text")).toBe("normal text");

  // Test sanitizeNumber
  expect(sanitizeNumber("10", { min: 0, max: 100 })).toBe(10);
  expect(sanitizeNumber("abc")).toBe(0);
  expect(sanitizeNumber("150", { min: 0, max: 100 })).toBe(100);
  expect(sanitizeNumber("-10", { min: 0, max: 100 })).toBe(0);
});

test("devLog utility exists", () => {
  const devLog = require("./utils/devLog").default;
  expect(devLog).toBeDefined();
  expect(typeof devLog.log).toBe("function");
  expect(typeof devLog.warn).toBe("function");
  expect(typeof devLog.error).toBe("function");
});
