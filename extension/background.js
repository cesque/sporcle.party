let ws = null

let room = {}
let quizInfo = {}

let messageTypes = {
    'sporcle-multiplayer:quiz-info': 'quiz info',
    'sporcle-multiplayer:quiz-start': 'quiz start',
    'sporcle-multiplayer:quiz-end': 'quiz end',
    'sporcle-multiplayer:quiz-pause': 'quiz pause',
    'sporcle-multiplayer:quiz-unpause': 'quiz unpause',
}

let fns = {
    'room info': roomInfo,
    'room created': roomCreated,
    'room closing': roomClosing,
}

let bootstrapPort = null
let popupPort = null

chrome.runtime.onInstalled.addListener(() => {
    console.clear()
    console.log('hello world!')
})

// when part of the extension connects over messaging 
// (either bootstrap for sporcle-page-side code
// or popup for popup code)
chrome.runtime.onConnect.addListener(async port => {
    // on first connect, we might get messages from
    // the bootstrap before the server has acknowledged
    // us, so we'll buffer them. maybe not needed, but shrug
    let firstMessageBuffer = []

    function sendOrBuffer(message) {
        // if websocket isn't ready to send stuff on,
        // just buffer it until the websocket is
        // fully ready
        if(!ws || ws.readyState != WebSocket.OPEN) {
            firstMessageBuffer.push(JSON.stringify(message))
        } else {
            // otherwise, just forward it on (with the new `type`)
            ws.send(JSON.stringify(message))
        }
    }

    if(port.name == 'sporcle-multiplayer-bootstrap') {
        // code that runs when bootstrap connects (every time
        // a new sporcle quiz is loaded)
        console.log('connected bootstrap')

        // keep a local reference to the current bootstrap
        bootstrapPort = port

        port.onMessage.addListener(message => {
            // messages come in with type `sporcle-multiplayer:kebab-case-name`
            // but between client and server we only refer to them with space case
            // names like `quiz info` or `submit answer`
            message.typePrevious = message.type
            message.type = messageTypes[message.type]

            console.log(message)    

            // we keep a local copy of the quiz info, even if
            // we aren't connected, so we can send it straight
            // away if once we do eventually connect
            if(message.type == 'quiz info') {
                quizInfo = message.data
                console.log('setting quiz info locally: ')
                console.log(quizInfo)
            }
            
            // if websocket isn't ready to send stuff on,
            // just buffer it until the websocket is
            // fully ready
            sendOrBuffer(message)
        })
        
        port.onDisconnect.addListener(() => {
            console.log('disconnected bootstrap')
            // destroy local reference to the bootstrap port
            bootstrapPort = null
            
            // port disconnected = most likely a page reload
            // or refresh, meaning no more quiz info
            quizInfo = {}

            ws.send(JSON.stringify({ 
                type: 'quiz info',
                data: quizInfo
            }))

        })
    } else if(port.name == 'sporcle-multiplayer-popup') {
        // code that runs when popup connects (every time
        // the popup is opened (i think, because i don't
        // believe it is persistent)
        console.log('connected popup')

        // keep a local reference to the current popup
        popupPort = port

        // send the popup our current room info so we can
        // show who is connected etc
        popupPort.postMessage({
            type: 'room info',
            data: room,
        })

        // handle messages from popup and forward them on
        // to the server. we just assume the connection
        // is established by now
        port.onMessage.addListener(message => {
            console.log(message)

            if(message.type == 'create room') {
                sendOrBuffer({ 
                    type: 'create room',
                })
            }

            log(JSON.stringify(message))
        })

        port.onDisconnect.addListener(() => {
            console.log('disconnected popup')
            // destroy local reference to the bootstrap port
            popupPort = null
        })
    }

    // if this extension hasn't already connected to the
    // server, make a connection and then after that...
    if(ws == null) {
        await connect()
        // send all the messages (if any) we buffered
        // before. in order!
        while(firstMessageBuffer.length > 0) {
            ws.send(firstMessageBuffer.shift())
        }
    }
})

function connect() {
    // connect to server -- only resolve the promise when
    // the websocket connection is open!
    return new Promise((resolve, reject) => {
        let url = `wss://sporcle-together.herokuapp.com/`
        let port = null
        // let url = `ws://localhost`
        // let port = 3009

        let websocketUrl = url
        if(port != null) {
            websocketUrl += `:${ port }`
        }

        console.log(`connecting to ${ websocketUrl }...`)
        ws = new WebSocket(websocketUrl)

        ws.addEventListener('open', event => {
            console.log('connected!');
            if(bootstrapPort) {
                    bootstrapPort.postMessage({
                    type: 'log',
                    source: 'background',
                    content: `connected to websocket server`,
                })
            }

            resolve(ws)
        })

        ws.addEventListener('close', event => {
            console.log(`connection closed with server`)
            ws = null
            room = {}
        })

        ws.addEventListener('error', event => {
            console.log(`connection errored with server`)
            ws = null
            room = {}
        })

        ws.addEventListener('message', event => {
            let data = JSON.parse(event.data)

            if(bootstrapPort) {
                bootstrapPort.postMessage({
                    type: 'log',
                    source: 'server',
                    content: JSON.stringify(data),
                })
            }

            // look up which function to use based on what
            // message was sent, then hand over the data to
            // that function to do whatever it wants
            if(fns.hasOwnProperty(data.type)) {
                fns[data.type](data)
            } else {
                log(`unknown message type from server: ${ data.type }`)
            }
        })
    })
}

// debug function, will send some data
// to the frontend console over the
// messaging connection
function log(content) {
    if(bootstrapPort) {
        bootstrapPort.postMessage({
            type: 'log',
            source: 'background',
            content: content,
        })
    }
}




/* --- messages from server --- */

// recieved room info -- update our 
// local room info and if the popup is
// open, send that data directly there
function roomInfo(data) {
    console.log(data)
    room = data.data
    if(popupPort) popupPort.postMessage(data)
}

// server told us that a room was
// created -- send the server our quiz
// info so it can pass it on to clients
function roomCreated(data) {
    console.log(data)

    ws.send(JSON.stringify({ 
        type: 'quiz info',
        data: quizInfo
    }))
}

// server told us that our room is
// closing from inactivity or other
// reason -- remove our local data and
// if the popup is open, update that too
function roomClosing(data) {
    console.log(data)
    room = {}
    if(popupPort) {
        popupPort.postMessage({
            type: 'room info',
            data: room,
        })
    }
}