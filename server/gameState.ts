// ---- Card Types ----
export type ComponentType = 'fire' | 'ice' | 'wax' | 'stardust'
export type SpellType = 'charge' | 'tome' | 'firebolt' | 'shield' | 'cantrip' | 'omniscience' | 'rush' | 'dud'
export type ItemType = 'match' | 'snow' | 'candle' | 'meteorite'

export interface ComponentCard {
  id: string
  kind: 'component'
  component: ComponentType
}

export interface SpellCard {
  id: string
  kind: 'spell'
  spell: SpellType
  actionCost: number
  components: ComponentType[] // what components are needed to cast it
  cost: number
}

export interface ItemCard {
  id: string
  kind: 'item'
  item: ItemType
  cost: number
}

export type Card = ComponentCard | SpellCard | ItemCard

// ---- Deck Builder ----
let cardCounter = 0
function makeId(): string {
  cardCounter++
  return `card_${cardCounter}`
}


export function buildStarterDeck(): Card[] {
  return [
    // Components — 3 of each
    { id: makeId(), kind: 'component', component: 'fire' },
    { id: makeId(), kind: 'component', component: 'fire' },
    { id: makeId(), kind: 'component', component: 'fire' },
    { id: makeId(), kind: 'component', component: 'ice' },
    { id: makeId(), kind: 'component', component: 'ice' },
    { id: makeId(), kind: 'component', component: 'ice' },
    { id: makeId(), kind: 'component', component: 'wax' },
    { id: makeId(), kind: 'component', component: 'wax' },
    { id: makeId(), kind: 'component', component: 'wax' },
    { id: makeId(), kind: 'component', component: 'stardust' },
    { id: makeId(), kind: 'component', component: 'stardust' },
    { id: makeId(), kind: 'component', component: 'stardust' },
  ]
}

// Building Spellbook
let spellcount = 0
function spellID(): string{
    spellcount++
    return ""+spellcount
}

function isSpellType(spellName: string): spellName is SpellType{
  return ['charge' , 'tome' , 'firebolt' , 'shield' , 'cantrip' , 'omniscience' , 'rush'].includes(spellName)
}

//spell creation helper funcion, use this to create new spells
function buildSpellCard(spellName: string): SpellCard{
  if(isSpellType(spellName)){
    switch (spellName){
      case 'charge':
        return { id: makeId(), kind: 'spell', spell: 'charge', actionCost: 0, components: ['fire', 'wax'], cost: 0 }
        break

      case 'tome':
        return { id: makeId(), kind: 'spell', spell: 'tome', actionCost: 1, components: ['ice', 'stardust'], cost: 0 }
        break

      case 'firebolt':
        return { id: makeId(), kind: 'spell', spell: 'firebolt', actionCost: 1, components: ['fire', 'stardust'], cost: 0 }
        break

      case 'shield':
        return { id: makeId(), kind: 'spell', spell: 'shield', actionCost: 1, components: ['ice', 'wax'], cost: 0 }
        break
      
      case 'cantrip':
        return {id: makeId(), kind: 'spell', spell: 'cantrip', actionCost: 0, components: ['fire'], cost: 3}
        break

      case 'omniscience':
        return {id: makeId(), kind: 'spell', spell: 'omniscience', actionCost: 2, components: ['fire', 'wax', 'stardust','ice'], cost: 5}
        break

      case 'rush':
        return {id: makeId(), kind: 'spell', spell: 'rush', actionCost: 2, components: [], cost: 3}
        break
    }
  }
  //if this ever happens we are cooked
  console.log('error in buildSpellCard')
  return {id: makeId(), kind: 'spell', spell: 'dud', actionCost: 0, components: [], cost: 0}
}


export function buildStarterBook(): SpellCard[]{
    return [
    buildSpellCard('charge'),
    buildSpellCard('tome'),
    buildSpellCard('firebolt'),
    buildSpellCard('shield')
    ]
} 


