const defineTest = require('./utils').defineTest
defineTest(__dirname, 'rename-property', ['--old=b', '--new=c'])