const IRON = require('xyz.iron.man.bootstrap')

function ironSwim (xyz) {
  // by default swim creates:
  /*
  Transport:
    outgoing middlewares:
      swim.http.dispatch.mw [/SPING_HTTP] || _httpExport[0]
      swim.udp.dispatch.mw [/SPING_UDP] || _udpExport[0]

    HTTPServer @ 4000 ::
      Middlewares:
      swim.http.receive.mw [/SPING_HTTP] || _authIntroduce[0] -> onHttpPingReceive[1]

    UDPServer @ 4001 ::
      Middlewares:
      swim.udp.receive.mw [/SPING_UDP] || onUdpPingReceive[0]
   */

  // encrypt the http

  xyz.bootstrap(IRON, {
    clientRoute: 'SPING_HTTP',
    clientIndex: 0,

    serverPort: Number(xyz.id().port),
    serverRoute: 'SPING_HTTP',
    serverIndex: 0
  })

  // encrypt udp
  xyz.bootstrap(IRON, {
    clientRoute: 'SPING_UDP',
    clientIndex: 0,

    serverPort: Number(xyz.id().port) + 1,
    serverRoute: 'SPING_UDP',
    serverIndex: 0
  })
}

module.exports = ironSwim
