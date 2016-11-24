const chalk = require('chalk')
const {bindAll} = require('lodash')
const {buildCmd, pullCmd, runCmd} = require('./utils/commands')
const {buildCmdLocal, tagCmdLocal, pushCmdLocal} = require('./utils/commands')

class Container {
  constructor (shipit, options) {
    this.shipit = shipit
    this.options = options
    this.runLocally = (options.local === true)
    this.pushToRegistry = !!(options.registryUrl)
    this.target = this.runLocally ? 'local' : 'remote'

    bindAll(this, ['build', 'run', 'remove', 'up'])
  }

  build () {
    let {image} = this.options

    let promise = Promise.resolve()

    if (this.runLocally || this.pushToRegistry) {
      promise = promise.then(() => {
        return this.shipit.local(buildCmdLocal(this.options))
      })

      if (this.pushToRegistry) {
        promise = promise
          .then(() => this.shipit.local(tagCmdLocal(this.options)))
          .then(() => this.shipit.local(pushCmdLocal(this.options)))
      }
    } else {
      promise = promise
        .then(() => this.shipit.remote(buildCmd(this.options)))
    }
    return promise
      .then(() => this.shipit.log(chalk.green(`Built image ${image}.`)))
  }

  run () {
    let {container, net, localPort = 80, containerPort = 80} = this.options

    let promise = Promise.resolve()
    if (this.pushToRegistry) {
      promise = this.shipit.remote(pullCmd(this.options))
    }

    return promise
      .then(() => this.shipit[this.target](runCmd(this.options))
      .then(() => {
        this.shipit.log(chalk.green(
          `Created container ${container}.`
        ))

        if (net) {
          this.shipit.log(chalk.green(
            `Published ${container}:${containerPort} ` +
            `to localhost:${localPort}.`
          ))
        }
      }))
  }

  remove () {
    let {container} = this.options

    const checkExisting = () => {
      return this.shipit[this.target](`docker inspect ${container} >/dev/null 2>&1`)
        .catch(() => {
          this.shipit.log(chalk.yellow(`Container ${container} not found.`))
          return Promise.reject()
        })
    }

    const remove = () => {
      return this.shipit[this.target](`docker rm -f ${container}`)
    }

    return Promise.resolve()
      .then(checkExisting)
      .then(remove)
      .then(() => this.shipit.log(chalk.green('Removed previous container.')))
  }

  up () {
    let {run} = this

    return Promise.resolve()
      .then(this.remove)
      .then(run, run)
  }
}

module.exports = Container
