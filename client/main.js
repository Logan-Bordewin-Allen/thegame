const socket = io('http://localhost:3000')

let myId = null
let currentState = null

// ---- Connection ----
socket.on('connect', () => {
  myId = socket.id
  console.log('Connected:', myId)
})

socket.on('disconnect', () => {
  document.getElementById('status').textContent = 'Disconnected!'
})

socket.on('invalidMove', (msg) => {
  console.warn('Invalid move:', msg)
})

// ---- State updates ----
socket.on('stateUpdate', (gameState) => {
  currentState = gameState
  updateSlots(gameState)

  if (gameState.phase === 'playing') {
    showGameScreen(gameState)
  } else {
    showWaitingScreen()
  }
})

// ---- Waiting screen ----
function updateSlots(gameState) {
  const playerCount = Object.keys(gameState.players).length
  const slot1 = document.getElementById('slot1')
  const slot2 = document.getElementById('slot2')

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
}

function showWaitingScreen() {
  document.getElementById('waitingScreen').classList.remove('hidden')
  document.getElementById('gameScreen').classList.remove('active')
}

// ---- Game screen ----
function showGameScreen(gameState) {
  document.getElementById('waitingScreen').classList.add('hidden')
  document.getElementById('gameScreen').classList.add('active')

  const isMyTurn = gameState.currentTurn === myId
  const me = gameState.players[myId]
  if (!me) return

  // Turn indicator
  document.getElementById('turnIndicator').textContent = isMyTurn
    ? 'Your Turn'
    : "Opponent's Turn"

  // Action points
  document.getElementById('actionPoints').textContent = `Actions: ${me.actionPoints}`

  // End turn button
  document.getElementById('endTurnBtn').disabled = !isMyTurn

  // Render hand
  renderHand(me.hand, isMyTurn)
}

// ---- Render hand ----
const CARD_ICONS = {
  fire: '🔥', ice: '❄️', wax: '🕯️', stardust: '✨',
  actionSpell: '⚡', tome: '📖', firebolt: '🔥', shield: '🛡️'
}

const CARD_EFFECTS = {
  actionSpell: '+1 Action point',
  tome: 'Draw 2 cards',
  firebolt: 'Deal 1 damage',
  shield: 'Block 1 damage'
}

function renderHand(hand, isMyTurn) {
  const handEl = document.getElementById('hand')
  handEl.innerHTML = ''

  hand.forEach(card => {
    const el = document.createElement('div')
    el.classList.add('card-in-hand')
    if (card.kind === 'spell') el.classList.add('spell-card')

    const icon = card.kind === 'component'
      ? CARD_ICONS[card.component]
      : CARD_ICONS[card.spell]

    const name = card.kind === 'component'
      ? capitalize(card.component)
      : formatSpellName(card.spell)

    const typeLabel = card.kind === 'component' ? 'Component' : 'Spell'
    const typeClass = card.kind === 'component' ? card.component : 'spell'

    // Detail panel (shown on hover)
    let detailHTML = `
      <div class="detail-name">${name}</div>
      <div class="detail-type ${typeClass}">${typeLabel}</div>
      <div class="detail-divider"></div>
    `

    if (card.kind === 'spell') {
      detailHTML += `
        <div class="detail-components">Needs: ${card.components.map(c =>
          `<span class="${c}">${capitalize(c)}</span>`).join(' + ')}
        </div>
        <div class="detail-cost">Cost: ${card.actionCost} action${card.actionCost > 1 ? 's' : ''}</div>
        <div class="detail-effect">${CARD_EFFECTS[card.spell] ?? ''}</div>
      `
    }

    el.innerHTML = `
      <div class="card-icon">${icon}</div>
      <div class="card-detail">${detailHTML}</div>
      <div class="card-name">${name}</div>
      <div class="card-type-badge ${typeClass}">${typeLabel}</div>
    `

    handEl.appendChild(el)
  })
}

// ---- Actions ----
function endTurn() {
  socket.emit('endTurn')
}

// ---- Helpers ----
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatSpellName(spell) {
  const names = {
    actionSpell: 'Action Spell',
    tome: 'Tome',
    firebolt: 'Firebolt',
    shield: 'Shield'
  }
  return names[spell] ?? spell
}