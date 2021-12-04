export default class Room {
    constructor(ws) {
        this.owner = ws
        this.code = new Array(4)
            .fill(0)
            .map(x => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)])
            .join('')

        this.clients = []

        this.timeoutTime = 1000 * 60 * 1
        this.hasTimedOut = false
        this.timeoutReference = null
        this.resetTimeout()

        this.owner.on('message', this.onOwnerMessage)
    }

    resetTimeout() {
        clearTimeout(this.timeoutReference)
        this.timeoutReference = setTimeout(() => this.close(), this.timeoutTime)

    }

    addClient(ws) {
        let client = {
            name: 'test' + Math.floor(Math.random() * 1000),
            ws: ws,
        }

        client.ws.on('message', data => this.onClientMessage(data, client))
    }

    broadcast(data) {
        this.owner.send(JSON.stringify(data))

        for(let client of this.clients) client.send(JSON.stringify(data))
    }

    sendRoomInfo() {
        let clientInfos = this.clients.map(client => {
            return {
                name: client.name
            }
        })

        this.broadcast({
            type: 'room info',
            code: this.code,
            clients: clientInfos,
        })
    }

    close() {
        console.log(`room ${ this.code } has had no activity for ${ this.timeoutTime / 1000 }s, shutting it down`)
        
        this.hasTimedOut = true

        this.broadcast({
            type: 'room closing',
            code: this.code,
        })
    }

    onOwnerMessage(data) {
        this.resetTimeout()

        console.log('owner:')
        console.log(data)
        console.log()
    }

    onClientMessage(data, client) {
        this.resetTimeout()

        console.log(client.name + ':')
        console.log(data)
        console.log()
    }
}