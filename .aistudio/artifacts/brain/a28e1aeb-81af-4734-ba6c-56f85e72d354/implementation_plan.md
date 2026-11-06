# Smart Stage System: Procedural Map Layout & Threat-Budget Encounters

Procedural multi-path branching stage map generation with risk-reward routes, coupled with an expanded catalog of pre-designed tactical encounters governed by a threat-budget and synergy-archetype allocation engine.

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural direction was confirmed via Phase 1 clarification:
> - **Procedural Map Scope**: Procedural map layout and route topology generation, pairing nodes dynamically with pre-designed, hand-crafted enemy encounters.
> - **Encounter Balancing**: Threat-budget system matching stage tier and route difficulty with curated tactical synergy archetypes.
> - **Navigation & Topology**: Multi-path branching directed acyclic graph (DAG) offering distinct high-risk/high-reward routes and safe utility trails.

- **Confirmed Decision 1**: Pre-designed enemy encounters cataloged by tactical archetype (e.g., *Frontline & Backline Buffer*, *Skirmisher Swarm*, *Cursed Artillery*, *Armored Patrol*) and threat budget (ratings 1–5).
- **Confirmed Decision 2**: Procedural map generation builds dynamic multi-lane graphs per Act using deterministic seed-based RNG, guaranteeing route connectivity, path divergence, and climax convergence.
- **Confirmed Decision 3**: Map UI upgraded with Austro-Hungarian cartographic styling, route connection lines (SVG paths between linked nodes), and risk-reward intelligence tags.

---

## 1. Overview & Core Concept

### What It Does
Replaces the static 6-step linear encounter sequence with an intelligent, seed-driven procedural stage map. Each Act constructs a branching directed acyclic graph (DAG) of 6–7 tiers featuring distinct strategic lanes (e.g., an aggressive *High-Risk Vanguard* path filled with Elites and Workshops vs. a cautious *Catacomb Bypass* packed with Events and Pubs). Encounter nodes draw dynamically from a rich taxonomy of pre-designed tactical encounters based on the node's tier budget and route difficulty.

### Target Audience & Persona
Players seeking deep roguelike deckbuilding strategy where macro-navigation (choosing when to risk taking an Elite path for better relics vs. visiting a Pub to heal) is just as consequential as tactical 1D combat positioning.

### Key Value
- **High Replayability**: Every run and seed produces unique route topography and varied tactical combat puzzles.
- **Meaningful Agency**: Clear risk vs. reward trade-offs before entering each sector.
- **Tactical Depth**: Combats present deliberate enemy synergies rather than random mismatched spawns.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Act Initiation / Map Entry**: Upon starting a run or advancing an Act, the player is presented with the *C. a k. Katastrální revírní mapa* (Imperial Cadastral Sector Map). The starting tier highlights valid entry points.
2. **Route Reconnaissance**: The player inspects branching routes. Connection lines illuminate which downstream nodes are reachable. Node cards show tactical risk indicators (threat level, expected encounter archetype, and reward incentives).
3. **Sector Selection & Engagement**: Selecting an available node commits the Hunter to that sector (battle, pub, workshop, event, or treasure). Active paths remain clearly distinguishable from locked or completed routes.
4. **Forking Progression**: After victorious combat or sector resolution, the map returns with downstream connected nodes unlocked for the next tier.
5. **Act Climax**: All navigable branches converge onto the Act Boss chamber.

### Visual Identity & Theme
- **Aesthetic Direction**: 19th-century Austro-Hungarian cartography, imperial military reconnaissance blueprints, and antique surveyor parchment.
- **Color Palette & Atmosphere**:
  - Dominant canvas: Deep sepia / aged parchment (`#1A1412` dark parchment base, `#2A1F1A` card containers).
  - Structural lines: Muted antique gold and brass connection paths (`#A37C44` active paths, `#4A3B32` inactive connections).
  - Accent colors: Imperial crimson stamp (`#991B1B`) for Elites/Bosses, amber wax seal (`#D97706`) for Treasures/Events, sage green (`#15803D`) for Pubs/Workshops.
- **Typography & Hierarchy**:
  - Display headers: High-contrast serif with letter-spaced imperial grandeur.
  - Node metadata: Clean unboxed typography with bullet/separator dots (`·`), strictly avoiding generic pill badges.
- **Interactive Feedback & Cartography Canvas**:
  - SVG bezier connection rails drawn between interconnected nodes, glowing when traversed.
  - Hover micro-interactions highlighting future branching possibilities.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Pre-Designed Encounters with Threat-Budget Allocation vs. Pure Random Spawning
- **Chosen Approach**: Hand-craft a diverse library of 25+ themed tactical encounters across Acts 1–3, tagged with tactical archetypes (*Swarm Ambush*, *Iron Shieldwall*, *Blood Ritualist & Thralls*, *Crossfire Battery*) and assigned integer Threat Ratings (1 to 5). The stage generator selects encounters matching the node's allocated tier budget.
- **Why**: Pure procedural enemy placement frequently produces unplayable soft-locks (e.g., three flying units trapping the player without ranged tiles) or trivial pushovers. Hand-crafted tactical synergies ensure every fight feels like a bespoke tactical challenge while procedural selection guarantees variety.
- **Alternatives Considered**: Fully randomized enemy/terrain generation was considered, but rejected to maintain tight tactical balance and historical Czech/Austro-Hungarian satirical flavor.

