import React from 'react'
import styles from './App.scss'

export default class App extends React.Component {
    constructor(props) {
        super(props)

        console.log('a')

        this.port = null

        this.state = {
            room: null,
        }

        this.createRoom = this.createRoom.bind(this)
    }

    componentDidMount() {
        console.log(window.chrome)
        this.port = window.chrome.runtime.connect({
            name: 'sporcle-multiplayer-popup'
        })
    
        this.port.onMessage.addListener(msg => {
            console.log(msg)
            // console.log('message recieved' + msg)
            if(msg.type == 'room info') {
                this.setState({
                    room: msg.data
                })
            }
        })
    }

    createRoom() {
        this.port.postMessage({
            type: 'create room'
        })
    }

    render() {
        return <main class={styles.homePage}>
            <h1 class={styles.logo}><span>sporcle</span>.party</h1>
            <button class={styles.createRoomButton} type="button" onClick={ this.createRoom }>Create Room</button>
            { (this.state.room && this.state.room.room) ? <h3>{ this.state.room.room.code }</h3> : null }
            <pre>{ JSON.stringify(this.state, null, 4) }</pre>
        </main>
    }
}
