const {merge} = require('lodash')

function mergeTaskOptions(globalOptions, taskOptions) {
  let options = merge({}, globalOptions.docker, taskOptions)
  let {prefix, vendor, name, service = 'web'} = options

  // Prefix, vendor, name required for dynamically generating image and container name
  if (!options.image || !options.container) {
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

class Task {
  constructor(shipit, options = {}) {
    this.shipit = shipit
    this.options = mergeTaskOptions(shipit.config || {}, options)
  }

  run(Container = require('./container')) {
    let container = new Container(this.shipit, this.options)

    return Promise.resolve()
      .then(container.build)
      .then(container.up)
  }
}

module.exports = Task
