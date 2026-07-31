# L'ura / Midnight Falls — Tank Trainer Specification

## 1. Scope

Implement the **core two-tank gameplay loop** for L'ura in *Midnight Falls*, with enough phase context to train:

- Heaven's Lance mitigation and tank swaps
- safe handling across phase transitions
- interactions between tanks and Dawn Crystals
- Heroic-specific Tears of L'ura risks
- recovery from missed swaps, deaths, and desynchronized state

Primary scope: **Normal and Heroic**.

Mythic should be treated as a separate extension because it adds additional crystal failure rules and encounter states that are not covered here.

---

## 2. Core training objective

The player should learn this repeatable loop:

> **Lance counter reaches 5 → active tank mitigates the full burst → burst finishes and Impaled is applied → off-tank taunts.**

Heaven's Lance is **not** a single casted tankbuster on a fixed timer.

The boss accumulates a visible Heaven's Lance counter. At 5 applications, she releases a rapid multi-hit burst into her current target. Each impact applies `Impaled`, causing the later impacts and any subsequent Lance set to become increasingly dangerous.

The trainer must therefore score these as separate actions:

1. Defensive used before the first impact
2. No premature taunt during the burst
3. Taunt performed promptly after the final impact
4. The tank with active `Impaled` does not take the next full set

Do not teach a strict “swap every 20 seconds” rule. Timing can shift due to encounter abilities and transitions.

---

## 3. Recommended encounter state

```ts
type Phase =
  | "P1_FINAL_TOLLS"
  | "INTERMISSION_TOTAL_ECLIPSE"
  | "P2_DARK_REACTOR"
  | "P3_MIDNIGHT_FALLS"
  | "COMPLETE"
  | "WIPE";

type LanceState =
  | "BUILDING"
  | "ARMED"
  | "BURST_ACTIVE"
  | "WAITING_FOR_SWAP"
  | "SUSPENDED";

interface TankState {
  id: "tankA" | "tankB";
  alive: boolean;
  hasThreat: boolean;
  impaledStacks: number;
  impaledExpiresAt?: number;
  mitigationActive: boolean;
  majorDefensiveActive: boolean;
  externalDefensiveActive: boolean;
  hasDawnCrystal: boolean;
  isCrystalBarrierCaster: boolean;
}

interface EncounterState {
  phase: Phase;
  bossAttackable: boolean;
  bossTarget?: "tankA" | "tankB";
  lanceCounter: number; // 0..5, synchronized from encounter events
  lanceState: LanceState;
  lanceImpactIndex: number; // 0..5 during burst
  tanks: Record<"tankA" | "tankB", TankState>;
  crystalOnFloor: boolean;
  crystalFloorSince?: number;
  pendingTearsSoaks: number;
}
```

### Important implementation rule

The authoritative inputs should be encounter events:

- boss Heaven's Lance aura/counter
- Lance impact events
- `Impaled` applications and removals
- threat/target changes
- boss attackable or phase-state changes
- Dawn Crystal pickup, drop, consumption, and holder
- Cosmic damage events affecting a crystal holder

A timer may drive a simulated exercise, but it must not be the source of truth in a combat-log-backed trainer.

---

## 4. Heaven's Lance state machine

### 4.1 Building

```text
BUILDING
  counter 0 → 1 → 2 → 3
```

Trainer behavior:

- display the current counter
- show the current active tank
- no urgent callout yet
- optionally remind the off-tank to monitor `Impaled`

### 4.2 Pre-warning

```text
counter = 4
```

Callouts:

- active tank: `LANCE NEXT — PREPARE DEFENSIVE`
- off-tank: `READY TO TAUNT AFTER BURST`

If the active tank has a Dawn Crystal on Heroic:

- issue a higher-priority warning:
  `CRYSTAL + LANCE: TEARS RISK`
