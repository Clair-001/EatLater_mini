module.exports = {
    // 测试环境
    testEnvironment: 'node',

    // 文件转换配置
    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    // 测试文件匹配模式
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],

    // 覆盖率收集配置
    collectCoverageFrom: [
        'models/**/*.js',
        'interfaces/**/*.js',
        'viewmodels/**/*.js',
        '!**/node_modules/**',
        '!**/*.config.js'
    ],

    // 覆盖率输出目录
    coverageDirectory: 'coverage',

    // 覆盖率报告格式
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],

    // 模块路径映射
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },

    // 设置文件
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // 测试超时时间
    testTimeout: 10000,

    // 详细输出
    verbose: true
};