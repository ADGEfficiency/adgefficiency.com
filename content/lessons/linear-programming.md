---
title: Linear Programming
description: Solve constrained optimization problems by defining an objective function, decision variables, and constraints.
date_created: 2026-03-13
date_updated: 2026-03-13
competencies:
  - Optimization
  - Energy
---

## What is Linear Programming?

**Linear programming (LP) is a method for finding optimal solutions to problems that can be expressed as linear relationships**.  

It's applicable to any problem that can be approximated as linear - in practice it's used widely across many domains, from supply chain management to energy systems.

Every linear program has three components:

1. **Objective**: The thing we want to make big (maximize) or small (minimize)
2. **Variables**: Things we can change
3. **Constraints**: Limits on how we can change variables, rules we must follow

## What is Mixed Integer Linear Programming?

**Mixed-integer linear programming (MILP) is a type of linear programming where some decision variables are constrained to be integers**.  When all decision variables are continuous, you have a linear program (LP). When some must be integers, you have a mixed-integer program (MIP).

Integer variables let you model discrete choices — how many units to produce, whether to build a facility, or which routes to activate.  This makes MILP a much more expressive modelling tool than LP, so many practical optimization problems end up as MILPs.

The trade-off is speed.  LPs are fast to solve — the simplex algorithm finds an optimal solution in polynomial time in practice.  MIPs are harder because the solver must search over combinations of integer values, which can be exponentially slower.

In this lesson, the electricity dispatch and transportation problems are pure LPs — all variables are continuous quantities.  The diet problem is a MIP because we set `cat='Integer'` on the apple and orange variables, forcing the solver to find whole-number quantities of fruit.

## What Do We Mean By Linear?

Linearity concerns how things change.  In a linear system, the system changes at the same rate at all points, while in a nonlinear system, the system changes at different rates at different points.

A linear program assumes no non-linear relationships exist — or that any non-linear relationship can be adequately approximated by a linear one.

For working with linear programs, the linear restriction means that:

- No variable can be multiplied by another variable (e.g. `x * y` is not linear)
- No variable can be raised to a power (e.g. `x^2` is not linear)
- No discontinuous functions (e.g. `if x > 5: ...` is not linear)

No discontinuous functions is a big restriction on how you can write a program - it means no `if` statements in the linear program (note - this does not mean no `if` statements in your code!).

You can use `if` statements in your Python code to build different versions of the problem — you just can't use them inside the optimization model itself:

```python
# OK - Python if statement decides which constraint to add
if include_capacity_limit:
    problem += generation <= 100

# OK - Python if statement decides which objective to use
if minimize_cost:
    problem += cost
else:
    problem += -revenue
```

```python
# NOT OK - conditional logic inside the optimization
# "if generation > 50, then price = 30" is a discontinuous function
# and cannot be expressed as a linear constraint
problem += price == 30 if generation > 50 else 50
```

The first examples are fine because Python evaluates the `if` before the solver runs — the solver only sees the resulting linear constraints.  The second is not linear because the solver would need to evaluate a conditional during optimization.

## Why Learn Mixed Integer Linear Programming?

Mixed integer linear programming is a technique I picked up during my chemical engineering Masters degree - it's been the most useful optimization technique I've learned.  I've used it at every company I've worked at - across large energy utilities and at small startups.

Unlike more general optimization methods (such as gradient descent), LP is guaranteed to find a global optimum, and practically runs deterministically.

- **Global optimum**: LP & MILP solvers find the best solution, not just a local one
- **Fast**: LP solves in polynomial time in practice, even for large problems
- **Deterministic**: Given the same problem, LP & MILP solvers always return the same solution

## Solvers vs. Solver Libraries

**A solver is the engine that finds the optimal solution — a solver library is the Python interface you use to define the problem**.

A solver is a compiled, optimized program that implements algorithms like simplex or interior point methods.  A solver library lets you define decision variables, objectives, and constraints in Python, then passes the problem to a solver.

PuLP, Pyomo, and OR-Tools are solver libraries.  GLPK, CBC, CPLEX, and Gurobi are solvers.  Most solver libraries can talk to multiple solvers — you can define a problem in PuLP and solve it with CBC for free or switch to Gurobi for better performance on large problems.

### This Lesson