- recommend transferring or dropping the crystal before the burst when the strategy permits
- do not instruct the off-tank to taunt early merely to avoid the crystal interaction

### 4.3 Armed and burst

```text
counter = 5
ARMED → BURST_ACTIVE
```

At burst start:

- snapshot the current boss target as `burstTarget`
- require active mitigation
- recommend a personal defensive
- stronger defensive weighting may be applied during dangerous overlaps

During the five impacts:

- lock the expected target to `burstTarget`
- increment `lanceImpactIndex`
- apply/increment `Impaled`
- penalize a taunt that changes the target before the set completes
- do not call for the swap until the final impact has resolved

Suggested callout:

```text
DEFENSIVE — HOLD BOSS
```

### 4.4 Swap window

After the fifth impact:

```text
BURST_ACTIVE → WAITING_FOR_SWAP
```

Callout:

```text
OTHER TANK TAUNT
```

Success criteria:

- the non-Impaled or lower-risk tank gains threat promptly
- the burst target stops tanking before the next Lance cycle
- boss position remains stable unless the current phase requires movement

After successful taunt:

```text
WAITING_FOR_SWAP → BUILDING
lanceImpactIndex = 0
```

Do not require `Impaled` to expire before the swap. The purpose of the swap is to let it expire while the other tank is active.

---

## 5. Defensive scoring

The trainer should distinguish:

### Correct

- active mitigation is running before impact 1
- a planned personal defensive covers most or all of the five-hit set
- an external is used when assigned
- the tank remains active through all five impacts

### Warning

- only active mitigation is used
- defensive begins after the first impact
- defensive expires before later, more dangerous impacts
- Lance overlaps movement or another high-damage mechanic

### Failure

- no relevant mitigation
- active tank dies during the set
- off-tank taunts during the multi-hit burst and splits the set
- the same tank takes consecutive sets while still heavily Impaled

The exact damage multiplier of `Impaled` should be configurable rather than hard-coded. Public encounter data and strategy guides have shown differing values after tuning changes; the trainer's core lesson is the stacking danger and required post-set swap.

---

## 6. Phase-transition handling

## 6.1 General rule

Transitions must **suspend and resynchronize** the tank mechanic.

Never continue a guessed Lance countdown through a transition.

On transition start:

```ts
function suspendForTransition(state: EncounterState) {
  state.lanceState = "SUSPENDED";
  state.lanceImpactIndex = 0;
  cancelTrainerOnlyLanceTimers();
  retainRealImpaledDebuffTimers();
}
```

On the boss becoming attackable again:

```ts
function resyncAfterTransition(observed: ObservedEncounterState) {
  lanceCounter = observed.lanceCounter ?? 0;
  bossTarget = observed.currentThreatTarget;
  impaledStacks = observed.tankDebuffs;

  chooseSafeActiveTank();
  lanceState = lanceCounter >= 5 ? "ARMED" : "BUILDING";
}
```

Do not assume the counter resets or persists. Read the observed encounter state.

If the trainer is fully simulated rather than combat-log-backed, reset the counter to 0 at the start of a new boss-active phase unless a scenario explicitly tests a carried partial counter.

## 6.2 Burst colliding with a transition

If a Lance burst begins immediately before a transition:

1. let already-fired impact events resolve
2. do not invent missing impacts after the boss becomes unavailable
3. preserve any real `Impaled` stacks and expiry
4. suspend further counter generation
5. resynchronize when the boss returns

The post-transition starting tank should be selected from actual debuffs, not merely “the tank who was next in rotation.”

---

## 7. Phase-specific behavior

## 7.1 Phase 1 — Final Tolls

Tank requirements:

- execute the standard Lance loop
- keep boss facing/position consistent because the Death's Dirge sequence begins relative to the current tank
- continue the swap even when Lance overlaps movement around Dark Quasar

Trainer overlap scenario:

```text
Dark Quasar movement
+ Heaven's Lance counter reaches 5
```

