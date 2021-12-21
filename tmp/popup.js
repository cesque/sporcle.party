document.addEventListener('DOMContentLoaded', () => {
    let port = chrome.runtime.connect({
        name: 'sporcle-multiplayer-popup'
    })

    port.onMessage.addListener(msg => {
        console.log('message recieved' + msg)
    })

    document.querySelector('.create-room-button').addEventListener('click', () => {
        port.postMessage({
            type: 'create room'
        })
    })
})


