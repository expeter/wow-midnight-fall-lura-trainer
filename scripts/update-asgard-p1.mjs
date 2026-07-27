import { readFile, writeFile } from 'node:fs/promises'

const assetPath = new URL('../public/raidplans/asgard.txt', import.meta.url)
const p1Positions = [
  { x: 368.5307864874153, y: 462.59201659297275 },
  { x: 360.72379912663755, y: 478.1602983988356 },
  { x: 378.7225201269101, y: 469.32514581863927 },
  { x: 418.0971615720524, y: 493.26946870451235 },
  { x: 380.8548034934497, y: 449.9565138282387 },
  { x: 378.33905284792047, y: 432.1040717020427 },
  { x: 379.1059874058998, y: 500.4066613180652 },
  { x: 397.96615720524017, y: 491.2549126637555 },
  { x: 398.9727074235807, y: 441.89828966521105 },
  { x: 364.75, y: 437.86917758369725 },
  { x: 391.9268558951965, y: 419.738173216885 },
  { x: 408.0316593886463, y: 478.1602983988356 },
  { x: 415.07751091703057, y: 430.81823144104806 },
  { x: 351.6648471615721, y: 460.02929403202336 },
  { x: 399.4297531923521, y: 462.8018647878955 },
  { x: 331.53384279475983, y: 448.9492358078603 },
  { x: 400.985807860262, y: 422.7600072780204 },
  { x: 407.8660333301249, y: 462.41814237432243 },
  { x: 371.7958515283843, y: 422.7600072780204 },
  { x: 417.06924802587685, y: 462.03441996074923 },
]
const p1BossPosition = { x: 378.84170305676855, y: 473.1239082969432 }

const encoded = (await readFile(assetPath, 'utf8')).trim()
const plan = JSON.parse(decodeURIComponent(Buffer.from(encoded, 'base64').toString()))
const updated = { p1Positions, p1BossPosition, ...plan }
await writeFile(assetPath, Buffer.from(encodeURIComponent(JSON.stringify(updated))).toString('base64') + '\n')