Expected behavior:

- active tank moves predictably
- defensive is used before the burst
- off-tank follows within taunt range
- taunt occurs only after impact 5
- boss is not dragged through the raid

### Transition into Total Eclipse

At the phase transition:

- stop generating Lance stacks
- mark the boss as unavailable
- preserve `Impaled` timers until they naturally expire
- both tanks temporarily become normal mechanic participants
- crystal handling becomes more important than threat

---

## 7.2 Intermission — Total Eclipse

There is no normal tank swap loop while L'ura is unavailable.

Both tanks must:

- resist the pull toward the Darkwell
- avoid Dark Quasar lines
- spread correctly for Starsplinter
- remain reachable by healers due to the recurring healing absorb

### Tank carrying a Dawn Crystal

A tank may carry a crystal during the intermission, but this is not mechanically free.

On Heroic, direct Cosmic damage to a crystal holder triggers `Tears of L'ura`. Starsplinter is therefore a dangerous interaction.

If a crystal-holding tank receives Starsplinter:

```text
DROP CRYSTAL → RESOLVE/SIDESTEP STARSPLINTER → IMMEDIATELY RE-PICK
```

Trainer requirements:

- allow a short crystal-drop window
- warn immediately if the crystal remains on the floor
- use a conservative 3-second pickup target
- make the floor timeout configurable because strategy sources differ on the exact practical grace period
- spawn or simulate raid damage if the crystal is left unattended

Do not treat “tank durability” as immunity to the crystal mechanic.

### Transition into Phase 2

At the end of the intermission:

- suspend intermission mechanics
- re-evaluate crystal holders
- assign tanks to their Phase 2 positions
- choose the initial active tank based on threat and remaining `Impaled`
- resume Lance tracking only once the boss is active

---

## 7.3 Phase 2 — The Dark Reactor

The standard Lance swap continues while tanks also handle Galvanize and Void Core positioning.

At least one Galvanize beam targets a tank. The tank must aim it at the assigned Void Core without crossing unnecessary players.

### Crystal-holding tank in Phase 2

On Heroic, Galvanize and Lance are direct Cosmic-damage risks for a crystal holder.

Preferred strategy:

- tanks should generally not be the long-term crystal carriers during boss-active Phase 2
- transfer the crystal to an assigned non-tank when possible

If a tank still has the crystal:

#### Before Galvanize resolves

```text
DROP/TRANSFER CRYSTAL → AIM GALVANIZE → RESOLVE BEAM → RE-PICK OR LEAVE WITH NEW CARRIER
```

#### Before Heaven's Lance

```text
TRANSFER CRYSTAL IF SAFE
OR
PREPARE TEARS SOAKS + USE NORMAL LANCE DEFENSIVE
```

The tank swap still occurs after the completed Lance burst. Crystal ownership must not cause a premature taunt.

### Transition into Phase 3

At 100 energy, Dark Meltdown moves the raid into Phase 3.

Expected tank behavior:

- stack with the raid before the knockback
- do not stand alone because of tank positioning
- after landing, immediately locate the active Torchbearer safe zone
- bring or hold L'ura at the group rather than pulling the raid out of crystal light
- re-synchronize threat, Lance counter, and `Impaled`

Trainer callouts:

```text
STACK FOR MELTDOWN
LAND TOGETHER
GET INTO CRYSTAL LIGHT
SAFE TANK TAKE BOSS
```

---

## 7.4 Phase 3 — Midnight Falls

The normal Heaven's Lance swap continues.

Additional constraints:

- players outside a crystal holder's 12-yard Torchbearer aura are affected by Midnight
- a Dawn Crystal is consumed to create Dawnlight Barrier for The Dark Archangel
- crystal use is a raid survival assignment, not a tank personal defensive

### Preferred tank/crystal assignment

Prefer a non-tank crystal carrier.

Reasons:

