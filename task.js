const Container = require('./lib/container')
const {merge} = require('lodash')

function mergeTaskOptions(globalOptions, taskOptions) {
  let options = merge({}, globalOptions.docker, taskOptions)
  let {prefix, vendor, name, service = 'web'} = options

  // Prefix, vendor, name required for dynamically generating image and container name
  if (!options.image || !options.container || !options.net) {
    if (!prefix) { throw new Error('Missing prefix') }
    if (!vendor) { throw new Error('Missing vendor') }
    if (!name)   { throw new Error('Missing name')   }
  }

  return merge({
    path: globalOptions.deployTo + '/current',
    image: `${prefix}/${vendor}_${name}_${service}`,
    container: `${vendor}_${name}_${service}`,
    net: prefix
  }, options)
}

module.exports = function(shipit) {
  class Task {
    constructor(options = {}) {
      options = mergeTaskOptions(shipit.config, options)
      let container = new Container(shipit, options)

      return function() {
        return Promise.resolve()
          .then(container.build)
          .then(container.up)
      }
    }
  }

  return Task
}

// Testing
Object.assign(module.exports, {
  mergeTaskOptions
})
