({
  mainConfigFile: '../requirejs.conf.js',
  paths: {
    almond: 'lib/almond/almond',
    auth: 'lib/livefyre-auth/src/contrib/auth-later',
    'auth/contrib': 'lib/auth/src/contrib'
  },
  baseUrl: '..',
  name: 'growl',
  include: [
    'almond',
    'css'
  ],
  exclude: ['css/normalize', 'less/normalize'],
  buildCSS: true,
  separateCSS: true,
  stubModules: ['json'],
  out: "../dist/growl.min.js",
  pragmasOnSave: {
    excludeRequireCss: true
  },
  cjsTranslate: true,
  optimize: "none",
  preserveLicenseComments: false,
  uglify2: {
    compress: {
      unsafe: true
    },
    mangle: true
  },
  wrap: {
    startFile: 'wrap-start.frag',
    endFile: 'wrap-end.frag'
  },
  generateSourceMaps: true,
  onBuildRead: function(moduleName, path, contents) {
    switch (moduleName) {
      case "jquery":
        contents = "define([], function(require, exports, module) {" + contents + "});";
    }
    return contents;
  }
})
