module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverage: true,
    coverageProvider: "v8",
    testPathIgnorePatterns: ["/node_modules/", "/scenario/"],
};
