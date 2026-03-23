const socket = io('http://localhost:3000')

let myId = null
let currentState = null
let selectedSpell = null     // the spell card currently selected
let selectedComponents = []  // auto selected component card ids
let hasDrawnTwo = false

// ---- Connection ----
socket.on('connect', () => {
  myId = socket.id
  console.log('Connected:', myId)
})

socket.on('disconnect', () => {
  console.log('Disconnected')
})

socket.on('invalidMove', (msg) => {
  console.warn('Invalid move:', msg)
  clearSelection()
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

  document.getElementById('turnIndicator').textContent = isMyTurn
    ? 'Your Turn'
    : "Opponent's Turn"

  document.getElementById('actionPoints').textContent = `Actions: ${me.actionPoints}`
  // stats
const opponentId = Object.keys(gameState.players).find(id => id !== myId)
const opponent = opponentId ? gameState.players[opponentId] : null

document.getElementById('myHp').textContent = me.hp
document.getElementById('myShield').textContent = me.shield
document.getElementById('oppHp').textContent = opponent ? opponent.hp : '-'
document.getElementById('oppShield').textContent = opponent ? opponent.shield : '-'
  if (!isMyTurn) hasDrawnTwo = false
document.getElementById('endTurnBtn').disabled = !isMyTurn
document.getElementById('drawTwoBtn').disabled = !isMyTurn || hasDrawnTwo

  renderHand(me.hand, isMyTurn)
  updateOpponentPlayed(gameState)

  updateHistory(gameState)
document.getElementById('historyToggle').classList.add('visible')
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

    // mark selected
    if (card.id === selectedSpell) el.classList.add('selected')
    if (selectedComponents.includes(card.id)) el.classList.add('selected')

    // detail panel
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

    // only spells are clickable, and only on your turn
    if (isMyTurn && card.kind === 'spell') {
      el.addEventListener('click', () => onSpellClick(card, hand))
    } else if (card.kind === 'component') {
      el.classList.add('invalid') // components cant be clicked directly
    }

    handEl.appendChild(el)
  })
}

// ---- Spell selection ----
function onSpellClick(spellCard, hand) {
  // if clicking the already selected spell, deselect
  if (selectedSpell === spellCard.id) {
    clearSelection()
    return
  }

  // try to find matching components in hand
  const required = [...spellCard.components] // e.g. ['fire', 'stardust']
  const foundIds = []

  for (const needed of required) {
    const match = hand.find(c =>
      c.kind === 'component' &&
      c.component === needed &&
      !foundIds.includes(c.id)
    )
    if (match) {
      foundIds.push(match.id)
    } else {
      // missing a component — cant cast
      console.warn(`Missing component: ${needed}`)
      clearSelection()
      showError(`Missing component: ${capitalize(needed)}`)
      return
    }
  }

  // check action points
  const me = currentState.players[myId]
  if (me.actionPoints < spellCard.actionCost) {
    showError('Not enough action points')
    clearSelection()
    return
  }

  // all good — select spell + components
  selectedSpell = spellCard.id
  selectedComponents = foundIds

  // show cast button
  document.getElementById('castBtn').style.display = 'block'

  // re-render to show selection
  renderHand(me.hand, true)
}

// ---- Cast spell ----
function castSpell() {
  if (!selectedSpell || !currentState) return

  // find the spell card object so we can animate it
  const me = currentState.players[myId]
  const spellCard = me.hand.find(c => c.id === selectedSpell)

  socket.emit('playSpell', selectedSpell, selectedComponents)
  
  if (spellCard) playCastAnimation(spellCard)
  
  clearSelection()
}
// ---- Cast animation ----
function playCastAnimation(spellCard) {
  const el = document.getElementById('castAnimation')
  const icon = document.getElementById('castAnimIcon')
  const name = document.getElementById('castAnimName')

  icon.textContent = CARD_ICONS[spellCard.spell]
  name.textContent = formatSpellName(spellCard.spell)

  // reset then trigger
  el.classList.remove('playing')
  void el.offsetWidth // force reflow so animation restarts
  el.classList.add('playing')

  setTimeout(() => el.classList.remove('playing'), 500)
}
// ---- Show opponent's last played ----
function updateOpponentPlayed(gameState) {
  const el = document.getElementById('opponentPlayed')
  const icon = document.getElementById('opponentPlayedIcon')
  const name = document.getElementById('opponentPlayedName')

  // only show if last played was by the opponent
  if (
    !gameState.lastPlayed ||
    gameState.lastPlayed.playerId === myId
  ) {
    el.classList.remove('visible')
    return
  }

  icon.textContent = CARD_ICONS[gameState.lastPlayed.card.spell]
  name.textContent = formatSpellName(gameState.lastPlayed.card.spell)
  el.classList.add('visible')
}

// End turn button
function endTurn() {
  hasDrawnTwo = false
  clearSelection()
  socket.emit('endTurn')
}
function drawTwo() {
  if (hasDrawnTwo) return
  hasDrawnTwo = true
  document.getElementById('drawTwoBtn').disabled = true
  socket.emit('drawTwo')
}

// ---- Clear selection ----
function clearSelection() {
  selectedSpell = null
  selectedComponents = []
  document.getElementById('castBtn').style.display = 'none'

  if (currentState && currentState.phase === 'playing') {
    const me = currentState.players[myId]
    const isMyTurn = currentState.currentTurn === myId
    if (me) renderHand(me.hand, isMyTurn)
  }
}

// ---- Error flash ----
function showError(msg) {
  const indicator = document.getElementById('turnIndicator')
  const original = indicator.textContent
  indicator.style.color = 'var(--red)'
  indicator.textContent = msg
  setTimeout(() => {
    indicator.style.color = ''
    indicator.textContent = original
  }, 1500)
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

// ---- Game over ----
socket.on('gameOver', ({ loserId }) => {
  document.getElementById('gameScreen').classList.remove('active')
  document.getElementById('hand').innerHTML = ''
  document.getElementById('castBtn').style.display = 'none'

  const screen = document.getElementById('gameOverScreen')
  const text = document.getElementById('gameOverText')
  const sub = document.getElementById('gameOverSub')

  screen.classList.add('active')

  if (loserId === myId) {
    text.textContent = 'Defeated.'
    text.style.color = 'var(--red)'
    sub.textContent = 'Your health reached zero.'
  } else {
    text.textContent = 'Victory!'
    text.style.color = 'var(--green)'
    sub.textContent = 'Your opponent has fallen.'
  }
})

// ---- History panel ----
function toggleHistory() {
  document.getElementById('historyPanel').classList.toggle('open')
}

function updateHistory(gameState) {
  if (!myId) return

  const opponentId = Object.keys(gameState.players).find(id => id !== myId)

  renderHistoryList('myHistory', gameState.history[myId] ?? [])
  renderHistoryList('oppHistory', opponentId ? (gameState.history[opponentId] ?? []) : [])
}

function renderHistoryList(elId, entries) {
  const el = document.getElementById(elId)
  el.innerHTML = ''

  if (entries.length === 0) {
    const li = document.createElement('li')
    li.textContent = 'Nothing yet'
    li.style.opacity = '0.5'
    el.appendChild(li)
    return
  }

  // show most recent at top
  ;[...entries].reverse().forEach(entry => {
    const li = document.createElement('li')
    li.innerHTML = `
      <span class="history-entry-icon">${CARD_ICONS[entry.spellName]}</span>
      ${formatSpellName(entry.spellName)}
    `
    el.appendChild(li)
  })
}