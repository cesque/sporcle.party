import React from 'react'
import names from './names.json'

export default class App extends React.Component {
    constructor(props) {
        super(props)

        this.connect = this.connect.bind(this)
        this.onOpen = this.onOpen.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.onClickJoin = this.onClickJoin.bind(this)
        this.renderNotConnected = this.renderNotConnected.bind(this)
        this.renderConnected = this.renderConnected.bind(this)
        this.onInputAnswer = this.onInputAnswer.bind(this)

        this.onRoomInfo = this.onRoomInfo.bind(this)
        this.onAnswerResponse = this.onAnswerResponse.bind(this)

        this.state = {
            socket: null,
            room: null,
            name: this.generateRandomName(),

            code: '',
            answer: '',
        }
    }

    componentDidMount() {
        setTimeout(() => {
            this.connect()
        }, 200);
    }

    generateRandomName() {
        let pick = a => a[Math.floor(Math.random() * a.length)]

        return `${ pick(names.adjs) } ${ pick(names.animals) }`
    }

    connect() {
        this.setState({
            socket: new WebSocket('wss://sporcle-together.herokuapp.com/')
        }, () => {
            console.log(this.state)
            this.state.socket.addEventListener('open', this.onOpen)
            this.state.socket.addEventListener('message', message => this.onMessage(JSON.parse(message.data)))
        })
    }

    onOpen() {
        
    }

    onClickJoin() {
        this.state.socket.send(JSON.stringify({
            type: 'join room',
            data: this.state.code.toUpperCase().trim(),
            player: this.state.name,
        }))
    }

    onMessage(message) {
        console.log('incoming message: ' + message.type)
        switch(message.type) {
            case 'room info':
                this.onRoomInfo(message.data)
                break
            case 'answer response':
                this.onAnswerResponse(message.data)
                break
            default:
                console.warn(`unknown message type from server: ${ message.type }`)
                console.warn(message)
                break
        }
    }

    onRoomInfo(data) {
        this.setState({
            room: data,
        })
    }

    onAnswerResponse(data) {
        this.setState({
            answer: '',
        })
    }

    onInputAnswer(event) {
        let value = event.target.value

        this.setState({
            answer: value,
        })

        this.state.socket.send(JSON.stringify({
            type: 'submit answer',
            data: value,
            player: this.state.name,
        }))
    }

    renderNotConnected() {
        return <>
            <h2>name: { this.state.name }</h2>
            <label htmlFor="room-code">Room code:</label>
            <input id="room-code" type="text" onChange={ event => this.setState({ code: event.target.value }) } placeholder='ROOM'></input>
            <button type="button" onClick={ this.onClickJoin }>Join</button>
        </>
    }

    renderConnected() {
        return <>
            <h2>name: { this.state.name }</h2>
            <h3>room: { this.state.room.code }</h3>

            <label htmlFor="answer">Answer:</label>
            <input type="text" value={ this.state.answer } onChange={ this.onInputAnswer } placeholder="enter an answer"></input>
            
            <pre>{ JSON.stringify(this.state.room, null, 4) }</pre>
        </>
    }

    render() {
        if(!this.state.socket) return <main>connecting...</main>

        return <main>
            { this.state.room ? this.renderConnected() : this.renderNotConnected() }
        </main>
    }
}