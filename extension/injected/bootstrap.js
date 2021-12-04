// inject our browser script
let s = document.createElement('script')
s.src = chrome.runtime.getURL('injected/script.js')
document.documentElement.appendChild(s)

;(async () => {
    console.log('connecting')
    let port = chrome.runtime.connect({
        name: 'sporcle-multiplayer-bootstrap'
    })
    console.log('connected to extension')
    
    port.onMessage.addListener(msg => {
        // console.log(msg)

        switch(msg.type) {
            case 'log': log(msg); break
            case 'submit answer': submitAnswer(msg); break
            default: console.warn(`unknown message type '${ msg.type }'`); console.warn(msg); break
        }

        // let event = new CustomEvent('sporcle-multiplayer:submit-answer', { 
        //     detail: {
        //         data: 'some data',
        //         id: msg.id,
        //         answer: msg.id % 2 == 0 ? 'T' : 'F',
        //     }
        // })

        // document.dispatchEvent(event)
    })

    function passDataToBackground(event) {
        console.log(event)
        let type = event.type
        let data = event.detail

        port.postMessage({
            type,
            data,
        })
    }

    let events = [
        'sporcle-multiplayer:quiz-info',
        'sporcle-multiplayer:quiz-start',
        'sporcle-multiplayer:quiz-end',
        'sporcle-multiplayer:quiz-pause',
        'sporcle-multiplayer:quiz-unpause',
    ]

    for(let event of events) {
        document.addEventListener(event, passDataToBackground)
    }
})()

function log(message) {
    let colors = {
        'server': '#1abc9c',
        'background': '#8e44ad',
    }

    let color = colors.hasOwnProperty(message.source) ? colors[message.source] : '#f39c12'
    console.log(
        `%cfrom %c${ message.source }%c: %c${ message.content }`,
        `font-weight: normal; color: #2c3e50`, 
        `font-weight: bold; color: ${ color }`,
        `font-weight: normal; color: #2c3e50`,
        `color: #7f8c8d`
    )
}

function submitAnswer(message) {

}