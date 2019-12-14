'use strict'

let port = normalizePort(process.env.PORT || '7716')
const portRange = port + 10
const display = process.argv[2] || '1'
const nodeEnv = process.argv[3] || process.env.NODE_ENV || 'production'

let ad =null
// import the module
const mdns = require('mdns')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io').listen(server)
const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const ejs = require('ejs')

const index = require('./routes/index')
const install = require('./routes/install')
const hls = require('./routes/hls')
const mjpeg = require('./routes/mjpeg')
const progress = require('./routes/progress')
const assets = require('./routes/assets')
// const info = require('./routes/info')

const jpegSocket = require('./sockets/jpeg')(app, io)
const mseSocket = require('./sockets/mse')(app, io)
const progressSocket = require('./sockets/progress')(app, io)
const m3u8Socket = require('./sockets/m3u8')(app, io)
const installSocket = require('./sockets/install')(app, io)
const stderrSocket = require('./sockets/stderr')(app, io)

const dirName = process.pkg && process.pkg.entrypoint ? path.dirname(process.execPath) : __dirname
const ffmpeg = require('./lib/findFfmpeg')(dirName)
const activity = require('./lib/activityLog')(dirName)

app.set('dirName', dirName)
app.set('ffmpegVersion', ffmpeg.version)
app.set('ffmpegPath', ffmpeg.path)
app.set('activity', activity)
app.set('env', nodeEnv)
app.set('display', display)
app.set('port', port)
app.set('io', io)
app.set('jpegSocket', jpegSocket)
app.set('mseSocket', mseSocket)
app.set('progressSocket', progressSocket)
app.set('m3u8Socket', m3u8Socket)
app.set('installSocket', installSocket)
app.set('stderrSocket', stderrSocket)
app.set('ejs', ejs)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.set('mdns', mdns)
//app.set('bonjour',bonjour)

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (nodeEnv === 'development') {
  // logs all requests to console
  app.use(logger('dev'))
}
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
// app.use('/info', info)
app.use('/assets', assets)
app.use('/', index)
app.use('/install', install)
app.use('/hls', hls)
app.use('/mjpeg', mjpeg)
app.use('/progress', progress)
app.use('/mdi', express.static(path.join(__dirname, 'node_modules/material-design-icons/iconfont')))
app.use('/mdl', express.static(path.join(__dirname, 'node_modules/material-design-lite/dist')))
app.use(express.static(path.join(__dirname, 'public')))

app.use(function (req, res, next) {
  const err = new Error('Not Found')
  console.error(`${req.url} not found.`)
  err.status = 404
  next(err)
})

app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    status: err.status,
    stack: nodeEnv === 'development' ? err.stack : ''
  })
  if (nodeEnv === 'development') {
    console.error(err)
  }
  // next(err);
})

if (nodeEnv === 'development') {
  app.use(logger('dev'))
}

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function normalizePort (val) {
  const port = parseInt(val, 10)
  if (isNaN(port)) {
    return val
  }
  if (port >= 0) {
    return port
  }
  return false
}

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      return process.exit(1)
    case 'EADDRINUSE':
      console.error(`${bind} is already in use.`)
      if (typeof port === 'string' || port >= portRange) {
        return process.exit(1)
      }
      console.log(`Incrementing to port ${++port} and trying again.`)
      server.listen(port)
      break
    default:
      throw error
  }
}

