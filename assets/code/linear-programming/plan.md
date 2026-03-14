# Plan: Linear Programming Lesson

## Source

`linear-programming.ipynb` — a teaching notebook covering LP theory and three worked examples using PuLP.

## Target

`content/lessons/linear-programming.md`

## Front Matter

```yaml
---
title: Linear Programming
description: Solve constrained optimization problems by defining an objective function, decision variables, and constraints.
date_created: 2026-03-13
date_updated: 2026-03-13
competencies:
  - Algorithms
  - Energy
---
```

## Lesson Structure

### `## What is Linear Programming?`

- Bold opening: define LP as a method for optimizing a linear objective subject to linear constraints.
- Three components: objective function, decision variables, constraints.
- Note that PuLP is the Python library used — wraps a compiled solver.

### Cheat Sheet

Small reference table:

| Component | What it represents | PuLP API |
|---|---|---|
| Objective | Minimize or maximize | `prob += expr` (first addition) |
| Variables | Things we can change | `LpVariable(name, lowBound, cat)` |
| Constraints | Rules we must follow | `prob += expr >= value` |

### This Lesson

Tooling install block:

```shell-session
$ pip install pulp numpy
```

Covers three examples:
1. **Diet problem** — minimize cost of fruit diet subject to nutritional requirements.
2. **Electricity dispatch** — minimize generation cost subject to meeting demand; includes scenario analysis over demand and price.
3. **Transportation problem** — minimize shipping cost from ports to markets (exercise).

### `## Diet Problem`

- Introduce the problem (two fruits, three nutrients, cost minimization).
- Show the nutrient table as a markdown table.
- Map problem to LP components.
- Single code block showing the correct version with `lowBound=0` on both variables.
- Explain sensitivity analysis as a natural next step.

### `## Electricity Dispatch`

- Introduce energy system: wind, gas, coal with price and capacity.
- Show `Asset` dataclass.
- Use consistent capacities throughout: wind=25, gas=50, coal=100. (Notebook inconsistency: initial setup used wind=100, scenario analysis used wind=25 — use 25 everywhere as it produces more interesting dispatch results.)
- Build LP: cost-minimization objective, demand-equality constraint.
- Scenario analysis: loop over demand levels `[10, 50, 100]`.
- Price sensitivity: vary coal price `[10, 50, 100]` at fixed demand=50.
- Discuss results — merit order dispatch, how price changes shift dispatch.

### `## Transportation Problem`

- Describe problem: $P$ ports with capacities, $M$ markets with demand, cost matrix.
- Map to LP components with exercise prompt and setup code.
- Provide the `ports`, `markets`, and `pm_cost` setup.
- Exercise: ask reader to write the LP.
- Solution section follows the exercise — variables as a 2D list `x[p][m]`, `lpSum` for objective and constraints, print only non-zero flows:

```python
from pulp import LpProblem, LpMinimize, LpVariable, LpStatus, lpSum

problem = LpProblem('transportation', LpMinimize)

x = [[LpVariable(f'port{p}_market{m}', 0) for m in range(len(markets))] for p in range(len(ports))]

problem += lpSum(x[p][m] * pm_cost[p][m] for p in range(len(ports)) for m in range(len(markets)))

for m in range(len(markets)):
    problem += lpSum(x[p][m] for p in range(len(ports))) >= markets[m]

for p in range(len(ports)):
    problem += lpSum(x[p][m] for m in range(len(markets))) <= ports[p]

problem.solve()
for p in range(len(ports)):
    for m in range(len(markets)):
        if (val := x[p][m].varValue) > 0:
            print(f'port {p} -> market {m}: {val:.1f}')
```

### `## Why Learn Linear Programming?`

- Used in energy systems, logistics, finance, scheduling.
- Exact optimal solution (not heuristic).
- Scales well with commercial solvers.
- Foundation for mixed-integer programming (MIP) and stochastic programming.

### `### Resources`

- [PuLP docs](https://pythonhosted.org/PuLP/)
- [Linear programming notes — Michel Goemans (MIT)](https://math.mit.edu/~goemans/18310S15/lpnotes310.pdf)

## Key Decisions / Tradeoffs

- **Drop the exercise answer stub** (`from answers import transportation`) — lesson format doesn't include answer files.
- **Drop the broken first diet example** — show only the correct version with `lowBound=0`.
- **Drop Jupyter-specific cells** (e.g. `!pip install`, `#from answers import`) — replace with `shell-session` install block and prose.
- **Scenario analysis** is presented as runnable code with expected output comments, not as interactive class exercises.
- **Carbon intensity** is dropped from the `Asset` dataclass — it is unused in any constraint and its inclusion implies something that isn't there. If a carbon cap example is added later, it can be reintroduced then.
- **`numpy`** import is placed at the top of the lesson with PuLP, not scoped to the transportation section, to keep imports predictable.
- **Include a full copy of all each example Python code at the end**