- active tanks repeatedly take direct Cosmic damage from Heaven's Lance
- a tank may also need to move or taunt independently
- moving the crystal with a tank can unintentionally move the raid's safe zone
- consuming the tank's crystal can suddenly remove the local Torchbearer aura

### If a tank carries the crystal

The trainer must support it rather than automatically fail it.

Rules:

1. The tank may still taunt normally.
2. The tank must not move away from the raid merely to establish normal boss distance.
3. The boss should be positioned at the crystal group.
4. The other tank should remain close enough to taunt without moving the boss out of the light.
5. Heaven's Lance can trigger Tears on Heroic.
6. The raid must be ready to soak Tears close to the tank.
7. Dawnlight Barrier must only be used for the assigned Archangel cast.
8. Barrier use does not replace the tank's normal Lance mitigation.
9. Once consumed, another carrier's light must become the raid's new anchor.

### Swap while the current active tank is the Torchbearer

Correct sequence:

```text
active crystal tank mitigates full Lance set
→ off-tank taunts after impact 5
→ both tanks keep the boss inside the same safe area
→ raid does not chase a moving crystal unnecessarily
```

The crystal remains with the former active tank. Threat ownership and crystal ownership are independent state variables.

### Barrier overlap with Lance

If The Dark Archangel and Lance overlap:

- the assigned holder uses Dawnlight Barrier for the raid
- the active tank still uses active mitigation/personal cooldowns
- the off-tank still waits for the completed fifth impact
- the next safe-light location is established immediately after the crystal is consumed

Do not reward consuming a crystal solely to survive Lance.

---

## 8. Heroic Tears of L'ura simulation

On Heroic, a Dawn Crystal reacts when its holder is hit directly by Cosmic damage.

Relevant tank triggers include:

- Heaven's Lance impacts
- Galvanize
- Starsplinter when targeted or directly hit
- other qualifying direct Cosmic encounter damage

Trainer behavior:

```ts
function onDirectCosmicDamage(target: Player) {
  if (difficulty !== "HEROIC") return;
  if (!target.hasDawnCrystal) return;

  spawnTearsSoaks(target.position);
  state.pendingTearsSoaks += configuredTearsCount;
}
```

Because live encounter behavior may include spell-specific triggering or internal cooldown rules, expose this as encounter data rather than embedding assumptions in the generic trainer engine.

Suggested configuration:

```ts
interface TearsConfig {
  enabled: boolean;
  triggerMode: "PER_DAMAGE_EVENT" | "PER_ABILITY" | "ENCOUNTER_DATA";
  soakTimeoutMs: number;
  soakRadius: number;
  failureDamage: number;
}
```

For a focused tank trainer, it is sufficient to teach:

> **Holding a crystal while taking direct Cosmic tank mechanics creates extra raid responsibility and is usually avoidable.**

---

## 9. Callout priority

From highest to lowest:

1. `GET INTO CRYSTAL LIGHT`
2. `ARCHANGEL — USE ASSIGNED BARRIER`
3. `LANCE NOW — DEFENSIVE`
4. `TAUNT AFTER HIT 5`
5. `TEARS — SOAK`
6. `CRYSTAL ON FLOOR — PICK UP`
7. `GALVANIZE — AIM CORE`
8. `LANCE NEXT`
9. phase-positioning reminders

Conflicting callouts should be merged where possible:

```text
LANCE + CRYSTAL — DEFENSIVE, PREP TEARS
```

```text
MELTDOWN — STACK, THEN FIND LIGHT
```

---

## 10. Failure and recovery cases

### Premature taunt

Condition:

- boss target changes during impacts 1–4

Result:

- mark as a mechanic failure
- explain that the set should remain on one tank
- continue simulation with actual target and debuffs rather than resetting artificially

### Late taunt

Condition:

- original tank remains active after the completed set and next counter begins

Result:

- escalating warning
- fail when the same tank takes the next set with unsafe `Impaled`

