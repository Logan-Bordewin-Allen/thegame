import express from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { gameState, addPlayer, removePlayer, startGame, nextTurn, playSpell, endTurn, drawTwo, checkWin } from './gameState.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})

io.on('connection', (socket: Socket) => {
  console.log('Player connected:', socket.id)

  // Auto assign player and check if we can start
  addPlayer(socket.id, `Player ${Object.keys(gameState.players).length}`)

  const playerCount = Object.keys(gameState.players).length
  console.log(`Players connected: ${playerCount}/2`)

  if (playerCount === 2) {
    startGame()
    console.log('Both players connected — starting game!')
  }

  io.emit('stateUpdate', gameState)

  // Player plays a spell
    socket.on('playSpell', (spellCardId: string, componentCardIds: string[]) => {
        // Must be this player's turn
        if (gameState.currentTurn !== socket.id) return

        // Must be in playing phase
        if (gameState.phase !== 'playing') return

        const success = playSpell(socket.id, spellCardId, componentCardIds)

        if (success) {
            const loserId = checkWin()
            io.emit('stateUpdate', gameState)
            if (loserId) {
                io.emit('gameOver', { loserId })
            }
        }else {
            // Tell just this player the move was invalid
            socket.emit('invalidMove', 'Could not cast spell — check your hand and action points')
        }
    })
  // Player ends their turn
    socket.on('endTurn', () => {
        if (gameState.currentTurn !== socket.id) return
        if (gameState.phase !== 'playing') return

        endTurn(socket.id)
        io.emit('stateUpdate', gameState)
    })

  // Player disconnects
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)
    removePlayer(socket.id)

    // If someone leaves mid game, reset back to waiting
    if (gameState.phase === 'playing') {
      gameState.phase = 'waiting'
      gameState.currentTurn = null
      console.log('Player left — returning to waiting screen')
    }

    io.emit('stateUpdate', gameState)
  })
  // Player draws two cards
socket.on('drawTwo', () => {
  if (gameState.currentTurn !== socket.id) return
  if (gameState.phase !== 'playing') return

  drawTwo(socket.id)
  io.emit('stateUpdate', gameState)
})
  
})

httpServer.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})