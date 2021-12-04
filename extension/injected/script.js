/* --- quiz started --- */
_spHooks['postStart'].push(function() {
    sendEvent('quiz-start', {
        data: 'quiz start',
    })
})

/* --- quiz ended --- */
_spHooks['end'].push(function() {
    // todo: also send this when page is navigated away from?
    sendEvent('quiz-end', {
        data: 'quiz end',
    })
})

/* --- quiz paused --- */
let pauseGameOld = window.pauseGame;
window.pauseGame = function(arguments) {
    let returnValue = pauseGameOld.apply(this, arguments)

    sendEvent('quiz-pause', {
        data: 'quiz pause',
    })

    return returnValue
}

/* --- quiz unpaused --- */
let unPauseGameOld = window.unPauseGame;
window.unPauseGame = function(arguments) {
    let returnValue = unPauseGameOld.apply(this, arguments)

    sendEvent('quiz-unpause', {
        data: 'quiz unpause',
    })

    return returnValue
}





/* --- send info about current quiz --- */
sendEvent('quiz-info', Sporcle.gameData)


function sendEvent(eventName, data) {
    let event = new CustomEvent(`sporcle-multiplayer:${ eventName }`, { 
        detail: data
    })

    document.dispatchEvent(event)
}

document.addEventListener('sporcle-multiplayer:submit-answer', event => {
    let message = event.detail
    console.log('entering: ' + message.answer)

    let textInput = document.querySelector('#gameinput')

    let prevTextValue = textInput.value
    textInput.value = message.answer
    window.checkGameInput(textInput)
    textInput.value = prevTextValue
})