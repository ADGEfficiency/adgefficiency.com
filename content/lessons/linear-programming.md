---
title: Linear Programming
description: Solve constrained optimization problems by defining an objective function, decision variables, and constraints.
date_created: 2026-03-13
date_updated: 2026-03-13
competencies:
  - Algorithms
  - Energy
---

## Why Learn Linear Programming?

**LP gives exact optimal solutions — not heuristics or approximations**.

- **Energy systems**: Dispatch generation to minimize cost or emissions
- **Logistics**: Route shipments to minimize transport cost
- **Finance**: Portfolio optimization under risk constraints
- **Scheduling**: Assign resources to tasks within time and capacity limits

LP scales well with commercial solvers and is the foundation for mixed-integer programming (MIP) and stochastic programming.

## What is Linear Programming?

**Linear programming (LP) is a method for finding the best outcome in a mathematical model where the objective and constraints are linear**.

Every linear program has three components:

- **Objective function**: What we want to minimize or maximize
- **Decision variables**: The things we can change
- **Constraints**: Rules we must follow

PuLP is a Python library for building linear programs. It wraps a compiled solver, letting us focus on defining the problem rather than the mechanics of solving it.

### This Lesson

```shell-session
$ pip install pulp numpy
```

This lesson covers three examples:

1. **Diet problem**: Minimize cost of a fruit diet subject to nutritional requirements
2. **Electricity dispatch**: Minimize generation cost subject to meeting demand, with scenario analysis over demand and price
3. **Transportation problem**: Minimize shipping cost from ports to markets (exercise)

## Diet Problem

