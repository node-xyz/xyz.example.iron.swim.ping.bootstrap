const XYZ = require('xyz-core')
const SWIM = require('xyz.ping.swim.bootstrap')
const IRONIZE = require('./common')
let ms = new XYZ({
  selfConf: {
    defaultBootstrap: false
  }
})

// init swim
ms.bootstrap(SWIM)

// add all that Iron stuff
ms.bootstrap(IRONIZE)

console.log(ms)
