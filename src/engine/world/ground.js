// Chão e água: o motor não sabe como é o mapa, então o jogo diz (SetGround).
// Padrão: chão plano na altura 0 e nenhuma água.
// (No survivor isso vinha do gerador do mundo infinito: worldgen/sidewalk.js e worldgen/water.js.)
export const SWIM_DEPTH = 0.7 // mais fundo que isso = nadando (igual ao survivor)

let ground = () => 0
let waterY = -Infinity

// fn(x, z) = altura do chão · water = altura da superfície da água (-Infinity = sem água)
export function SetGround(fn, water = -Infinity) { ground = fn; waterY = water }

export const GroundAt = (x, z) => ground(x, z)
export const BaseGround = GroundAt // no survivor, o chão sem píer/ponte; o mapa feito à mão não tem essa diferença
export const WaterY = () => waterY
export const WaterDepth = (x, z) => Math.max(0, waterY - ground(x, z))
export const TooDeep = (x, z) => WaterDepth(x, z) > SWIM_DEPTH
