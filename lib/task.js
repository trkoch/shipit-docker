const {merge} = require('lodash')

function mergeTaskOptions (globalOptions, taskOptions) {
  let options = {}
  let {service = 'web'} = merge({}, globalOptions, taskOptions)

  // Merge global (and environment) options
  options = merge(options, globalOptions.docker)

  const findContainerOptions = function (section, service) {
    return section.find((obj) => obj.service === service)
  }

  // Merge container default options
  if (globalOptions.docker && globalOptions.docker.default) {
    let containerSection = globalOptions.docker.default
    options = merge(options, findContainerOptions(containerSection, service))
  }

  // Merge container environment options
  if (globalOptions.docker && globalOptions.docker.containers) {
    let containerSection = globalOptions.docker.containers
    options = merge(options, findContainerOptions(containerSection, service))
  }

  // Merge task options
  options = merge(options, taskOptions)

  // Prefix, vendor, name required for dynamically generating image and container name
  let {prefix, vendor, name} = options
  if (!options.image || !options.container) {
    if (!prefix) { throw new Error('Missing prefix') }
    if (!vendor) { throw new Error('Missing vendor') }
    if (!name) { throw new Error('Missing name') }
  }

  let defaults = {
    path: globalOptions.deployTo + '/current',
    workspace: globalOptions.workspace,
    image: `${prefix}/${vendor}_${name}`,
    container: `${vendor}_${name}_${service}`,
    net: prefix
  }

  return merge(defaults, options)
}

class Task {
  constructor (shipit, options = {}) {
    this.shipit = shipit
    this.options = mergeTaskOptions(shipit.config || {}, options)
    return this
  }

  run (Container = require('./container')) {
    let container = new Container(this.shipit, this.options)

    return Promise.resolve()
      .then(container.build)
      .then(container.up)
  }
}

module.exports = Task