Adapted from [Linear programming - Michel Goemans](https://math.mit.edu/~goemans/18310S15/lpnotes310.pdf).

We live in a civilization with two types of fruit (apples and oranges) and three types of nutrients (starch, proteins, vitamins).  We want a diet that is cheap while satisfying our dietary requirements of 8g of starch, 15g of proteins, and 3g of vitamins per day.

| | Starch [kg/kg] | Proteins [kg/kg] | Vitamins [kg/kg] | Cost [\$/g] |
|---|---|---|---|---|
| apples | 5 | 4 | 2 | 0.6 |
| oranges | 7 | 2 | 1 | 0.35 |

**Mapping this to LP components**:

- **Objective**: Minimize the cost of our diet
- **Variables**: The amount of apples and oranges we eat
- **Constraints**: Daily requirements of starch, protein, and vitamins

```python
from pulp import LpProblem, LpMinimize, LpVariable, LpStatus

prob = LpProblem('diet-cost-minimization', LpMinimize)
apples = LpVariable('apples', cat='Integer', lowBound=0)
oranges = LpVariable('oranges', cat='Integer', lowBound=0)

prob += apples * 0.6 + oranges * 0.35

prob += apples * 5 + oranges * 7 >= 8
prob += apples * 4 + oranges * 2 >= 15
prob += apples * 2 + oranges * 1 >= 3

prob.solve()
print(f'Problem is {LpStatus[prob.status]}, your diet cost is {prob.objective.value()}')
for v in (apples, oranges):
    print(f'{v.name}: {v.varValue}')
#  Problem is Optimal, your diet cost is 2.4
#  apples: 4.0
#  oranges: 0.0
```

Setting `lowBound=0` on our variables is important — without it the solver can use negative quantities of fruit to satisfy constraints, which is not physically meaningful.

**With a working model, sensitivity analysis is a natural next step** — varying costs or nutritional requirements to see how the optimal diet changes.

## Electricity Dispatch

We have three assets in our electricity grid — a wind turbine, a gas turbine, and a coal plant:

```python
from dataclasses import dataclass
from pulp import LpProblem, LpMinimize, LpVariable, LpStatus

@dataclass
class Asset:
    name: str
    price: float
    limit: int

assets = [
    Asset('wind', 30, 25),
    Asset('gas', 70, 50),
    Asset('coal', 50, 100),
]
```

We want to minimize the total cost of generation while meeting a demand constraint:

```python
problem = LpProblem('cost-minimization', LpMinimize)
variables = [LpVariable(a.name, 0, a.limit) for a in assets]

problem += sum(a.price * v for a, v in zip(assets, variables))

demand = 10
problem += sum(variables) == demand

problem.solve()
print(LpStatus[problem.status])
for v in variables:
    print(f'{v.name} {v.varValue}')
#  Optimal
#  wind 10.0
#  gas 0.0
#  coal 0.0
```

At low demand, the solver dispatches only wind — it's the cheapest asset.

### Scenario Analysis — Demand

Looping over different demand levels shows how the dispatch changes:

```python
for demand in [10, 50, 100]:
    problem = LpProblem('cost-minimization', LpMinimize)
    assets = [
        Asset('wind', 30, 25),
        Asset('gas', 70, 50),
        Asset('coal', 50, 100),
    ]
    variables = [LpVariable(a.name, 0, a.limit) for a in assets]

    problem += sum(a.price * v for a, v in zip(assets, variables))
    problem += sum(variables) == demand
    problem.solve()
    print(f'demand={demand}')
    for v in variables:
        print(f'  {v.name} {v.varValue}')
#  demand=10
#    wind 10.0
#    gas 0.0
#    coal 0.0
#  demand=50
#    wind 25.0
#    gas 0.0
#    coal 25.0
#  demand=100
#    wind 25.0
#    gas 0.0
#    coal 75.0
```

**The solver follows merit order dispatch** — it fills from cheapest to most expensive. Wind dispatches first, then coal, then gas.  Gas is more expensive than coal, so it only dispatches when wind and coal capacity are exhausted.

### Scenario Analysis — Price

Varying the coal price at fixed demand shows how price changes shift dispatch:

```python
demand = 50
for coal_price in [10, 50, 100]:
    problem = LpProblem('cost-minimization', LpMinimize)
    assets = [
        Asset('wind', 30, 25),
        Asset('gas', 70, 50),
        Asset('coal', coal_price, 100),
    ]
    variables = [LpVariable(a.name, 0, a.limit) for a in assets]

    problem += sum(a.price * v for a, v in zip(assets, variables))
    problem += sum(variables) == demand
    problem.solve()
    print(f'coal_price={coal_price}')
    for v in variables:
        print(f'  {v.name} {v.varValue}')
#  coal_price=10
#    wind 0.0
#    gas 0.0
#    coal 50.0
#  coal_price=50
#    wind 25.0
#    gas 0.0
#    coal 25.0
#  coal_price=100
#    wind 25.0
#    gas 25.0
#    coal 0.0
```

When coal is cheap at 10/MWh, it undercuts wind and takes all the dispatch. At 50/MWh, wind and coal split the load.  **When coal becomes expensive at 100/MWh, gas replaces it entirely** — the merit order has shifted.

## Transportation Problem

**P** ports each have a capacity measured in units.  **M** markets each have a demand measured in units.  Each port-market pair has a transport cost.

**We want to find the lowest cost way to supply all market demands from our ports**.

Mapping to LP components:

- **Objective**: Minimize total transport cost
- **Variables**: Amount shipped from each port to each market
- **Constraints**: Each market's demand must be met, each port's capacity cannot be exceeded

### Setup

```python
import numpy as np

ports = [20, 30, 30, 50]
markets = [20, 10, 5]

np.random.seed(42)
pm_cost = np.random.uniform(0, 1, size=len(ports) * len(markets)).reshape(len(ports), len(markets))
```

We can access the cost to ship from a port to a market by indexing `pm_cost[port, market]`:

```python
pm_cost[0, 0]
#  0.3745401188473625

pm_cost[3, 2]
#  0.1560186404424365
```

### Exercise

Write a linear program to find the lowest cost combination of port-to-market shipments.

### Solution

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
#  port 0 -> market 0: 20.0
#  port 2 -> market 1: 10.0
#  port 3 -> market 2: 5.0
```

## Solvers vs. Solver Libraries

**A solver is the engine that finds the optimal solution — a solver library is the Python interface you use to define the problem**.

A solver is a compiled, optimized program that implements algorithms like simplex or interior point methods.  A solver library lets you define decision variables, objectives, and constraints in Python, then passes the problem to a solver.

PuLP, Pyomo, and OR-Tools are solver libraries.  GLPK, CBC, CPLEX, and Gurobi are solvers.  Most solver libraries can talk to multiple solvers — you can define a problem in PuLP and solve it with CBC for free or switch to Gurobi for better performance on large problems.

## LP vs. Mixed-Integer Programming

**When all decision variables are continuous, you have a linear program (LP). When some variables must be integers, you have a mixed-integer program (MIP)**.

The distinction matters because LPs are fast to solve — the simplex algorithm finds an optimal solution in polynomial time in practice. MIPs are much harder because the solver must search over combinations of integer values, which can be exponentially slower.

In this lesson, the electricity dispatch and transportation problems are pure LPs — all variables are continuous quantities.  The diet problem is a MIP because we set `cat='Integer'` on the apple and orange variables, forcing the solver to find whole-number quantities of fruit.

**In PuLP, the only difference is the `cat` parameter** on `LpVariable` — set `'Continuous'` (the default) for LP or `'Integer'` for MIP.

## Summary

**Every linear program has the same three components — once you can identify them in a domain problem, the solver does the rest**.

- **Objective function**: What to minimize or maximize
- **Decision variables**: The things we can change
- **Constraints**: Rules we must follow

### PuLP Cheat Sheet

| Component | What it represents | PuLP API |
|---|---|---|
| Objective | Minimize or maximize | `prob += expr` (first addition) |
| Variables | Things we can change | `LpVariable(name, lowBound, cat)` |
| Constraints | Rules we must follow | `prob += expr >= value` |

### Resources

- [PuLP docs](https://coin-or.github.io/pulp/)
- [Pyomo docs](https://www.pyomo.org/)
- [Google OR-Tools](https://developers.google.com/optimization)
- [scipy.optimize.linprog](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linprog.html)
- [Linear programming notes — Michel Goemans (MIT)](https://math.mit.edu/~goemans/18310S15/lpnotes310.pdf)

Thanks for reading!