let arrayofdevices = [];
function onListening () {
  const addr = server.address()
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  console.log(`Listening on ${bind}.`)

  const { exec } = require('child_process')
  var donevideo = false;

  exec(app.get('ffmpegPath') + ' -hide_banner -f avfoundation -list_devices true -i \"\"', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      var lines = stderr.match(/^.*([\n\r]+|$)/gm);

      lines.forEach(line => {
        if (line.includes("AVFoundation audio devices:"))
          donevideo = true;
      if (line.includes( "[AVFoundation input device")&&!donevideo)
      {
        if (!line.includes("AVFoundation video devices:"))
        {

          var regExp = /(\[([^\]]|\[\])*\])/;
          var matches = regExp.exec(line);
          var device = line.replace(matches[1],"").trim();
          arrayofdevices.push(device)
          console.log(`Video device : ${device}`)
        }
      }

    });
    }
  })


  // advertise an HTTP server on port 3000
  ad = mdns.createAdvertisement(mdns.tcp('_jitslides'), addr.port)
  ad.start()
  //bonjour.publish({ name: 'Stephanes-MacBook-Ret.local', type: '_jitslides', port: addr.port })

  let ffmpeg = app.get('ffmpeg')
  const express = require('express')
  const router = express.Router()
  const {PassThrough} = require('stream')
  const FR = require('ffmpeg-respawn')
  //const M4F = require('mp4frag')
  const P2J = require('pipe2jpeg')
  //  const packageJson = require('package')
  // const title = `${packageJson.name} ver: ${packageJson.version}`
  let values = null
  //let mp4frag = app.get('mp4frag')
  let pipe2jpeg = app.get('pipe2jpeg')
  let stderrLogs = app.get('stderrLogs')
  if (ffmpeg && ffmpeg.running) {
    ffmpeg.stop()
  }

  /* +++++++++ gather form input values ++++++++++ */

  /** @param {String} values.logLevel - (-loglevel logLevel) */
  const logLevel = 'info'

  /** @param {String} values.hwAccel - (-hwaccel hwAccel) */
  const hwAccel = 'auto'

  /** @param {Number} [values.analyzeDuration] - (-analyzeduration analyzeDuration) 0 - 10000000 */
  const analyzeDuration = 10000000

  /** @param {Number} [values.probeSize] - (-probesize probeSize) 32 - 1048576 */
  const probeSize = 1048576

  /** @param {String} values.inputType - (-f inputType) */
  const inputType = 'avfoundation'

  /** @param {String} values.inputUrl - (-i inputUrl) */
  const inputUrl = app.get('display')

  /** @param {String} [values.rtspTransport] - (-rtsp_transport rtspTransport) */
  const rtspTransport = 'tcp'

  /** @param {String} values.jpegCodec - (-c jpegCodec) */
  const jpegCodec = 'mjpeg'

  /** @param {Number} [values.jpegRate] - (-r jpegRate) 1 - 30 */
  const jpegRate = 7

  /** @param {Number} [values.jpegScale] - (-vf scale=trunc(iw*jpegScale/2)*2:-2) .10 - 1 */
  const jpegScale = 0.75

  /** @param {Number} [values.jpegQuality] - (-q jpegQuality) 1 - 31 */
  const jpegQuality = 10

  /* +++++++++ process form input values ++++++++++ */

  // params to be passed to ffmpeg
  const params = []

  params.push(...['-hwaccel', hwAccel])

  if (analyzeDuration !== 'none') {
    params.push(...['-analyzeduration', analyzeDuration])
  }

  if (probeSize !== 'none') {
    params.push(...['-probesize', probeSize])
  }

  params.push('-re')
  params.push(...['-f', 'avfoundation', '-video_size', '640x480', '-framerate', '10', '-i', inputUrl])

  params.push(...['-c', jpegCodec])

  if (jpegCodec !== 'copy') {
    if (jpegQuality !== 'none') {
      params.push(...['-q', jpegQuality])
    }

    if (jpegRate !== 'none') {
      params.push(...['-r', jpegRate])
    }

    if (jpegScale !== 'none') {
      params.push(...['-vf', `scale=trunc(iw*${jpegScale}/2)*2:-2`])
    }
  }

  // TODO -f mpjpeg -boundary_tag ffmpeg_streamer so that we can later pipe response without parsing individual jpegs
  params.push(...['-f', 'image2pipe', 'pipe:4'])

  pipe2jpeg = new P2J()
    .setMaxListeners(30)
    .on('error', (err) => {
      console.log(err.message)
    })

  app.set('pipe2jpeg', pipe2jpeg)

  stderrLogs = new PassThrough({
    transform (chunk, encoding, callback) {
      if (this._readableState.pipesCount > 0) {
        this.push(chunk)
      }
      callback()
    }
  })
    .setMaxListeners(30)
    .on('error', (err) => {
      console.log(err.message)
    })

  app.set('stderrLogs', stderrLogs)

  try {
    ffmpeg = new FR(
      {
        path: app.get('ffmpegPath'),
        params: params,
        logLevel: logLevel,
        pipes: [
          {stdioIndex: 4, destination: pipe2jpeg}
        ],
        killAfterStall: 10,
        spawnAfterExit: 2,
        reSpawnLimit: 100,
        stderrLogs: stderrLogs,
        exitCallback: () => {
          // console.log('exit call back');
          // mp4frag.resetCache()
        }
      })
      .on('fail', (msg) => {
        console.log('fail', msg)
      })
      .start()
    app.set('ffmpeg', ffmpeg)
  } catch (error) {
    console.log('fail', error.message)
  }
}

// print process.argv
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val)
})

function exitHandler(options, exitCode) {
    if (options.cleanup) ad.stop();
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));


module.exports = app
