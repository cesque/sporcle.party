let ws = null

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

chrome.runtime.onConnect.addListener(port => {
    if(port.name == 'sporcle-multiplayer-bootstrap') {
        console.log('connected bootstrap')
        bootstrapPort = port

        port.onMessage.addListener(message => {
            console.log(message)
        })

        port.onDisconnect.addListener(() => {
            console.log('disconnected bootstrap')
            bootstrapPort = null
        })

        if(ws == null) connect()
    } else if(port.name == 'sporcle-multiplayer-popup') {
        console.log('connected popup')
        popupPort = port

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
    ws = new WebSocket(`ws://localhost:3009`)

    ws.addEventListener('open', event => {
        if(bootstrapPort) {
                bootstrapPort.postMessage({
                type: 'log',
                source: 'background',
                content: `connected to websocket server`,
            })
        }
    })

    ws.addEventListener('close', event => {
        console.log(`connection closed with server`)
        ws = null
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
    popupPort.postMessage(data)
}

function roomClosing(data) {
    console.log(data)
    popupPort.postMessage(data)
}