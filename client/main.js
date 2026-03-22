// Connect to the server
// For now use localhost, swap with his IP when testing together
const socket = io('http://localhost:3000')

// When you successfully connect
socket.on('connect', () => {
  console.log('Connected! My ID:', socket.id)
  document.getElementById('status').textContent = 'Connected!'
})

// When you lose connection
socket.on('disconnect', () => {
  console.log('Disconnected from server')
  document.getElementById('status').textContent = 'Disconnected!'
})

// When the server sends a game state update
socket.on('stateUpdate', (gameState) => {
  console.log('Game state received:', gameState)
  // This is where you'll update the UI later
})