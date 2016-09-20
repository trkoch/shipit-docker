const {assert} = require('chai')
const sinon = require('sinon')
const sinonStubPromise = require('sinon-stub-promise')

sinonStubPromise(sinon)
sinon.assert.expose(assert, { prefix: "" })

const Shipit = require('shipit-cli')
const Task = require('../task')

suite('Task', function() {
  suiteSetup(function() {
    sinon.stub(Promise, 'resolve', sinon.stub().returnsPromise().resolves())
  })

  suiteTeardown(function() {
    Promise.resolve.restore()
  })

  suite('with global prefix, vendor and name', function() {
    let shipit

    setup(function() {
      shipit = new Shipit({environment: 'test'})
      shipit.initConfig({
        default: {
          docker: {
            prefix: 'pre',
            vendor: 'ven',
            name: 'name'
          }
        },
        test: {}
      })
    })

    test('accepts task options', function() {
      let task = new Task(shipit, {net: true})
      assert.isOk(task.options.net)
    })

    test('merges task and global options', function() {
      let task = new Task(shipit, {envs: ['AWESOME=TRUE']})
      assert.equal(task.options.prefix, 'pre')
      assert.equal(task.options.envs[0], 'AWESOME=TRUE')
    })

    test('overrides global options', function() {
      let task = new Task(shipit, {prefix: 'pfix'})
      assert.equal(task.options.prefix, 'pfix')
    })

    test('derives required names', function() {
      let task = new Task(shipit)
      assert.equal(task.options.image, 'pre/ven_name_web')
      assert.equal(task.options.container, 'ven_name_web')
    })

    test('derives required names from options', function() {
      let task = new Task(shipit, {
        prefix: 'pfix',
        vendor: 'vdor',
        name: 'some'
      })
      assert.equal(task.options.image, 'pfix/vdor_some_web')
      assert.equal(task.options.container, 'vdor_some_web')
    })

    test('uses required names from options', function() {
      let task = new Task(shipit, {
        image: 'pfix/vdor_some_web',
        container: 'vdor_some_web'
      })
      assert.equal(task.options.image, 'pfix/vdor_some_web')
      assert.equal(task.options.container, 'vdor_some_web')
    })
  })

  suite('without global options', function() {
    test('requires prefix without image and container', function() {
      let shipit = new Shipit({environment: 'test'})
      assert.throws(function() {
        new Task(shipit, {}, /Missing prefix/)
      })
    })

    test('does not require prefix with image and container', function() {
      let shipit = new Shipit({environment: 'test'})
      assert.doesNotThrow(function() {
        new Task(shipit, {
          image: 'pre/ven_name_web',
          container: 'ven_name_web'
        })
      })
    })
  })

  suite('run()', function() {
    let Container, container
    let options, shipit

    setup(function() {
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

    test('initializes container with options', function() {
      let task = new Task(shipit, options)
      task.run(Container)

      sinon.assert.calledWith(Container, shipit, options)
    })

    test('builds and starts container', sinon.test(function() {
      let task = new Task(shipit, options)
      task.run(Container)
      container.build.resolves()
      container.up.resolves()

      container.build.displayName = 'build'
      container.up.displayName = 'up'
      assert.callOrder(container.build, container.up)
    }))
  })
})