### Decision 2: Directed Acyclic Graph (DAG) with Lane Interpolation vs. Fixed Grid
- **Chosen Approach**: Generate a forward-flowing DAG with 6 tiers. Each tier contains 2 to 3 nodes distributed across virtual lanes (Left, Center, Right). An edge-routing algorithm connects nodes forward while preventing crossing lines and ensuring that every path reaches the boss.
- **Why**: Provides the classic roguelike feel (reminiscent of *Slay the Spire* / *FTL*) while guaranteeing zero dead ends and deterministic seed reproducibility.

### Decision 3: Route Archetypes (Risk-Reward Specialization)
- **Chosen Approach**: Tag lanes with route identities (e.g., *Cesta cti a chřtánu* with high threat, extra elite, and double gold/talisman rewards vs. *Bylinkářský úvoz* with lower threat and guaranteed pub/workshop).
- **Why**: Gives strategic weight to path selection based on current deck strength and hero HP.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Run Engine (run.js)                           │
│  - Seeded PRNG                                                          │
│  - generateActMap(run, act):                                            │
│    ├── generateGraphTopology(act, rng) -> Nodes & Edges (DAG)           │
│    ├── assignRouteArchetypes(topology, rng)                             │
│    └── allocateThreatEncounters(nodes, act, rng)                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Encounters Registry & Budget                        │
│                         (encounters.js)                                 │
│  - ENCOUNTERS catalog categorized by Act, Archetype, & Threat (1-5)    │
│  - pickEncounterForNode(act, nodeType, threatBudget, rng, usedIds)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Map Screen View (mapScreen.js)                     │
│  - SVG Connection Rails (draws bezier curves between connected nodes)   │
│  - Interactive Node Cards with unboxed threat & reward intelligence     │
│  - Responsive Tier Columns & Active Route Highlighting                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

```typescript
interface MapNode {
  id: string;               // e.g. "a1_t2_n1"
  tier: number;             // 0 to 5
  lane: number;             // 0 = Left, 1 = Center, 2 = Right
  type: NodeType;           // BATTLE | ELITE | PUB | WORKSHOP | EVENT | TREASURE | BOSS
  title: string;            // Thematic sector title
  routeTag?: string;        // e.g. "Vysoké riziko", "Zásobovací stezka"
  threatRating: number;     // 1 to 5 (or 6 for Boss)
  encounterId: string | null;
  archetype?: string;       // e.g. "shieldwall", "swarm", "snipers"
  next: string[];           // Forward connected node IDs
  prev: string[];           // Backward parent node IDs
}

interface EncounterDefinition {
  id: string;
  act: number;
  name: string;
  backgroundTheme: string;
  threatRating: number;     // 1 (starter) to 5 (extreme elite)
  archetype: 'swarm' | 'shieldwall' | 'snipers' | 'disruption' | 'ambush' | 'boss';
  isElite?: boolean;
  isBoss?: boolean;
  boardSize?: number;
  heroCell?: number;
  heroFacing?: number;
  initialEnemies: Array<{ enemyId: string; cell: number; facing: number }>;
  props?: Array<{ type: string; cell: number }>;
  terrain?: Array<{ type: string; cell: number }>;
  reinforcements?: Array<{
    turnDelay: number;
    gateCell: number;
    enemyId: string;
    candidatePool: string[];
  }>;
  goldReward: number;
}
```

### Key Implementation Steps
1. **Encounter Library Expansion (`src/game/config/encounters.js`)**:
   - Expand the pre-designed encounter roster from ~10 to 24+ tactical scenarios across Acts 1, 2, and 3.
   - Tag each encounter with `threatRating`, `archetype`, and thematic descriptions.
   - Implement helper `queryEncounters({ act, isElite, minThreat, maxThreat, excludeIds })`.
2. **Procedural Graph Generator (`src/game/engine/run.js`)**:
   - Implement `generateProceduralActGraph(run, act)` using seeded RNG.
   - Build a 6-tier DAG where Tier 0 has 1–2 entry points, Tiers 1–4 have 2–3 branching nodes with distinct risk/reward routes, and Tier 5 culminates in the Act Boss.
   - Add threat budget scaling (Tier 0: Threat 1, Tier 1: Threat 1–2, Tier 2: Threat 2–3, Tier 3: Threat 3–4 or Elite Threat 4–5, Tier 4: Utility nodes + Threat 4, Tier 5: Boss).
   - Ensure guaranteed forward pathing with backward/forward edge validation.
3. **Map Screen Visualization (`src/game/ui/mapScreen.js` & `src/game/styles/ui.css`)**:
   - Render SVG curved connection rails connecting node coordinates directly on the cadastral parchment.
   - Update node cards to display tactical intelligence: encounter archetype preview, threat meter (subtle skulls/stamps), and unboxed metadata.
   - Maintain strict adherence to zero-pill guidelines and the 60-30-10 color budget.
4. **Integration Verification & Invariant Testing**:
   - Run verification test scripts checking graph connectivity across 100+ random seeds to verify that no node is orphaned and all paths reach the boss.
