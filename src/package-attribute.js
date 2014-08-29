var packageAttributeBuilder = require('livefyre-package-attribute');
var packageJson = require('json!growl/../package.json');

module.exports = packageAttributeBuilder(packageJson);