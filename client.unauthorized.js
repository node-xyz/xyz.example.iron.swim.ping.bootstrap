const XYZ = require('xyz-core')
const SWIM = require('xyz.ping.swim.bootstrap')
let ms = new XYZ({
  selfConf: {
    name: 'slave.unauth',
    seed: ['127.0.0.1:4000'],
    transport: [{port: 6000, type: 'HTTP'}],
    defaultBootstrap: false
  }
})

// init swim
ms.bootstrap(SWIM)

console.log(ms)