This lesson will show you how to create and solve linear programs in Python using PuLP.

Install the following Python packages to run the examples.

```shell-session
$ pip install pulp==3.3.0 numpy==2.4.3
```

This lesson covers three examples:

1. **Electricity Asset Dispatch**: Minimize generation cost subject to meeting demand, with scenario analysis over demand and price
2. **Diet Cost Minimization**: Minimize cost of a fruit diet subject to nutritional requirements
3. **Cargo Assignment**: Minimize shipping cost from ports to markets (worked example)

### Resources

Tutorials:

- [Linear Programming Tricks - AIMMS Modeling Guide](https://download.aimms.com/aimms/download/manuals/AIMMS3OM_LinearProgrammingTricks.pdf)
- [Linear programming notes — Michel Goemans (MIT)](https://math.mit.edu/~goemans/18310S15/lpnotes310.pdf)

Solver libraries:

- [PuLP docs](https://coin-or.github.io/pulp/)
- [Pyomo docs](https://www.pyomo.org/)
- [Google OR-Tools](https://developers.google.com/optimization)
- [scipy.optimize.linprog](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linprog.html)

## PuLP Cheat Sheet

| Component   | Represents                            | PuLP API                          |
|-------------|---------------------------------------|-----------------------------------|
| Objective   | Thing we want to minimize or maximize | `prob += expr`                    |
| Variables   | Things we can change                  | `LpVariable(name, lowBound, cat)` |
| Constraints | Rules we must follow                  | `prob += expr >= value`           |

## Example - Electricity Dispatch

Our first example is a simplified electricity dispatch problem.  We have a demand for electricity that we need to meet, and we have several assets that can generate electricity at different costs and with different capacity limits.  We want to find the cheapest way to meet our demand.

We have three assets in our electricity grid — a wind turbine, a gas turbine, and a coal plant.

If we map this problem onto our three components, we have:

1. **Objective**: Minimize total generation cost
2. **Variables**: How much electricity to generate from each asset
3. **Constraints**: Total generation must meet demand, asset minimum and maximum capacities

We will define these three assets using a `dataclass`, which serves to document our program better than a list of dictionaries would:

```python
import dataclasses

import pulp


@dataclasses.dataclass
class Asset:
    name: str
    price: float
    limit: int


assets = [
    Asset("wind", 30, 25),
    Asset("gas", 70, 50),
    Asset("coal", 50, 100),
]
```

We can then build a LP to minimize the total cost of generation while meeting a demand constraint:

```python
# create the linear programming optimization problem
problem = pulp.LpProblem("cost-minimization", pulp.LpMinimize)

# decision variables - things we can change
# note that these variables contain upper and lower bounds, which are constraints
variables = [pulp.LpVariable(a.name, 0, a.limit) for a in assets]

# constraint that total electricity generation is equal to demand
demand = 10
problem += sum(variables) == demand

# objective function
problem += sum(a.price * v for a, v in zip(assets, variables))

# solve and inspect results
problem.solve()
print(pulp.LpStatus[problem.status])
for v in variables:
    print(f"{v.name} {v.varValue}")
```

```output
Optimal
wind 10.0
gas 0.0
coal 0.0
```

At low demand of `10`, the solver dispatches only wind — it's the cheapest asset.

### Scenario Analysis — Demand

Now we have a functional program, we can use it to do scenario analysis.

We do this by assuming different amounts of demand (which changes how our constraint works), and seeing how our program generates electricity:

```python
for demand in [10, 50, 100]:
    problem = pulp.LpProblem("grid_dispatch", pulp.LpMinimize)
    assets = [
        Asset("wind", 30, 25),
        Asset("gas", 70, 50),
        Asset("coal", 50, 100),
    ]
    variables = [pulp.LpVariable(a.name, 0, a.limit) for a in assets]

    problem += sum(a.price * v for a, v in zip(assets, variables))
    problem += sum(variables) == demand
    problem.solve()
    print(f"demand={demand}")
    for v in variables:
        print(f"  {v.name} {v.varValue}")
    print("")
```

```output
demand=10
  wind 10.0
  gas 0.0
  coal 0.0

demand=50
  wind 25.0
  gas 0.0
  coal 25.0

demand=100
  wind 25.0
  gas 0.0
  coal 75.0

```

**The solver follows merit order dispatch** — it fills from cheapest to most expensive. Wind dispatches first, then coal, then gas.  Gas is more expensive than coal, so it only dispatches when wind and coal capacity are exhausted.

### Scenario Analysis — Price

Another type of scenario analysis we can do is looking at how prices (which affect the objective function) change the dispatch of assets.

Varying the coal price at fixed demand shows how price changes shift dispatch:

```python
demand = 50
for coal_price in [10, 50, 100]:
    problem = pulp.LpProblem("cost-minimization", pulp.LpMinimize)
    assets = [
        Asset("wind", 30, 25),
        Asset("gas", 70, 50),
        Asset("coal", coal_price, 100),
    ]
    variables = [pulp.LpVariable(a.name, 0, a.limit) for a in assets]

    problem += sum(a.price * v for a, v in zip(assets, variables))
    problem += sum(variables) == demand
    problem.solve()
    print(f"coal_price={coal_price}")
    for v in variables:
        print(f"  {v.name} {v.varValue}")
    print("")
```

```output
coal_price=10
  wind 0.0
  gas 0.0
  coal 50.0

coal_price=50
  wind 25.0
  gas 0.0
  coal 25.0

coal_price=100
  wind 25.0
  gas 25.0
  coal 0.0
```

When coal is cheap at 10/MWh, it undercuts wind and takes all the dispatch. At 50/MWh, wind and coal split the load.  **When coal becomes expensive at 100/MWh, gas replaces it entirely** — the merit order has shifted.

## Example - Diet Cost Optimization

*This example has been adapted from [Linear programming - Michel Goemans](https://math.mit.edu/~goemans/18310S15/lpnotes310.pdf).*

We live in a town with two types of fruit (apples and oranges) and three types of nutrients (starch, proteins, vitamins).  We want a diet that is cheap while satisfying our dietary requirements of 8g of starch, 15g of proteins, and 3g of vitamins per day.

|         | Starch [g/unit] | Proteins [g/unit] | Vitamins [g/unit] | Cost [$/unit] |
|---------|-----------------|--------------------|--------------------|---------------|
| apples  | 5               | 4                  | 2                  | 0.6           |
| oranges | 7               | 2                  | 1                  | 0.35          |

If we map this problem onto our three components, we have:

- **Objective**: Minimize the cost of our diet
- **Variables**: The amount of apples and oranges we eat
- **Constraints**: Daily requirements of starch, protein, and vitamins

```python
import pulp

prob = pulp.LpProblem("diet_problem", pulp.LpMinimize)
apples = pulp.LpVariable("apples", cat="Integer", lowBound=0)
oranges = pulp.LpVariable("oranges", cat="Integer", lowBound=0)

prob += apples * 0.6 + oranges * 0.35

prob += apples * 5 + oranges * 7 >= 8
prob += apples * 4 + oranges * 2 >= 15
prob += apples * 2 + oranges * 1 >= 3

prob.solve()
print(
    f"Problem is {pulp.LpStatus[prob.status]}, your diet cost is {prob.objective.value()}"
)
for v in (apples, oranges):
    print(f"{v.name}: {v.varValue}")
```

```output
Problem is Optimal, your diet cost is 2.4
apples: 4.0
oranges: 0.0
```

The solver picks only apples because the protein constraint is the binding one — we need 15g, and apples provide 4g each versus 2g for oranges.  Four apples deliver 16g of protein at $2.40, while reaching 15g with oranges would require 8 at $2.80.

Setting `lowBound=0` on our variables is important — without it the solver can use negative quantities of fruit to satisfy constraints, which is not physically meaningful.

**With a working model, sensitivity analysis is a natural next step** — varying costs or nutritional requirements to see how the optimal diet changes, just as we varied demand and price in the electricity dispatch example above.

## Example - Cargo Assignment

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
port_to_market_cost = np.random.uniform(0, 1, size=len(ports) * len(markets)).reshape(len(ports), len(markets))
```

We can access the cost to ship from a port to a market by indexing `port_to_market_cost[port, market]`:

```python
port_to_market_cost[0, 0]
#  0.3745401188473625

port_to_market_cost[3, 2]
#  0.1560186404424365
```

We can solve this problem as below:

```python
import pulp

problem = pulp.LpProblem('transportation', pulp.LpMinimize)

x = [[pulp.LpVariable(f'port{p}_market{m}', 0) for m in range(len(markets))] for p in range(len(ports))]

problem += pulp.lpSum(x[p][m] * port_to_market_cost[p][m] for p in range(len(ports)) for m in range(len(markets)))

for m in range(len(markets)):
    problem += pulp.lpSum(x[p][m] for p in range(len(ports))) >= markets[m]

for p in range(len(ports)):
    problem += pulp.lpSum(x[p][m] for m in range(len(markets))) <= ports[p]

problem.solve()
for p in range(len(ports)):
    for m in range(len(markets)):
        if (val := x[p][m].varValue) > 0:
            print(f'port {p} -> market {m}: {val:.1f}')
```

```output
port 1 -> market 2: 5.0
port 2 -> market 0: 20.0
port 3 -> market 1: 10.0
```

**The solver routes all demand through just three port-market pairs**, leaving most routes unused.  Each market is served by a single port — the one with the lowest transport cost that still has available capacity.

## Full Code Snippets

Complete standalone scripts for each example, ready to copy and run.

### Electricity Dispatch

```python
import dataclasses

import pulp


@dataclasses.dataclass
class Asset:
    name: str
    price: float
    limit: int


assets = [
    Asset("wind", 30, 25),
    Asset("gas", 70, 50),
    Asset("coal", 50, 100),
]

problem = pulp.LpProblem("cost-minimization", pulp.LpMinimize)
variables = [pulp.LpVariable(a.name, 0, a.limit) for a in assets]

demand = 10
problem += sum(variables) == demand
problem += sum(a.price * v for a, v in zip(assets, variables))

problem.solve()
print(pulp.LpStatus[problem.status])
for v in variables:
    print(f"{v.name} {v.varValue}")
```

### Diet Cost Optimization

```python
import pulp

prob = pulp.LpProblem("diet_problem", pulp.LpMinimize)
apples = pulp.LpVariable("apples", cat="Integer", lowBound=0)
oranges = pulp.LpVariable("oranges", cat="Integer", lowBound=0)

prob += apples * 0.6 + oranges * 0.35

prob += apples * 5 + oranges * 7 >= 8
prob += apples * 4 + oranges * 2 >= 15
prob += apples * 2 + oranges * 1 >= 3

prob.solve()
print(
    f"Problem is {pulp.LpStatus[prob.status]}, your diet cost is {prob.objective.value()}"
)
for v in (apples, oranges):
    print(f"{v.name}: {v.varValue}")
```

### Cargo Assignment

```python
import numpy as np
import pulp

ports = [20, 30, 30, 50]
markets = [20, 10, 5]

np.random.seed(42)
port_to_market_cost = np.random.uniform(0, 1, size=len(ports) * len(markets)).reshape(len(ports), len(markets))

problem = pulp.LpProblem('transportation', pulp.LpMinimize)

x = [[pulp.LpVariable(f'port{p}_market{m}', 0) for m in range(len(markets))] for p in range(len(ports))]

problem += pulp.lpSum(x[p][m] * port_to_market_cost[p][m] for p in range(len(ports)) for m in range(len(markets)))

for m in range(len(markets)):
    problem += pulp.lpSum(x[p][m] for p in range(len(ports))) >= markets[m]

for p in range(len(ports)):
    problem += pulp.lpSum(x[p][m] for m in range(len(markets))) <= ports[p]

problem.solve()
for p in range(len(ports)):
    for m in range(len(markets)):
        if (val := x[p][m].varValue) > 0:
            print(f'port {p} -> market {m}: {val:.1f}')
```

## Summary

**Every linear program has the same three components — an objective, variables, and constraints — once you can identify them in a domain problem, the solver does the rest**.

- **Three components**: Every LP has an objective (minimize or maximize), decision variables (things you control), and constraints (rules you must follow)
- **LP vs MILP**: When all variables are continuous you have an LP, when some must be integers you have a MILP — the solver handles both, but MILP is harder
- **Scenario analysis**: Once you have a working model, varying inputs like demand or price reveals how the optimal solution changes
- **Solver libraries**: PuLP lets you define problems in Python and pass them to solvers like CBC or Gurobi

---

Thanks for reading!
