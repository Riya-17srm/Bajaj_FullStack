const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

function isValid(edge) {
  edge = edge.trim();
  if (!/^[A-Z]->[A-Z]$/.test(edge)) return false;
  const [p, c] = edge.split("->");
  return p !== c;
}

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];

  let invalid = [];
  let duplicate = [];
  let seen = new Set();

  let adj = {};
  let childSet = new Set();

  for (let raw of data) {
    let s = raw.trim();

    if (!isValid(s)) {
      invalid.push(raw);
      continue;
    }

    if (seen.has(s)) {
      duplicate.push(s);
      continue;
    }

    seen.add(s);

    let [p, c] = s.split("->");

    if (!adj[p]) adj[p] = [];

    if (childSet.has(c)) continue;

    adj[p].push(c);
    childSet.add(c);
  }

  let nodes = new Set();
  for (let p in adj) {
    nodes.add(p);
    adj[p].forEach(c => nodes.add(c));
  }

  function buildTree(node, visited) {
    if (visited.has(node)) return {};
    visited.add(node);

    let obj = {};
    (adj[node] || []).forEach(child => {
      obj[child] = buildTree(child, visited);
    });

    return obj;
  }

  function depth(node) {
    if (!adj[node] || adj[node].length === 0) return 1;
    return 1 + Math.max(...adj[node].map(depth));
  }

  function hasCycle(node, visited, stack) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (let c of adj[node] || []) {
      if (hasCycle(c, visited, stack)) return true;
    }

    stack.delete(node);
    return false;
  }

  let hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;

  let visitedGlobal = new Set();

  for (let node of nodes) {
    if (visitedGlobal.has(node)) continue;

    let visited = new Set();
    let stack = new Set();

    if (hasCycle(node, visited, stack)) {
      let smallest = [...visited].sort()[0];

      hierarchies.push({
        root: smallest,
        tree: {},
        has_cycle: true
      });

      visited.forEach(n => visitedGlobal.add(n));
      totalCycles++;
    } else {
      visited.forEach(n => visitedGlobal.add(n));

      if (!childSet.has(node)) {
        let tree = {};
        tree[node] = buildTree(node, new Set());

        let d = depth(node);

        hierarchies.push({
          root: node,
          tree: tree,
          depth: d
        });

        totalTrees++;
      }
    }
  }

  let maxDepth = 0;
  let largestRoot = "";

  for (let h of hierarchies) {
    if (h.depth) {
      if (
        h.depth > maxDepth ||
        (h.depth === maxDepth && h.root < largestRoot)
      ) {
        maxDepth = h.depth;
        largestRoot = h.root;
      }
    }
  }

  res.json({
    user_id: "riyasaxena_01092004",
    email_id: "rs9952@srmist.edu.in",
    college_roll_number: "RA2311003010580",
    hierarchies,
    invalid_entries: invalid,
    duplicate_edges: duplicate,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestRoot
    }
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});