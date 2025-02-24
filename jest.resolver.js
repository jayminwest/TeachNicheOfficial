module.exports = (path, options) => {
  // Call the default resolver
  return options.defaultResolver(path, {
    ...options,
    // Ensure package.json is properly handled
    packageFilter: pkg => {
      // This is important for packages that use ESM
      if (pkg.module || pkg.exports) {
        pkg.main = pkg.module || (pkg.exports && pkg.exports['./package.json'] && pkg.exports['./package.json'].default);
      }
      return pkg;
    },
  });
};
