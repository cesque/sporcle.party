import WebSocket, { WebSocketServer } from 'ws'
import Room from './room.js'

let rooms = []

const wss = new WebSocketServer({
    port: 3009,
})

wss.on('connection', function connection(ws) {
    console.log(`connected: ${ ws._socket.remoteAddress }`)

    ws.on('message', function message(data) {
        let json = JSON.parse(data)

        console.log(json.type)

        if(json.type == 'create room') createRoom(ws)
    })

    ws.on('close', event => {
        console.log(`disconnected: ${ ws._socket.remoteAddress }`)
    })

    // setInterval(() => {
    //     ws.send(JSON.stringify({ 
    //         type: 'hello',
    //         id: Math.floor(Math.random() * 1000)
    //     }))
    // }, 1000)
})

let roomCheckReference = null
function startRoomCheckLoop() {
    roomCheckReference = setInterval(() => {
        rooms = rooms.filter(room => !room.hasTimedOut)
        // console.log(rooms.length)

        if(rooms.length == 0) stopRoomCheckLoop()
    }, 1000)
}

function stopRoomCheckLoop() {
    clearInterval(roomCheckReference)
}

function createRoom(ws) {
    let room = new Room(ws)

    rooms.push(room)
    room.sendRoomInfo()

    console.log(`rooms: ${ rooms.length }`)

    if(roomCheckReference == null) startRoomCheckLoop()
}