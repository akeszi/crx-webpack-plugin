var path = require('path');
var join = path.join;
var mkdirp = require('mkdirp');
var crx3 = require('crx3');

function Plugin(options) {
  this.options = options || {};
  if (!this.options.updateUrl) {
    this.options.updateUrl = "http://localhost:8000/";
  }
  if (!this.options.updateFilename) {
    this.options.updateFilename = "updates.xml";
  }

  // remove trailing slash
  this.options.updateUrl = this.options.updateUrl.replace(/\/$/, "");

  // setup paths
  this.context = path.dirname(module.parent.filename);
  this.keyFile = path.isAbsolute(this.options.keyFile) ? this.options.keyFile : join(this.context, this.options.keyFile);
  this.outputPath = path.isAbsolute(this.options.outputPath) ? this.options.outputPath : join(this.context, this.options.outputPath);
  this.contentPath = path.isAbsolute(this.options.contentPath) ? this.options.contentPath : join(this.context, this.options.contentPath);

  // set output info
  this.crxName = this.options.name + ".crx";
  this.crxFile = join(this.outputPath, this.crxName);
  this.updateFile = join(this.outputPath, this.options.updateFilename);
  this.updateUrl = this.options.updateUrl + "/" + this.options.updateFilename;
}

// hook into webpack
Plugin.prototype.apply = function(compiler) {
  var self = this;
  self.logger = compiler.getInfrastructureLogger('crx-webpack-plugin');
  return compiler.hooks.done.tapAsync('crx-webpack-plugin', async function(params, callback) {
    await self.package.call(self);
    callback();
  });
}

// package the extension
Plugin.prototype.package = async function(resolve, reject) {
  var self = this;

  await mkdirp(self.outputPath);

  var files = [path.resolve(self.contentPath, 'manifest.json')];

  await crx3(files, {
      keyPath: self.keyFile,
      crxPath: self.crxFile,
      xmlPath: self.updateFile,
      crxURL: self.updateUrl
  });

  self.logger.info('wrote updateFile to ' + self.updateFile);
  self.logger.info('wrote crxFile to ' + self.crxFile);
}

module.exports = Plugin;

///// TESTING AREA
/*
module.parent = {};
module.parent.filename = 'D:\\Dev\\realmonitor\\crawler-extension-v2\\webpack\\webpack.config.js';
var p = new Plugin({
  keyFile: 'crx_key.pem',
  contentPath: '../dist',
  outputPath: '../crx',
  name: 'realmonitor-data-collector-1.1.0',
  updateUrl: 'https://storage.googleapis.com/realmonitor-data-collector-extension',
});
p.logger = {
  info: console.log,
  error: console.error
};
(async function() {
  await p.package();
  console.log("done");
})();
*/