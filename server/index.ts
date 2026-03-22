import express from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { gameState, addPlayer, removePlayer, startGame, nextTurn } from './gameState.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*' // allows your client to connect during development
  }
})

io.on('connection', (socket: Socket) => {
  console.log('Player connected:', socket.id)

  // Player joins with a name
  socket.on('joinGame', (name: string) => {
    addPlayer(socket.id, name)
    console.log(`${name} joined the game`)
    io.emit('stateUpdate', gameState) // tell everyone about the new player
  })

  // Host starts the game
  socket.on('startGame', () => {
    startGame()
    io.emit('stateUpdate', gameState)
  })

  // Player takes their turn
  socket.on('takeTurn', () => {
    if (gameState.currentTurn !== socket.id) return // not your turn!
    nextTurn()
    io.emit('stateUpdate', gameState)
  })

  // Player disconnects
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)
    removePlayer(socket.id)
    io.emit('stateUpdate', gameState)
  })
})

httpServer.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})