const XYZ = require('xyz-core')
const SWIM = require('xyz.ping.swim.bootstrap')
const IRONIZE = require('./common')
let ms = new XYZ({
  selfConf: {
    name: 'slave',
    seed: ['127.0.0.1:4000'],
    transport: [{port: 5000, type: 'HTTP'}],
    defaultBootstrap: false
  }
})

// init swim
ms.bootstrap(SWIM)

// add all that Iron stuff
ms.bootstrap(IRONIZE)

console.log(ms)
