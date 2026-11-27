// Vite 8 (Rolldown) uses consistent CommonJS interop: for an ESM importer, a
// default import from a CJS package that sets `__esModule` resolves to
// `module.exports` rather than `module.exports.default`. Handle both shapes so
// components from CJS packages keep working across bundler versions.
// See https://vite.dev/guide/migration#consistent-commonjs-interop
export function resolveCjsDefault(value) {
  if (value && typeof value === 'object' && value.__esModule) {
    return value.default;
  }
  return value;
}