//Adds all non-standard spells and items and then suffles them
export function buildShop(): Card[]{
  return shuffle([
    buildSpellCard('cantrip'),
    buildSpellCard('omniscience'),
    buildSpellCard('rush'),
    {id: makeId(), kind: 'item', item: 'candle', cost: 3},
    {id: makeId(), kind: 'item', item: 'match', cost: 3},
    {id: makeId(), kind: 'item', item: 'snow', cost: 3},
    {id: makeId(), kind: 'item', item: 'meteorite', cost: 3},
    ])
}

export function shuffle(deck: Card[]): Card[] {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = d[i]
    if (temp === undefined || d[j] === undefined) continue
    d[i] = d[j] as Card
    d[j] = temp
  }
  return d
}

// The things with and of a player
export interface Player {
  id: string
  name: string
  hp: number
  shield: number
  actionPoints: number
  deck: Card[]
  hand: Card[]
  discard: Card[]
  spellbook: SpellCard[]
  gold: number
  points: number
}

// The full game state
export interface GameState {
  players: Record<string, Player>
  currentTurn: string | null
  phase: 'waiting' | 'playing' | 'ended'
  lastPlayed: { playerId: string; card: SpellCard } | null
  turn: number
  history: Record<string, HistoryEntry[]> // keyed by playerId
  shop: Card[]
}

// The single source of truth
export const gameState: GameState = {
  players: {},
  currentTurn: null,
  phase: 'waiting',
  lastPlayed: null,
  turn: 0,
  history: {},
  shop: buildShop()
}

// Add a player to the game
export function addPlayer(id: string, name: string): void {
  const deck = shuffle(buildStarterDeck())
  const spellbook = buildStarterBook()
  const hand = deck.splice(0, 5)

  gameState.players[id] = {
    id,
    name,
    hp: 10,
    shield: 0,
    actionPoints: 1,
    deck,
    hand,
    discard: [],
    spellbook,
    gold: 0,
    points: 0
  }
  gameState.history[id] = []
}

// Remove a player from the game
export function removePlayer(id: string): void {
  delete gameState.players[id]
}

// Start the game
export function startGame(): void {
  const playerIds = Object.keys(gameState.players)
  if (playerIds.length < 2) return // need at least 2 players
  gameState.phase = 'playing'
  gameState.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)] ?? null  // ?? null handles the undefined
}

// Advance to the next player's turn
export function nextTurn(): void {
  const playerIds = Object.keys(gameState.players)
  const currentIndex = playerIds.indexOf(gameState.currentTurn!)
  const nextIndex = (currentIndex + 1) % playerIds.length
  gameState.currentTurn = playerIds[nextIndex] ?? null  // ?? null handles the undefined
}

export function drawCards(playerId: string, amount: number): void {
  const player = gameState.players[playerId]
  if (player === undefined) return

  for (let i = 0; i < amount; i++) {
    // If deck is empty, shuffle discard back into deck
    if (player.deck.length === 0) {
      if (player.discard.length === 0) return // nothing left to draw
      player.deck = shuffle(player.discard)
      player.discard = []
    }

    const card = player.deck.shift()
    if (card === undefined) return
    player.hand.push(card)
  }
}

export function playSpell(playerId: string, spellCardId: string, componentCardIds: string[]): boolean {
  const player = gameState.players[playerId]
  if (player === undefined) return false

  // Find the spell card in spellbook
  const spellCard = player.spellbook.find(c => c.id === spellCardId)
  if (spellCard === undefined || spellCard.kind !== 'spell') return false

  // Check player has enough action points
  if (player.actionPoints < spellCard.actionCost) return false

  // Find the component cards in hand
  const componentCards = componentCardIds.map(id => player.hand.find(c => c.id === id))
  if (componentCards.some(c => c === undefined)) return false

  // Check the components match what the spell needs
  const providedTypes = componentCards.map(c => (c as ComponentCard).component).sort()
  const requiredTypes = [...spellCard.components].sort()
  const match = providedTypes.every((t, i) => t === requiredTypes[i])
  if (!match) return false

  // All checks passed — spend action points
  player.actionPoints -= spellCard.actionCost

  // Remove spell + components from hand, move to discard
  const usedIds = new Set([spellCardId, ...componentCardIds])
  player.discard.push(...player.hand.filter(c => usedIds.has(c.id)))
  player.hand = player.hand.filter(c => !usedIds.has(c.id))

  // Resolve the spell effect
  resolveSpell(spellCard.spell, playerId)
    // Track what was just played
    gameState.lastPlayed = { playerId, card: spellCard }
    // Record in history
    gameState.history[playerId]?.push({
    spellName: spellCard.spell,
    turn: gameState.turn
    })

  return true
}

