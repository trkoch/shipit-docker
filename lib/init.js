const Task = require('./task')

function init (shipit) {
  Object.assign(shipit.constructor.prototype, {
    docker: function (options) {
      return new Task(shipit, options).run()
    }
  })

  shipit.emit('docker')
}

module.exports = init
