import express from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { gameState, addPlayer, removePlayer, startGame, nextTurn } from './gameState.js'

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

  // Player takes their turn
  socket.on('takeTurn', () => {
    if (gameState.currentTurn !== socket.id) return
    nextTurn()
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
})

httpServer.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})