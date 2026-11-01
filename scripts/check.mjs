// npm run check — verificações rápidas, sem navegador. Rodar SEMPRE antes de abrir PR.
// 1. Camadas: os imports só descem. src/game → src/shared → src/engine.
//    engine não importa shared nem game; shared não importa game. Também falha se um import aponta para arquivo que não existe
//    ou para um pacote fora do package.json, e se a página aponta para um script que não existe.
// 2. Jogo (replay): o jogador faz sempre os mesmos movimentos, com sorteio e relógio fixos (scripts/sim.mjs);
//    o resultado é comparado com scripts/sim-fingerprint.txt.
//    PR de organização tem de dar igual. PR que muda a jogabilidade de propósito: npm run check -- --update-sim
//    (e dizer isso na descrição do PR).
// (Copiado do survivor e4314ee sem a verificação do mundo infinito: este jogo não tem gerador de mundo. Ver docs/ORIGEM.md.)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'src')
const SIM_FILE = path.join(ROOT, 'scripts/sim-fingerprint.txt')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const PACKAGES = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
const problems = []

// ---------------------------------------------------------------- 1. camadas
const files = []
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') && files.push(path.join(d, e.name)) }
walk(SRC)

// camada de um arquivo: 'engine' | 'shared' | 'game' | null (fora das camadas)
function layerOf(file) {
  const [a] = path.relative(SRC, file).split(path.sep)
  return a === 'engine' || a === 'shared' || a === 'game' ? a : null
}
const allowed = (from, to) => from === to || to === 'engine' || (to === 'shared' && from !== 'engine')
const resolveImport = (file, spec) => {
  const base = path.resolve(path.dirname(file), spec)
  return [base, base + '.js', path.join(base, 'index.js')].find((c) => fs.existsSync(c) && fs.statSync(c).isFile())
}
const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

for (const file of files) {
  const rel = path.relative(ROOT, file)
  const from = layerOf(file)
  if (!from) { problems.push(`${rel}: arquivo fora de src/engine, src/shared ou src/game`); continue }
  const code = fs.readFileSync(file, 'utf8')
  for (const m of code.matchAll(IMPORT)) {
    const spec = m[1] || m[2] || m[3]
    if (!spec.startsWith('.')) {
      if (!PACKAGES.some((p) => spec === p || spec.startsWith(p + '/'))) problems.push(`${rel}: importa o pacote "${spec}", que não está no package.json`)
      continue
    }
    const target = resolveImport(file, spec)
    if (!target) { problems.push(`${rel}: importa "${spec}", que não existe`); continue }
    const to = layerOf(target)
    if (!allowed(from, to)) problems.push(`${rel}: ${from} não pode importar ${to} ("${spec}")`)
  }
}
// a página aponta para scripts que existem?
for (const html of ['index.html']) {
  const code = fs.readFileSync(path.join(ROOT, html), 'utf8')
  for (const m of code.matchAll(/(?:src="|from ')\.?(\/src\/[^"']+)["']/g)) if (!fs.existsSync(path.join(ROOT, m[1]))) problems.push(`${html}: aponta para ${m[1]}, que não existe`)
}
console.log(`camadas: ${files.length} arquivos verificados`)

// ---------------------------------------------------------------- 2. jogo (replay)
try {
  // processo novo: o replay precisa começar do zero (ver scripts/sim.mjs)
  const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts/sim.mjs'), '--json'], { cwd: ROOT, encoding: 'utf8' })
  const sim = JSON.parse(out.trim().split('\n').pop())
  if (process.argv.includes('--update-sim')) { fs.writeFileSync(SIM_FILE, sim.hash + '\n'); console.log(`jogo: replay atualizado (${sim.summary})`) }
  else {
    const saved = fs.existsSync(SIM_FILE) ? fs.readFileSync(SIM_FILE, 'utf8').trim() : ''
    if (sim.hash !== saved) problems.push(`a jogabilidade mudou no replay (${sim.summary}). Se foi de propósito: npm run check -- --update-sim`)
    else console.log(`jogo: replay igual (${sim.summary})`)
  }
} catch (e) { problems.push(`não consegui rodar o replay: ${e.message}`) }

if (problems.length) {
  console.log(`\n✗ FALHOU: ${problems.length} problema(s)`)
  for (const p of problems) console.log(`  - ${p}`)
  process.exitCode = 1
} else console.log('\n✓ PASSOU')