### Tank death

If active tank dies during the burst:

- off-tank becomes emergency target
- require immediate threat pickup
- do not score the resulting split set as correct
- clear normal alternation and resynchronize from surviving debuffs

### Both tanks have Impaled

Choose the tank with:

1. fewer stacks
2. shortest remaining duration
3. strongest available defensive
4. otherwise the currently assigned emergency tank

Trainer callout:

```text
BOTH IMPALED — LOWEST STACKS TAKE
```

### Tank with crystal must taunt

Taunt remains higher priority than preserving a perfect crystal assignment.

Correct recovery:

```text
complete current burst
→ crystal tank taunts
→ announce Tears risk
→ transfer crystal at the next safe opportunity
```

### Crystal left on floor during transition

- preserve the crystal object across the transition if the encounter permits
- start/continue its unattended timer
- issue a high-priority pickup warning
- do not silently assign it to a tank

---

## 11. Minimal trainer scenarios

### Scenario A — Basic loop

- Phase 1
- no crystal
- Lance counter starts at 3
- player must mitigate at 5 and swap after impact 5

### Scenario B — Movement overlap

- Phase 1
- Dark Quasar active
- Lance reaches 5 during movement
- score stable movement, defensive, and post-set taunt

### Scenario C — Intermission crystal

- tank carries crystal
- tank receives Starsplinter
- expected: drop, sidestep, immediate pickup

### Scenario D — Phase 2 Galvanize

- one tank receives Galvanize
- off-tank must aim a core while maintaining swap readiness
- optional variant: targeted tank carries a crystal

### Scenario E — P2 to P3 transition

- stack for Dark Meltdown
- land as a group
- enter Torchbearer radius
- safe tank establishes threat
- no fixed Lance timer continues across the transition

### Scenario F — P3 crystal tank

- active tank is Torchbearer
- Lance reaches 5
- expected: defensive, full set, post-set taunt, stationary boss
- Heroic variant spawns Tears

### Scenario G — Barrier overlap

- The Dark Archangel overlaps Lance
- assigned holder uses barrier
- active tank still mitigates
- off-tank taunts only after final impact
- raid changes to next Torchbearer after crystal consumption

---

## 12. Acceptance criteria

The implementation is complete when:

- Lance is modeled as a five-counter trigger followed by a five-impact burst
- swaps are evaluated after the completed burst, not on a fixed timer
- `Impaled` persists independently on each tank
- all boss-unavailable transitions suspend Lance generation
- phase starts re-synchronize from observed encounter state
- tanks can own crystals without merging crystal ownership with threat ownership
- Heroic Cosmic damage can trigger Tears for tank crystal holders
- Starsplinter crystal drop/re-pick behavior is trainable
- P2 Galvanize and P3 Torchbearer positioning are represented
- Dawnlight Barrier consumption removes that crystal and requires a new safe-light anchor
- missed swaps and tank deaths recover from actual state rather than restarting the exercise

---

## 13. Research notes

Implementation assumptions are based on the current Normal/Heroic encounter journal and current strategy guides as of **31 July 2026**:

- Heaven's Lance triggers at 5 applications and delivers repeated Cosmic impacts that apply Impaled.
- Tanks swap after each completed Lance set throughout boss-active phases.
- Lance may overlap movement mechanics.
- Total Eclipse is a boss-unavailable intermission.
- A tank is one of the Phase 2 Galvanize targets.
- Dawn Crystal holders take recurring holder damage.
- On Heroic, direct Cosmic damage to a crystal holder triggers Tears of L'ura.
- Crystal holders should briefly drop the crystal before resolving Starsplinter and immediately recover it.
- In Phase 3, crystal holders provide a 12-yard safe zone and consume a crystal to create Dawnlight Barrier.
- Strategy guides differ slightly on some tuning numbers and the practical unattended-crystal grace period; these values should remain configurable.
