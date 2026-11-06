import assert from 'node:assert/strict';
import { createNewRun, generateActMap, getAvailableNodes, ROUTE_ARCHETYPES } from '../src/game/engine/run.js';
import { ENCOUNTERS, queryEncounters } from '../src/game/config/encounters.js';
import { createBattleState } from '../src/game/engine/state.js';
import { NODE_TYPES } from '../src/game/config/constants.js';

console.log('=== TEST: Smart Stage System & Procedural Random Generation ===');

// 1. Verify Encounters Catalog
{
  const totalEncounters = Object.keys(ENCOUNTERS).length;
  console.log(`Total pre-designed encounters registered: ${totalEncounters}`);
  assert.ok(totalEncounters >= 20, 'Should have at least 20 pre-designed encounters');

  for (const [id, enc] of Object.entries(ENCOUNTERS)) {
    assert.equal(enc.id, id, `Encounter ${id} id must match key`);
    assert.ok([1, 2, 3].includes(enc.act), `Encounter ${id} must have valid act (1, 2, or 3)`);
    assert.ok(enc.threatRating >= 1 && enc.threatRating <= 6, `Encounter ${id} must have threat rating 1-6`);
    assert.ok(enc.archetype, `Encounter ${id} must have an archetype`);
    assert.ok(enc.name, `Encounter ${id} must have a name`);
    assert.ok(Array.isArray(enc.initialEnemies) && enc.initialEnemies.length > 0, `Encounter ${id} must have initial enemies`);
  }
  console.log('✓ 1. Pre-designed encounters catalog integrity verified');
}

// 2. Verify Intelligent Encounter Querying & Threat Scoring
{
  const enc1 = queryEncounters({ act: 1, threatTarget: 1, preferredArchetype: 'swarm' });
  assert.ok(enc1, 'Should find encounter for Act 1 Threat 1');
  assert.equal(enc1.act, 1);
  assert.ok(enc1.threatRating <= 2);

  const eliteAct2 = queryEncounters({ act: 2, isElite: true });
  assert.ok(eliteAct2, 'Should find elite encounter for Act 2');
  assert.equal(eliteAct2.act, 2);
  assert.equal(eliteAct2.isElite, true);

  const bossAct3 = queryEncounters({ act: 3, isBoss: true });
  assert.ok(bossAct3, 'Should find boss encounter for Act 3');
  assert.equal(bossAct3.isBoss, true);
  assert.equal(bossAct3.id, 'act3_boss');

  console.log('✓ 2. Encounter query engine and threat-matching verified');
}

