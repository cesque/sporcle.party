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

let lastSubmittedData = null
let oldShowAnswer = showAnswer
window.showAnswer = function(answerSlot, answer, gameOver) {
    if(!gameOver) {
        // answer is being shown because it's right, not
        // because the game is over and we're showing them all
        if(lastSubmittedData) {
            // answer was submitted by a player over the network
            // not entered by local player (this is set below)

            // send back an answer response so server (and
            // eventually player) can know the got the
            // answer correct
            sendEvent('answer-response', { result: true, ...lastSubmittedData })
        }
    }

    oldShowAnswer(answerSlot, answer, gameOver)
}

/* --- send info about current quiz --- */
let gameMetaElement = document.querySelector('#gameMeta h2')
let gameMeta = gameMetaElement ? gameMetaElement.textContent : null

let gameData = {
    name: Sporcle.gameData.name,
    gameID: Sporcle.gameData.gameID,
    meta: gameMeta,
}

sendEvent('quiz-info', gameData)


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

    // cache the current value
    let prevTextValue = textInput.value

    // update text input with answer from client
    textInput.value = message.answer
    // save message info so we can refer to it
    // in message back to server if the answer
    // is correct
    lastSubmittedPlayerId = message

    // submit the answer
    window.checkGameInput(textInput)

    // reset the player data
    lastSubmittedPlayerId = null
    // restore text input from cache
    // so local player can keep typing
    textInput.value = prevTextValue
})