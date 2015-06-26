var assert = require('assert')
var fs = require('fs')
var os = require('os')
var path = require('path')
var fse = require('../../')

/* global beforeEach, describe, it */

var o777 = parseInt('777', 8)
var o666 = parseInt('666', 8)
var o444 = parseInt('444', 8)

describe('copy', function () {
  var TEST_DIR

  beforeEach(function (done) {
    TEST_DIR = path.join(os.tmpdir(), 'fs-extra', 'copy')
    fse.emptyDir(TEST_DIR, done)
  })

  // pretty UNIX specific, may not pass on windows... only tested on Mac OS X 10.9
  it.skip('should maintain file permissions and ownership', function (done) {
    var userid = require('userid')

    // http://man7.org/linux/man-pages/man2/stat.2.html
    var S_IFREG = parseInt('0100000', 8) // regular file
    var S_IFDIR = parseInt('0040000', 8) // directory

    var permDir = path.join(TEST_DIR, 'perms')
    fs.mkdirSync(permDir)

    var srcDir = path.join(permDir, 'src')
    fs.mkdirSync(srcDir)

    var f1 = path.join(srcDir, 'f1.txt')
    fs.writeFileSync(f1, '')
    fs.chmodSync(f1, o666)
    fs.chownSync(f1, process.getuid(), userid.gid('wheel'))
    var f1stats = fs.lstatSync(f1)
    assert.strictEqual(f1stats.mode - S_IFREG, o666)

    var d1 = path.join(srcDir, 'somedir')
    fs.mkdirSync(d1)
    fs.chmodSync(d1, o777)
    fs.chownSync(d1, process.getuid(), userid.gid('staff'))
    var d1stats = fs.lstatSync(d1)
    assert.strictEqual(d1stats.mode - S_IFDIR, o777)

    var f2 = path.join(d1, 'f2.bin')
    fs.writeFileSync(f2, '')
    fs.chmodSync(f2, o777)
    fs.chownSync(f2, process.getuid(), userid.gid('staff'))
    var f2stats = fs.lstatSync(f2)
    assert.strictEqual(f2stats.mode - S_IFREG, o777)

    var d2 = path.join(srcDir, 'crazydir')
    fs.mkdirSync(d2)
    fs.chmodSync(d2, o444)
    fs.chownSync(d2, process.getuid(), userid.gid('wheel'))
    var d2stats = fs.lstatSync(d2)
    assert.strictEqual(d2stats.mode - S_IFDIR, o444)

    var destDir = path.join(permDir, 'dest')
    fse.copy(srcDir, destDir, function (err) {
      assert.ifError(err)

      var newf1stats = fs.lstatSync(path.join(permDir, 'dest/f1.txt'))
      var newd1stats = fs.lstatSync(path.join(permDir, 'dest/somedir'))
      var newf2stats = fs.lstatSync(path.join(permDir, 'dest/somedir/f2.bin'))
      var newd2stats = fs.lstatSync(path.join(permDir, 'dest/crazydir'))

      assert.strictEqual(newf1stats.mode, f1stats.mode)
      assert.strictEqual(newd1stats.mode, d1stats.mode)
      assert.strictEqual(newf2stats.mode, f2stats.mode)
      assert.strictEqual(newd2stats.mode, d2stats.mode)

      done()
    })
  })
})