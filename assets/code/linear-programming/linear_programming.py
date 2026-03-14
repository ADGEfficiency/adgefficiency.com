import dataclasses

import pulp

print("DISPATCH PROBLEM")


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
problem = pulp.LpProblem("grid_dispatch", pulp.LpMinimize)
variables = [pulp.LpVariable(a.name, 0, a.limit) for a in assets]

problem += sum(a.price * v for a, v in zip(assets, variables))

demand = 10
problem += sum(variables) == demand

problem.solve()
print(pulp.LpStatus[problem.status])
for v in variables:
    print(f"{v.name} {v.varValue}")
"""
Optimal
wind 10.0
gas 0.0
coal 0.0
"""

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

"""
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

"""
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

"""
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
"""

print("DIET PROBLEM")

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
"""
Problem is Optimal, your diet cost is 2.4
apples: 4.0
oranges: 0.0
"""

print("TRANSPORT PROBLEM")

import numpy as np

ports = [20, 30, 30, 50]
markets = [20, 10, 5]

np.random.seed(42)
port_to_market_cost = np.random.uniform(0, 1, size=len(ports) * len(markets)).reshape(
    len(ports), len(markets)
)

problem = pulp.LpProblem("transportation", pulp.LpMinimize)

x = [
    [pulp.LpVariable(f"port{p}_market{m}", 0) for m in range(len(markets))]
    for p in range(len(ports))
]

problem += pulp.lpSum(
    x[p][m] * port_to_market_cost[p][m]
    for p in range(len(ports))
    for m in range(len(markets))
)

for m in range(len(markets)):
    problem += pulp.lpSum(x[p][m] for p in range(len(ports))) >= markets[m]

for p in range(len(ports)):
    problem += pulp.lpSum(x[p][m] for m in range(len(markets))) <= ports[p]

problem.solve()
for p in range(len(ports)):
    for m in range(len(markets)):
        if (val := x[p][m].varValue) > 0:
            print(f"port {p} -> market {m}: {val:.1f}")
