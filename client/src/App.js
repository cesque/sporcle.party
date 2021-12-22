import React from 'react'

export default class App extends React.Component {
    constructor(props) {
        super(props)

        this.socket = null

        this.room = {}

        this.connect = this.connect.bind(this)
        this.onOpen = this.onOpen.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.onRoomInfo = this.onRoomInfo.bind(this)
    }

    connect() {
        this.socket = new WebSocket('wss://sporcle-together.herokuapp.com/')

        this.socket.addEventListener('open', this.onOpen)
        this.socket.addEventListener('message', message => this.onMessage(JSON.parse(message.data)))
    }

    onOpen() {
        this.socket.send(JSON.stringify({
            type: 'join room',
            data: '0AaNInqOJMC53LmW',
        }))
    }

    onMessage(message) {
        switch(message.type) {
            case 'room info':
                this.onRoomInfo(message.data)
                break
            default:
                console.warn(`unknown message type from server: ${ message.type}`)
                console.warn(message)
                break
        }
    }

    onRoomInfo(data) {
        this.room = data
    }

    render() {
        return <main>
            <button type="button" onClick={ this.connect }>connect</button>
        </main>
    }
}