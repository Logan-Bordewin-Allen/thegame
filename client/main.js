const socket = io('http://localhost:3000')

const slot1 = document.getElementById('slot1')
const slot2 = document.getElementById('slot2')
const waitingScreen = document.getElementById('waitingScreen')
const gameScreen = document.getElementById('gameScreen')

// ---- Connection ----
socket.on('connect', () => {
  console.log('Connected:', socket.id)
})

socket.on('disconnect', () => {
  console.log('Disconnected')
})

// ---- State updates from server ----
socket.on('stateUpdate', (gameState) => {
  const playerCount = Object.keys(gameState.players).length

  // Update the player slots visually
  if (playerCount >= 1) {
    slot1.textContent = '✦'
    slot1.classList.add('filled')
  } else {
    slot1.textContent = '○'
    slot1.classList.remove('filled')
  }

  if (playerCount >= 2) {
    slot2.textContent = '✦'
    slot2.classList.add('filled')
  } else {
    slot2.textContent = '○'
    slot2.classList.remove('filled')
  }

  // Switch screens when game starts
  if (gameState.phase === 'playing') {
    waitingScreen.classList.add('hidden')
    gameScreen.classList.add('active')
  } else {
    waitingScreen.classList.remove('hidden')
    gameScreen.classList.remove('active')
  }
})