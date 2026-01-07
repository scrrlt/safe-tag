/**
 * Integration examples with popular libraries
 */

const safeTag = require("../dist/index.js").default;

console.log("=== Library Integration Examples ===");

// Type checking utility
function createTypeChecker() {
  return {
    isPlainObject(value) {
      return safeTag(value) === "[object Object]";
    },

    isArray(value) {
      return safeTag(value) === "[object Array]";
    },

    isFunction(value) {
      const tag = safeTag(value);
      return (
        tag === "[object Function]" ||
        tag === "[object AsyncFunction]" ||
        tag === "[object GeneratorFunction]"
      );
    },

    isDate(value) {
      return safeTag(value) === "[object Date]";
    },

    isRegExp(value) {
      return safeTag(value) === "[object RegExp]";
    },

    getType(value) {
      return safeTag(value).slice(8, -1).toLowerCase();
    },
  };
}

const typeChecker = createTypeChecker();

console.log("\\nType Checker Examples:");
console.log("isPlainObject({}):", typeChecker.isPlainObject({}));
console.log("isArray([]):", typeChecker.isArray([]));
console.log(
  "isFunction(() => {}):",
  typeChecker.isFunction(() => {})
);
console.log("getType(new Date()):", typeChecker.getType(new Date()));

console.log("\\nAll examples completed successfully!");
