# xyz.example.iron.swim.ping.bootstrap

This repository will demonstrate how xyz [Iron](https://github.com/node-xyz/xyz.iron.man.bootstrap) can be simply composed with xyz [Swim](https://github.com/node-xyz/xyz.ping.swim.bootstrap) ping to secure the system.

## The Plain Swim  

The Swim Ping is by far the most reliable and deployment-friendly ping mechanism for xyz. In order to make it really suitable for deployment, it has to be a bit more secure.

You may have noticed by now that the Swim by itself is not that secure. It accepts any xyz node that has the Swim ping protocol installed. Let's see some details.

Since all pings in xyz behave with the local node just like a foreign node, the best way to assess them is to launch just one node. Let's run this simple script with `debug` logLevel to see some details:

```javascript
const XYZ = require('xyz-core')
const SWIM = require('xyz.ping.swim.bootstrap')

let ms = new XYZ({
  selfConf: {
    defaultBootstrap: false
  }
})

// init swim
ms.bootstrap(SWIM)
```

Some of the log lines that should draw your attention are:

```bash
[2017-4-1 15:10:43][node-xyz-init@127.0.0.1:4000] debug :: Transport Client :: sending message to 127.0.0.1:4000/SPING_HTTP through swim.http.dispatch.mw middleware :: message {"userPayload":{"title":"introduce"},"xyzPayload":{"senderId":"127.0.0.1:4000"}}
```

Here, `127.0.0.1:4000` is sending a HTTP introduction message to itself. This message will cause all of the important information to be exchanged.

As a result:

```bash
[2017-4-1 15:10:43][node-xyz-init@127.0.0.1:4000] verbose :: SWIM :: HTTP message received {"title":"introduce","id":"127.0.0.1:4000"}
[2017-4-1 15:10:43][node-xyz-init@127.0.0.1:4000] verbose :: SWIM :: introduction handshake with 127.0.0.1:4000 done.
```

Hence, if any nodes sends a HTTP message with the above format, it can be joined. Not cool!

## Securing Swim

Swim creates two outgoing routes and server routes, one in an HTTP server and the other in a new UDP server. The new Transport layer routes are:

```javascript
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
}

```

Hence, we must encrypt two symmetric routes, `SPING_UDP` and `SPING_HTTP`.

We are going to place the code of applying Iron in a new file and inside a function, so that we can use it again with other nodes. We will apply the function as a bootstrap function. Here is the code:

```javascript
// common.js

const IRON = require('xyz.iron.man.bootstrap')

function ironSwim (xyz) {
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
```

> Note that we use `xyz.id().port`, so that every node can use this. `Number(xyz.id().port) + 1` is because the Swim will create a udp server on node's default port + 1.

As you see, `.bootstrap` is being used inside this function. We will also use `ironSwim()` with `.bootstrap`!

If you apply this to the node:

```javascript
// index.js

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
```

If you run the node with `debug` logLevel you can see some logs that show the content of udp and http messages that are encrypted. Good!

```
[2017-4-1 15:39:38][node-xyz-init@127.0.0.1:4000] debug :: UDP SERVER @ 4001 :: udp message received for /SPING_UDP [{"userPayload":"Fe26.2**26fd3778271202fda251cca79972f3bf36e973980bd22838bc97c134af556b69*fg7Ry68C28YmuzvokjBhNw*07zFyEE547L_zJxrKMKdQd6bSY7iBhYP8l7s7H42aSB-lMRcXRegYnfzpGsqgKVhd5MdQbG04dQEMZk3MMsf_w**27b10a483298bca3515776e8146c8e2e2b379b3b03f24e7a1b5f0f85bd6fdbb8*VOoC3AVQ9JIc57VGG45ABoPROBArGTTJy1g_j4W_NBM","xyzPayload":{"senderId":"127.0.0.1:5000","route":"/SPING_UDP"}}]
```

#### a Known issue

At the very start, you might see something like:

```
[2017-4-1 15:23:55][node-xyz-init@127.0.0.1:4000] error :: SWIM :: introduction to 127.0.0.1:4000 failed [out of reach for 0]: Unauthorized - {"error":"IRON :: error while decryping message message type incorrect"}
```

This error is actually predictable and it will not cause any harm. The second you call `ms.bootstrap(SWIM)` the ping starts to work while the Iron is still being initialized in later lines. Hence, first few messages will fail, namely because the sealing middleware of iron is not yet initialized while the unSeal is and it expects messages to be encrypted. But this is not a severe problem since a node will not be kicked after one failure.

Moving on.

Let's assume that this `index.js` is going to be a master node that accepts other nodes. We will then create new slave nodes that try to join via `index`, while some of them can and some of them can't!

## Authorized Join

We will create a new node, with the same config. We only change the name and seed-node of this node:

```javascript
// client.authorized.js

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
```

This node should be able to join the system without any problem. Some errors might appear because of the problem discussed above, but at the end, it should join.

You should still see that all messages have encrypted bodies.

## Unauthorized Join

The new poor node that is not going to be able to join is 100% similar to the previous one, except it will not bootstrap itself with `IRONIZE`. Image that a `common.js` file like this could contain numerous bootstrap functions that seal your entire project and it could be seen as single security module in your app.

```javascript
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
```

> Note that we are also changing the port in `selfConf.transport`.

If you run this node, you can see that it can handshake with itself, but when it comes to joining:

```
[2017-4-1 15:40:41][slave@127.0.0.1:6000] error :: SWIM :: join via 127.0.0.1:4000 failed. trying next seed node...
[2017-4-1 15:40:44][slave@127.0.0.1:6000] error :: SWIM :: join via 127.0.0.1:4000 failed. trying next seed node...
[2017-4-1 15:40:47][slave@127.0.0.1:6000] error :: SWIM :: join via 127.0.0.1:4000 failed. trying next seed node...
[2017-4-1 15:40:51][slave@127.0.0.1:6000] error :: SWIM :: join via 127.0.0.1:4000 failed. trying next seed node...
```

and analogously in `127.0.0.1:4000` which is the target of the join request:

```
[2017-4-1 15:40:51][node-xyz-init@127.0.0.1:4000] error :: IRON :: error while decryping message :: message type incorrect
[2017-4-1 15:40:51][node-xyz-init@127.0.0.1:4000] error :: IRON :: error while decryping message :: message type incorrect
[2017-4-1 15:40:51][node-xyz-init@127.0.0.1:4000] error :: IRON :: error while decryping message :: message type incorrect
[2017-4-1 15:40:51][node-xyz-init@127.0.0.1:4000] error :: IRON :: error while decryping message :: message type incorrect
```

# Summery

![]()
