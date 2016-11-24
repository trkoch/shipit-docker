/* eslint-env mocha */

const assert = require('assert')
const sinon = require('sinon')
const sinonStubPromise = require('sinon-stub-promise')

sinonStubPromise(sinon)
sinon.assert.expose(assert, { prefix: '' })

const Shipit = require('shipit-cli')
const Task = require('../../lib/task')

describe('Task', function () {
  before(function () {
    sinon.stub(Promise, 'resolve', sinon.stub().returnsPromise().resolves())
  })

  after(function () {
    Promise.resolve.restore()
  })

  context('with global prefix, vendor and name', function () {
    let shipit

    beforeEach(function () {
      shipit = new Shipit({environment: 'test'})
      shipit.initConfig({
        default: {
          docker: {
            prefix: 'pre',
            vendor: 'ven',
            name: 'name'
          }
        },
        test: {
          docker: {
            detach: false,
            containers: [
              {
                service: 'web',
                envs: ['WEB=TRUE']
              }
            ]
          }
        }
      })
    })

    it('includes global options', function () {
      let task = new Task(shipit)
      assert.equal(task.options.prefix, 'pre')
    })

    it('includes environment options', function () {
      let task = new Task(shipit)
      assert.equal(task.options.detach, false)
    })

    it('includes container options', function () {
      let task = new Task(shipit, {service: 'web'})
      assert.equal(task.options.envs[0], ['WEB=TRUE'])
    })

    it('includes task options', function () {
      let task = new Task(shipit, {net: true})
      assert.ok(task.options.net)
    })

    it('merges container default and environment options', function () {
      let shipit = new Shipit({environment: 'test'})
      shipit.initConfig({
        default: {
          docker: {
            prefix: 'pre',
            vendor: 'ven',
            name: 'name',
            default: [
              {
                service: 'assets',
                net: false
              }
            ]
          }
        },
        test: {
          docker: {
            containers: [
              {
                service: 'assets',
                envs: ['API=http://api.example.com']
              }
            ]
          }
        }
      })

      let task = new Task(shipit, {service: 'assets'})
      assert.equal(task.options.net, false)
      assert.equal(task.options.envs[0], 'API=http://api.example.com')
    })

    it('derives required names', function () {
      let task = new Task(shipit)
      assert.equal(task.options.image, 'pre/ven_name')
      assert.equal(task.options.container, 'ven_name_web')
    })

    it('derives required names from options', function () {
      let task = new Task(shipit, {
        prefix: 'pfix',
        vendor: 'vdor',
        name: 'some'
      })
      assert.equal(task.options.image, 'pfix/vdor_some')
      assert.equal(task.options.container, 'vdor_some_web')
    })

    it('uses required names from options', function () {
      let task = new Task(shipit, {
        image: 'pfix/vdor_some_web',
        container: 'vdor_some_web'
      })
      assert.equal(task.options.image, 'pfix/vdor_some_web')
      assert.equal(task.options.container, 'vdor_some_web')
    })
  })

  context('without global options', function () {
    it('requires prefix without image and container', function () {
      let shipit = new Shipit({environment: 'test'})
      assert.throws(function () {
        new Task(shipit, {}, /Missing prefix/) // eslint-disable-line no-new
      })
    })

    it('does not require prefix with image and container', function () {
      let shipit = new Shipit({environment: 'test'})
      assert.doesNotThrow(function () {
        new Task(shipit, {  // eslint-disable-line no-new
          image: 'pre/ven_name_web',
          container: 'ven_name_web'
        })
      })
    })
  })

  describe('merging options', function () {
    let config

    beforeEach(function () {
      config = {
        default: {
          docker: {
            name: 'global',
            containers: [
              {
                service: 'web',
                name: 'container'
              }
            ]
          }
        },
        test: {
          docker: {
            name: 'environment'
          }
        }
      }
    })

    it('gives precedence to environment options', function () {
      let shipit = new Shipit({environment: 'test'})
      delete config.default.docker.containers // Container options take precedence
      shipit.initConfig(config)

      let task = new Task(shipit, {
        prefix: 'pre',
        vendor: 'ven'
      })

      assert.equal(task.options.name, 'environment')
    })

    it('gives precedence to container options', function () {
      let shipit = new Shipit({environment: 'test'})
      shipit.initConfig(config)

      let task = new Task(shipit, {
        prefix: 'pre',
        vendor: 'ven',
        service: 'web'
      })

      assert.equal(task.options.name, 'container')
    })

    it('gives precedence to task options', function () {
      let shipit = new Shipit({environment: 'test'})
      shipit.initConfig(config)

      let task = new Task(shipit, {
        prefix: 'pre',
        vendor: 'ven',
        name: 'task'
      })

      assert.equal(task.options.name, 'task')
    })

    it('includes options of given service', function () {
      let shipit = new Shipit({environment: 'test'})
      shipit.initConfig({
        test: {
          docker: {
            prefix: 'pre',
            vendor: 'ven',
            name: 'name',
            containers: [
              {
                service: 'web'
              },
              {
                service: 'assets',
                image: 'pre/ven_name_assets',
                file: 'Dockerfile.assets'
              }
            ]
          }
        }
      })

      let taskWeb = new Task(shipit, { service: 'web' })
      let taskAssets = new Task(shipit, { service: 'assets' })

      assert.equal(taskWeb.options.prefix, 'pre')
      assert.equal(taskWeb.options.name, 'name')
      assert.equal(taskAssets.options.prefix, 'pre')
      assert.equal(taskAssets.options.name, 'name')
      assert.equal(taskAssets.options.image, 'pre/ven_name_assets')
      assert.equal(taskAssets.options.file, 'Dockerfile.assets')
    })
  })

  describe('run()', function () {
    let Container, container
    let options, shipit

    beforeEach(function () {
      Container = sinon.spy(() => container)

      container = {
        build: sinon.stub().returnsPromise(),
        up: sinon.stub().returnsPromise()
      }

      options = {
        image: 'image',
        container: 'container',
        net: true,
        path: 'path/to/project/'
      }

      shipit = {}
    })

    it('initializes container with options', function () {
      let task = new Task(shipit, options)
      task.run(Container)

      sinon.assert.calledWith(Container, shipit, options)
    })

    it('builds and starts container', function () {
      let task = new Task(shipit, options)
      task.run(Container)
      container.build.resolves()
      container.up.resolves()

      container.build.displayName = 'build'
      container.up.displayName = 'up'
      assert.callOrder(container.build, container.up)
    })
  })
})
