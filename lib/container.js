const chalk = require('chalk')
const {bindAll} = require('lodash')
const {buildCmd, runCmd} = require('./commands')

class Container {
  constructor(shipit, options) {
    this.shipit = shipit
    this.options = options

    bindAll(this, ['build', 'run', 'remove', 'up'])
  }

  build() {
    let {image} = this.options

    return Promise.resolve()
      .then(() => this.shipit.remote(buildCmd(this.options)))
      .then(() => this.shipit.log(chalk.green(`Built image ${image}.`)))
  }

  run() {
    let {container, net, localPort = 80, containerPort = 80} = this.options

    return Promise.resolve()
      .then(() => this.shipit.remote(runCmd(this.options))
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

  remove() {
    let {container} = this.options

    const checkExisting = () => {
      return this.shipit.remote(`docker inspect ${container} >/dev/null 2>&1`)
        .catch(() => {
          this.shipit.log(chalk.yellow(`Container ${container} not found.`))
          return Promise.reject()
        })
    }

    const remove = () => {
      return this.shipit.remote(`docker rm -f ${container}`)
    }

    return Promise.resolve()
      .then(checkExisting)
      .then(remove)
      .then(() => this.shipit.log(chalk.green('Removed previous container.')))
  }

  up() {
    let {run} = this

    return Promise.resolve()
      .then(this.remove)
      .then(run, run)
  }
}

module.exports = Container
