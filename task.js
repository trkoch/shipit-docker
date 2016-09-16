const Container = require('./lib/container')
const {merge} = require('lodash')

module.exports = function(shipit) {
  class Task {
    constructor(options = {}) {
      options = this._parseOptions(shipit, options)

      let container = new Container(shipit, options)

      return function() {
        return Promise.resolve()
          .then(container.build)
          .then(container.up)
      }
    }

    _parseOptions(shipit, options) {
      let defaults = merge({ service: 'web' }, shipit.config.docker, options)

      let {prefix, vendor, name, service} = defaults

      if (!prefix) { throw new Error('Missing prefix') }
      if (!vendor) { throw new Error('Missing vendor') }
      if (!name)   { throw new Error('Missing name')   }

      return merge({
        path: shipit.config.deployTo + '/current',
        image: `${prefix}/${vendor}_${name}_${service}`,
        container: `${vendor}_${name}_${service}`,
        net: prefix
      }, options)
    }
  }

  return Task
}
