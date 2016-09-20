const {assert} = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const Shipit = require('shipit-cli')
const Task = require('../task')

describe('Task', function() {
  describe('with global prefix, vendor and name', function() {
    beforeEach(function() {
      this.shipit = new Shipit({environment: 'test'})
      this.shipit.initConfig({
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

    it('accepts task options', function() {
      let task = new Task(this.shipit, {net: true})
      assert.isOk(task.options.net)
    })

    it('merges task and global options', function() {
      let task = new Task(this.shipit, {envs: ['AWESOME=TRUE']})
      assert.equal(task.options.prefix, 'pre')
      assert.equal(task.options.envs[0], 'AWESOME=TRUE')
    })

    it('overrides global options', function() {
      let task = new Task(this.shipit, {prefix: 'pfix'})
      assert.equal(task.options.prefix, 'pfix')
    })

    it('derives required names', function() {
      let task = new Task(this.shipit)
      assert.equal(task.options.image, 'pre/ven_name_web')
      assert.equal(task.options.container, 'ven_name_web')
    })

    it('derives required names from options', function() {
      let task = new Task(this.shipit, {
        prefix: 'pfix',
        vendor: 'vdor',
        name: 'some'
      })
      assert.equal(task.options.image, 'pfix/vdor_some_web')
      assert.equal(task.options.container, 'vdor_some_web')
    })

    it('uses required names from options', function() {
      let task = new Task(this.shipit, {
        image: 'pfix/vdor_some_web',
        container: 'vdor_some_web'
      })
      assert.equal(task.options.image, 'pfix/vdor_some_web')
      assert.equal(task.options.container, 'vdor_some_web')
    })
  })

  describe('without global options', function() {
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
    it('initializes container with options', function() {
      let Container = sinon.stub()
      let Task = proxyquire('../task', { './lib/container': Container })

      let shipit = {}
      let options = { image: 'i', container: 'c', net: 'n', path: 'p' }
      let task = new Task(shipit, options)
      task.run()

      sinon.assert.calledWith(Container, shipit, options)
    })
  })
})