// 3. Verify DAG Topography & Reachability Across 50 Seeds
{
  const seeds = ['VENCA-1899', 'SLAVIE-1901', 'SOKOL-PRAGUE', 'TEST-SEED-1', 'DRACULA-KILLER', 'TEST-SEED-999'];
  for (let i = 0; i < 50; i++) {
    seeds.push(`SEED_BATCH_${i}`);
  }

  for (const seed of seeds) {
    for (const act of [1, 2, 3]) {
      const run = createNewRun(seed, 'classic', 0);
      const map = generateActMap(run, act);

      assert.equal(map.act, act);
      assert.ok(map.nodes.length >= 10, 'Act map should contain at least 10 nodes');

      const tierMap = new Map();
      for (const node of map.nodes) {
        if (!tierMap.has(node.tier)) tierMap.set(node.tier, []);
        tierMap.get(node.tier).push(node);
      }

      // 6 Tiers: 0 to 5
      for (let t = 0; t <= 5; t++) {
        assert.ok(tierMap.has(t) && tierMap.get(t).length > 0, `Tier ${t} must have at least 1 node (Seed: ${seed}, Act: ${act})`);
      }

      // Check Boss is at Tier 5
      const bossNodes = tierMap.get(5);
      assert.equal(bossNodes.length, 1, 'Tier 5 must have exactly 1 Boss node');
      assert.equal(bossNodes[0].type, NODE_TYPES.BOSS, 'Tier 5 node must be of type BOSS');

      // Forward Connectivity (Invariant 1: Every node in T < 5 has at least 1 outgoing next edge)
      for (let t = 0; t < 5; t++) {
        for (const n of tierMap.get(t)) {
          assert.ok(n.next.length >= 1, `Node ${n.id} in Tier ${t} must have at least 1 outgoing edge`);
          // Target nodes must be in tier t + 1
          for (const targetId of n.next) {
            const targetNode = map.nodes.find((x) => x.id === targetId);
            assert.ok(targetNode, `Target node ${targetId} must exist`);
            assert.equal(targetNode.tier, t + 1, `Target node ${targetId} must be in next tier`);
          }
        }
      }

      // Backward Connectivity (Invariant 2: Every node in T > 0 has at least 1 incoming prev edge)
      for (let t = 1; t <= 5; t++) {
        for (const n of tierMap.get(t)) {
          assert.ok(n.prev.length >= 1, `Node ${n.id} in Tier ${t} must have at least 1 incoming edge`);
          for (const sourceId of n.prev) {
            const sourceNode = map.nodes.find((x) => x.id === sourceId);
            assert.ok(sourceNode, `Source node ${sourceId} must exist`);
            assert.equal(sourceNode.tier, t - 1, `Source node ${sourceId} must be in previous tier`);
          }
        }
      }

      // Solvability / Full Reachability to Boss:
      // Starting from all Tier 0 nodes, can we reach the Boss?
      const reachable = new Set();
      function traverse(nodeId) {
        if (reachable.has(nodeId)) return;
        reachable.add(nodeId);
        const node = map.nodes.find((x) => x.id === nodeId);
        if (node && node.next) {
          for (const nxt of node.next) traverse(nxt);
        }
      }
      for (const entryNode of tierMap.get(0)) {
        traverse(entryNode.id);
      }
      assert.ok(reachable.has(bossNodes[0].id), `Boss ${bossNodes[0].id} must be reachable from Tier 0 (Seed: ${seed})`);

      // All nodes in the map must be reachable from Tier 0
      for (const node of map.nodes) {
        assert.ok(reachable.has(node.id), `Node ${node.id} must be reachable from Tier 0`);
      }

      // Check Planar Non-Crossing Edge Invariant
      for (let t = 0; t < 5; t++) {
        const curNodes = tierMap.get(t);
        const nxtById = new Map(tierMap.get(t + 1).map((x) => [x.id, x]));
        for (let i = 0; i < curNodes.length; i++) {
          for (let j = i + 1; j < curNodes.length; j++) {
            const u1 = curNodes[i];
            const u2 = curNodes[j];
            for (const v1Id of u1.next) {
              for (const v2Id of u2.next) {
                const v1 = nxtById.get(v1Id);
                const v2 = nxtById.get(v2Id);
                assert.ok(
                  !(u1.lane < u2.lane && v1.lane > v2.lane) &&
                    !(u1.lane > u2.lane && v1.lane < v2.lane),
                  `Edges (${u1.id}->${v1Id}) and (${u2.id}->${v2Id}) must not cross!`
                );
              }
            }
          }
        }
      }

      // Check Markov Path-Pacing Invariant (no identical consecutive utility nodes)
      const nodeById = new Map(map.nodes.map((x) => [x.id, x]));
      const utilityTypes = new Set([
        NODE_TYPES.PUB,
        NODE_TYPES.WORKSHOP,
        NODE_TYPES.EVENT,
        NODE_TYPES.TREASURE
      ]);
      for (const node of map.nodes) {
        if (utilityTypes.has(node.type)) {
          for (const prevId of node.prev) {
            const prevNode = nodeById.get(prevId);
            assert.notEqual(
              prevNode.type,
              node.type,
              `Utility node ${node.id} (${node.type}) must not immediately follow identical utility node ${prevNode.id}`
            );
          }
        }
      }

      // Check combat nodes have valid encounterId
      for (const node of map.nodes) {
        if (node.type === NODE_TYPES.BATTLE || node.type === NODE_TYPES.ELITE || node.type === NODE_TYPES.BOSS) {
          assert.ok(node.encounterId, `Combat node ${node.id} must have an encounterId`);
          assert.ok(ENCOUNTERS[node.encounterId], `Encounter ${node.encounterId} must exist in ENCOUNTERS`);
          assert.ok(node.threatRating >= 1, `Combat node ${node.id} must have threat rating`);
        }
      }
    }
  }
  console.log('✓ 3. Planar non-crossing DAG topology, Markov path-pacing, and 100% reachability verified across 50 seeds');
}

// 4. Verify Map Navigation & Run State Integration
{
  const run = createNewRun('VENCA-PLAYTEST-1', 'classic', 0);
  assert.equal(run.act, 1);
  assert.equal(run.currentNodeId, null);

  // Available nodes at start must be Tier 0
  const startAvail = getAvailableNodes(run);
  assert.equal(startAvail.length, 1);
  assert.equal(startAvail[0].tier, 0);

  // Select start node
  const startNode = startAvail[0];
  run.currentNodeId = startNode.id;
  run.completedNodeIds.push(startNode.id);

  // Now available nodes must be startNode.next
  const nextAvail = getAvailableNodes(run);
  assert.ok(nextAvail.length >= 1);
  assert.ok(nextAvail.every((n) => startNode.next.includes(n.id)));
  assert.ok(nextAvail.every((n) => n.tier === 1));

  // Battle state creation from picked node
  const battleState = createBattleState({
    seed: `${run.seed}_${startNode.id}`,
    encounterId: startNode.encounterId,
    hunterId: 'venca'
  });
  assert.ok(battleState, 'Battle state should be created cleanly');
  assert.equal(battleState.status, 'playing');
  assert.ok(battleState.hero, 'Hero entity must exist');
  assert.ok(battleState.enemies.length > 0, 'Enemies must exist');
  console.log('✓ 4. Map traversal and battle state initiation verified');
}

console.log('=== ALL SMART STAGE SYSTEM TESTS PASSED! ===');

