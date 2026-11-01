import * as THREE from 'three'
import { MAT } from '../../engine/render/style'
import { AddColliders } from '../../engine/world/collision'
import { GroundAt } from '../../engine/world/ground'
import { GetProto, SPECS } from '../../shared/worldgen/buildings'
import { AddBuildings } from '../../shared/worldgen/buildings-registry'

// Põe uma casa do survivor no mapa feito à mão: malha fechada + um recorte por andar (o registro troca quando alguém entra)
// + porta que gira. Trecho "casas" copiado de shared/worldgen/generator.js do survivor (e4314ee); ver docs/ORIGEM.md.
// id = tipo (stone1, stone2, house1… em SPECS) · v = variante · ry = giro (0, π/2, π, -π/2)
export function PlaceHouse(scene, { id, v = 0, x, z, ry = 0 }) {
  const s = SPECS[id], swapped = Math.round(Math.sin(ry)) !== 0
  const b = { id, v, x, z, ry, hw: (swapped ? s.d : s.w) / 2, hd: (swapped ? s.w : s.d) / 2 }
  const g = new THREE.Group(), cols = []

  const pr = GetProto(b.id, b.v)
  const y = Math.max(GroundAt(b.x - b.hw, b.z - b.hd), GroundAt(b.x + b.hw, b.z - b.hd), GroundAt(b.x - b.hw, b.z + b.hd), GroundAt(b.x + b.hw, b.z + b.hd), GroundAt(b.x, b.z))
  const meshes = [pr.closed, ...pr.cuts].map((geo, i) => {
    const m = new THREE.Mesh(geo, MAT.solid)
    m.position.set(b.x, y, b.z); m.rotation.y = b.ry; m.visible = i === 0
    g.add(m)
    return m
  })
  const sn = Math.round(Math.sin(b.ry)), cs = Math.round(Math.cos(b.ry)), swap = sn !== 0
  const toW = (lx, lz) => [b.x + lx * cs + lz * sn, b.z - lx * sn + lz * cs]
  for (const c of pr.cols) {
    const [wx, wz] = toW(c.x, c.z)
    const o = { x: wx, z: wz, hw: swap ? c.hd : c.hw, hd: swap ? c.hw : c.hd }
    if (c.h !== undefined) o.h = c.h
    if (c.lv !== undefined) o.lv = c.lv
    cols.push(o)
  }
  // porta: pivô na dobradiça; o colisor some quando ela abre
  const pivot = new THREE.Group(), leaf = new THREE.Mesh(pr.door, MAT.solid)
  const [hx, hz] = toW(pr.hinge.x, pr.hinge.z), [ddx, ddz] = toW(pr.doorCol.x, pr.doorCol.z)
  pivot.position.set(hx, y, hz); pivot.rotation.y = b.ry
  pivot.add(leaf); g.add(pivot)
  const dcol = { x: ddx, z: ddz, hw: swap ? pr.doorCol.hd : pr.doorCol.hw, hd: swap ? pr.doorCol.hw : pr.doorCol.hd, door: true, off: false }
  cols.push(dcol)
  const iw = swap ? pr.iz : pr.ix, id2 = swap ? pr.ix : pr.iz
  const house = {
    x: b.x, z: b.z, y, ry: b.ry, cs, sn, pr, x0: b.x - b.hw, x1: b.x + b.hw, z0: b.z - b.hd, z1: b.z + b.hd,
    ix0: b.x - iw, ix1: b.x + iw, iz0: b.z - id2, iz1: b.z + id2, meshes, mode: 0, door: { pivot, leaf, ang: 0, col: dcol, x: ddx, z: ddz },
    // janelas do térreo e móveis no mundo (o survivor usa para zumbis e saque; aqui ficam para atalhos e itens)
    windows: pr.windows.map((o) => { const [wx, wz] = toW(o.x, o.z); return { x: wx, z: wz, nx: o.nx * cs + o.nz * sn, nz: -o.nx * sn + o.nz * cs, w: o.w, y: y + o.y, id: `${wx.toFixed(1)},${wz.toFixed(1)}` } }),
    spots: pr.spots.map((p) => { const [sx, sz] = toW(p.x, p.z), [fx, fz] = toW(p.fx, p.fz); return { x: sx, z: sz, fx, fz, y: y + p.y, lv: p.k, key: p.key, room: p.room, r: p.r, id: `${sx.toFixed(1)},${sz.toFixed(1)},${p.k}` } }),
  }

  g.traverse((o) => { o.matrixAutoUpdate = false; o.updateMatrix() }) // parado: a porta atualiza a própria matriz ao girar
  scene.add(g)
  AddColliders(cols)
  AddBuildings([house])
  return house
}