export function shopPurchase(playerId: string, CardId: string): boolean{
  const player = gameState.players[playerId]
  if (player === undefined) return false

  const shopCard = gameState.shop.find(c => c.id === CardId)
  if (shopCard === undefined) return false

  if(shopCard.kind === 'item' && player.gold >= shopCard.cost){
    resolveItem(shopCard.item,player.id)
    return true
  }else if(shopCard.kind === 'spell' && player.points >= shopCard.cost){
    //unnessassary if statement but stops an error
    if(gameState.players[playerId] != undefined)
      gameState.players[playerId].discard.push(buildSpellCard(shopCard.spell))
    return true
  }
  
  //player lack currency
  return false
}

function resolveSpell(spell: SpellType, casterId: string): void {
  const player = gameState.players[casterId]
  if (player === undefined) return

  const opponentId = Object.keys(gameState.players).find(id => id !== casterId)
  const opponent = opponentId ? gameState.players[opponentId] : undefined

  switch (spell) {
    case 'charge':
      player.actionPoints += 1
      break

    case 'tome':
      drawCards(casterId, 3)
      break

    case 'firebolt':
      if (opponent === undefined) break
      const fbDamage = 3
      const fbAbsorbed = Math.min(opponent.shield, fbDamage)
      opponent.shield -= fbAbsorbed
      opponent.hp -= (fbDamage - fbAbsorbed)
      // clamp hp to 0
      if (opponent.hp < 0) opponent.hp = 0
      break

    case 'shield':
      player.shield += 2
      break

    case 'cantrip':
      if (opponent === undefined) break
      const cDamage = 1
      const cAbsorbed = Math.min(opponent.shield, cDamage)
      opponent.shield -= cAbsorbed
      opponent.hp -= (cDamage - cAbsorbed)
      break

    case 'omniscience':
      player.actionPoints += 3
      drawCards(casterId, 6)
      break

    case 'rush':
      drawCards(casterId, 2)
      break

  }
}

function resolveItem(item: ItemType, casterId: string): void{
  const player = gameState.players[casterId]
  if (player === undefined) return

  switch (item){
    case 'candle':
      player.discard.push({ id: makeId(), kind: 'component', component: 'wax' })

    case 'match':
      player.discard.push({ id: makeId(), kind: 'component', component: 'fire' })

    case 'meteorite':
      player.discard.push({ id: makeId(), kind: 'component', component: 'stardust' })

    case 'snow':
      player.discard.push({ id: makeId(), kind: 'component', component: 'ice' })
  }

}

export function endTurn(playerId: string): void {
  const player = gameState.players[playerId]
  if (player === undefined) return

  player.actionPoints = 1
  gameState.turn += 1

  const cardsToDraw = 5 - player.hand.length
  if (cardsToDraw > 0) drawCards(playerId, cardsToDraw)

  nextTurn() // advance turn first

  // NOW reset the next player's shield at the start of their turn
  const nextPlayer = gameState.players[gameState.currentTurn!]
  if (nextPlayer !== undefined) nextPlayer.shield = 0
}
export function drawTwo(playerId: string): boolean {
  const player = gameState.players[playerId]
  if (player === undefined) return false

  drawCards(playerId, 2)
  return true
}

export function checkWin(): string | null {
  for (const player of Object.values(gameState.players)) {
    if (player.hp <= 0) {
      gameState.phase = 'ended'
      return player.id // this player lost
    }
  }
  return null
}

export interface HistoryEntry {
  spellName: SpellType
  turn: number
}