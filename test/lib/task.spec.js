const {assert} = require('chai')
const sinon = require('sinon')
const sinonStubPromise = require('sinon-stub-promise')

sinonStubPromise(sinon)
sinon.assert.expose(assert, { prefix: "" })

const Shipit = require('shipit-cli')
const Task = require('../../lib/task')

describe('Task', function() {
  before(function() {
    sinon.stub(Promise, 'resolve', sinon.stub().returnsPromise().resolves())
  })

  after(function() {
    Promise.resolve.restore()
  })

  context('with global prefix, vendor and name', function() {
    let shipit

    beforeEach(function() {
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
            envs: ['ENV=test']
          }
        }
      })
    })

    it('includes global options', function() {
      let task = new Task(shipit)
      assert.equal(task.options.prefix, 'pre')
    })

    it('includes environment options', function() {
      let task = new Task(shipit)
      assert.equal(task.options.envs[0], 'ENV=test')
    })

    it('includes task options', function() {
      let task = new Task(shipit, {net: true})
      assert.isTrue(task.options.net)
    })

    it('gives precedence to environment options', function() {
      let shipit = new Shipit({environment: 'test'})
      shipit.initConfig({
        default: {
          docker: {
            name: 'global'
          }
        },
        test: {
          docker: {
            name: 'environment'
          }
        }
      })

      let task = new Task(shipit, {
        prefix: 'pre',
        vendor: 'ven'
      })

      assert.equal(task.options.name, 'environment')
    })

    it('gives precedence to task options', function() {
      let shipit = new Shipit({environment: 'test'})
      shipit.initConfig({
        default: {
          docker: {
            name: 'global'
          }
        },
        test: {
          docker: {
            name: 'environment'
          }
        }
      })

      let task = new Task(shipit, {
        prefix: 'pre',
        vendor: 'ven',
        name: 'task'
      })

      assert.equal(task.options.name, 'task')
    })

    it('derives required names', function() {
      let task = new Task(shipit)
      assert.equal(task.options.image, 'pre/ven_name_web')
      assert.equal(task.options.container, 'ven_name_web')
    })

    it('derives required names from options', function() {
      let task = new Task(shipit, {
        prefix: 'pfix',
        vendor: 'vdor',
        name: 'some'
      })
      assert.equal(task.options.image, 'pfix/vdor_some_web')
      assert.equal(task.options.container, 'vdor_some_web')
    })

    it('uses required names from options', function() {
      let task = new Task(shipit, {
        image: 'pfix/vdor_some_web',
        container: 'vdor_some_web'
      })
      assert.equal(task.options.image, 'pfix/vdor_some_web')
      assert.equal(task.options.container, 'vdor_some_web')
    })
  })

  context('without global options', function() {
    it('requires prefix without image and container', function() {
      let shipit = new Shipit({environment: 'test'})
      assert.throws(function() {
        new Task(shipit, {}, /Missing prefix/)
      })
    })

    it('does not require prefix with image and container', function() {
      let shipit = new Shipit({environment: 'test'})
      assert.doesNotThrow(function() {
        new Task(shipit, {
          image: 'pre/ven_name_web',
          container: 'ven_name_web'
        })
      })
    })
  })

  describe('run()', function() {
    let Container, container
    let options, shipit

    beforeEach(function() {
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

    it('initializes container with options', function() {
      let task = new Task(shipit, options)
      task.run(Container)

      sinon.assert.calledWith(Container, shipit, options)
    })

    it('builds and starts container', function() {
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
