let ws = null

let room = {}

let fns = {
    'hello': hello,
    'room info': roomInfo,
    'room closing': roomClosing,
}

let bootstrapPort = null
let popupPort = null

chrome.runtime.onInstalled.addListener(() => {
    console.clear()
    console.log('hello world!')
})

chrome.runtime.onConnect.addListener(async port => {
    if(port.name == 'sporcle-multiplayer-bootstrap') {
        console.log('connected bootstrap')
        bootstrapPort = port

        let firstMessageBuffer = []
        port.onMessage.addListener(message => {
            console.log(message)
            
            if(!ws || ws.readyState != WebSocket.OPEN) {
                firstMessageBuffer.push(JSON.stringify(message))
            } else {
                ws.send(JSON.stringify(message))
            }
        })
        
        port.onDisconnect.addListener(() => {
            console.log('disconnected bootstrap')
            bootstrapPort = null
        })

        if(ws == null) {
            await connect()
            for(let message of firstMessageBuffer) {
                ws.send(message)
            }
        }
    } else if(port.name == 'sporcle-multiplayer-popup') {
        console.log('connected popup')
        popupPort = port

        popupPort.postMessage({
            type: 'room info',
            data: room,
        })

        port.onMessage.addListener(message => {
            console.log(message)

            if(message.type == 'create room') {
                ws.send(JSON.stringify({ 
                    type: 'create room',
                }))
            }

            log(JSON.stringify(message))
        })

        port.onDisconnect.addListener(() => {
            console.log('disconnected popup')
            popupPort = null
        })
    }
})

function connect() {
    return new Promise((resolve, reject) => {
        // let url = `ws://192.168.1.124`
        // let port = 8080
        let url = `ws://localhost`
        let port = 3009
        console.log(`connecting to ${ url }:${ port }...`)
        ws = new WebSocket(`${ url }:${ port }`)

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

            if(fns.hasOwnProperty(data.type)) {
                fns[data.type](data)
            } else {
                log(`unknown message type from server: ${ data.type }`)
            }
        })
    })
}

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
function hello(data) {
    log('server said hello!')
}

function roomInfo(data) {
    console.log(data)
    room = data.data
    popupPort.postMessage(data)
}

function roomClosing(data) {
    console.log(data)
    room = {}
    popupPort.postMessage({
        type: 'room info',
        data: room,
    })
}