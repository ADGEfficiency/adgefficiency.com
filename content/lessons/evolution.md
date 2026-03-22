---
title: Evolutionary Optimization
description: Train neural network agents without gradients using a generate, test, and select loop.
date_created: 2026-03-21
date_updated: 2026-03-21
draft: true
competencies:
  - Optimization
  - Machine Learning
---

## What are Evolutionary Methods?

**Evolutionary optimization are gradient-free optimization algorithms** that improve solutions through repeated cycles of generation, testing, and selection — mirroring the logic of biological evolution.

They work on any problem that can be evaluated with a fitness score, making them useful on objectives that are discontinuous, non-differentiable, or simply too complex to differentiate through.

Three properties make evolutionary optimization worth knowing:

- **Gradient-free**: No backpropagation required — a fitness score is the only signal needed
- **General purpose**: Work on any evaluable objective, not just differentiable ones
- **Parallelizable**: Population members are tested independently, so evaluation maps naturally to multi-core hardware

The trade-off is **sample efficiency**. Evolutionary optimization learn from a weak signal — total episode reward — rather than the rich per-transition information that gradient-based methods exploit.

### What is Neuroevolution?

**Neuroevolution is the application of evolutionary optimization to neural networks** — using evolution to find weights and biases rather than gradient descent.

Instead of computing gradients and stepping in the direction of improvement, neuroevolution maintains a population of neural networks, evaluates each in an environment, and breeds the next generation from the best performers.

This means no autodiff, no loss function, and no backpropagation — just numpy matrix math and an environment that returns a reward.

### This Lesson

Install the dependencies:

```bash
$ pip install gymnasium==1.2.3 numpy
```

This lesson covers four things:

1. **Neural network forward pass**: Two-layer network in numpy, supporting both discrete and continuous action spaces
2. **Episode rollout**: A fitness function that runs one complete episode and returns total reward
3. **Evolutionary loop**: Generate, test, and select applied to CartPole and MountainCar
4. **Parallelization**: Distributing population evaluation across CPU cores with `multiprocessing`

### Resources

- **[CMA-ES](https://en.wikipedia.org/wiki/CMA-ES)** — the practical default for evolutionary optimization; adapts the covariance matrix and scales to thousands of parameters
- **[Evolution Strategies as a Scalable Alternative to Reinforcement Learning](https://openai.com/index/evolution-strategies/)** — OpenAI's paper demonstrating ES on deep RL benchmarks
- **[Daniel Dennett's Four Competences](https://towardsdatascience.com/daniel-c-dennetts-four-competences-779648bdbabc)** — the philosophical framing behind generate, test, and select

## Why Learn Evolutionary Methods?

**Evolutionary optimization are a practical tool when gradients are unavailable, unreliable, or too expensive to compute**.

They work where gradient descent can't — on reward signals from simulators, black-box functions, or any environment that doesn't expose a differentiable loss. The parallelism is also valuable: a population of 64 agents runs across 64 CPU cores with no communication overhead.

**If you need a production-ready evolutionary algorithm, CMA-ES is the best default choice**. It adapts the covariance matrix of the sampling distribution, giving it much stronger gradient estimation than simple Gaussian perturbation. It works well up to roughly 10,000 parameters and was used in World Models to optimize neural network controllers.

## Neural Network Forward Pass

**The agent is a two-layer neural network — two matrix multiplications with a ReLU activation in between**.

We store weights and biases as a dictionary of numpy arrays:

```python { title = "evolution.py" }
import gymnasium
import numpy as np


def initialize_parameters(
    i_size: int, h_size: int, o_size: int
) -> dict[str, np.ndarray]:
    return {
        "w0": np.random.randn(i_size, h_size),
        "b0": np.zeros(h_size),
        "w1": np.random.randn(h_size, o_size),
        "b1": np.zeros(o_size),
    }
```

The forward pass maps an observation to an action. The `discrete` flag switches between a binary output for CartPole and a raw continuous output for MountainCar:

```python
def forward(
    x: np.ndarray, params: dict[str, np.ndarray], discrete: bool = True
) -> int | np.ndarray:
    x = np.array(x).reshape(-1)
    z0 = x.dot(params["w0"]) + params["b0"].flatten()
    a0 = np.maximum(z0, 0)
    z1 = a0.dot(params["w1"]) + params["b1"].flatten()
    if discrete:
        return int(1 / (1 + np.exp(-z1[0])) > 0.5)
    return z1
```

CartPole has a 4-dimensional observation and a discrete action (push left or push right):

```python
cartpole_env = gymnasium.make("CartPole-v1")
cp_i_size = cartpole_env.observation_space.shape[0]  # 4
cp_o_size = 1

np.random.seed(42)
params = initialize_parameters(cp_i_size, h_size=8, o_size=cp_o_size)
cp_obs = cartpole_env.observation_space.sample()
print(f"CartPole observation shape: {cp_obs.shape}, action: {forward(cp_obs, params)}")
```

```output
CartPole observation shape: (4,), action: 0
```

MountainCar has a 2-dimensional observation (position and velocity) and a continuous action — force applied to the car:

```python
mc_env = gymnasium.make("MountainCarContinuous-v0")
mc_i_size = mc_env.observation_space.shape[0]   # 2
mc_o_size = mc_env.action_space.shape[0]        # 1

np.random.seed(42)
mc_params = initialize_parameters(mc_i_size, h_size=8, o_size=mc_o_size)
mc_obs = mc_env.observation_space.sample()
print(f"MountainCar observation shape: {mc_obs.shape}, action: {forward(mc_obs, mc_params, discrete=False)}")
```

```output
MountainCar observation shape: (2,), action: [-0.65990582]
```

**The same `forward()` function handles both environments** — `discrete=True` applies a sigmoid and thresholds to 0 or 1, while `discrete=False` passes the raw output through as a continuous value.

## Episode Rollout

**The episode function runs one complete episode and returns the total reward — this is the fitness score that drives evolution**.

```python
def episode(
    params: dict[str, np.ndarray],
    env_id: str = "CartPole-v1",
    discrete: bool = True,
    seed: int | None = None,
) -> float:
    env = gymnasium.make(env_id)
    obs, _ = env.reset(seed=seed)
    total_reward = 0.0
    terminated = False
    truncated = False
    while not terminated and not truncated:
        action = forward(obs, params, discrete=discrete)
        obs, reward, terminated, truncated, _ = env.step(action)
        total_reward += float(reward)
    env.close()
    return total_reward
```

A randomly initialized agent scores poorly on both environments:

```python
np.random.seed(42)
cp_params = initialize_parameters(cp_i_size, h_size=8, o_size=cp_o_size)
print(episode(cp_params, env_id="CartPole-v1", seed=0))

np.random.seed(42)
mc_params = initialize_parameters(mc_i_size, h_size=8, o_size=mc_o_size)
print(episode(mc_params, env_id="MountainCarContinuous-v0", discrete=False, seed=0))
```

```output
11.0
-2.6802394684063904
```

**These baselines show what random weights produce** — 11 steps on CartPole (solved requires 500) and −2.7 on MountainCar (solved requires ≥ 90).

## Generate, Test & Select

**The evolutionary loop has three steps: generate a population, test each member, and select the best to breed from**.

For the first generation, we generate random parameters. In each subsequent generation, we perturb the best performer with Gaussian noise — sampling near the winner rather than the full random space:

```python
pop_size = 64
generations = 20

# first generation: random
pop = [initialize_parameters(i_size, h_size=8, o_size=o_size) for _ in range(pop_size)]

for gen in range(generations):
    # test
    results = [episode(p, seed=gen) for p in pop]
    # select
    best = pop[int(np.argmax(results))]
    # generate
    pop = [
        {k: v + np.random.randn(*v.shape) * 0.1 for k, v in best.items()}
        for _ in range(pop_size)
    ]
```

The mutation step — adding Gaussian noise scaled by 0.1 — keeps each child close to the parent while exploring the neighbourhood. Over generations, the population drifts toward higher-reward regions of parameter space.

## CartPole (Discrete Actions)

CartPole uses discrete actions — the agent pushes the pole left or right each step, earning +1 per step survived. Maximum reward is 500.

```python
np.random.seed(42)
cp_pop = [initialize_parameters(cp_i_size, h_size=8, o_size=cp_o_size) for _ in range(pop_size)]

for gen in range(generations):
    results = [episode(p, env_id="CartPole-v1", discrete=True, seed=gen) for p in cp_pop]
    best = cp_pop[int(np.argmax(results))]
    print(f"gen {gen:2d} | mean {float(np.mean(results)):6.1f} | max {float(np.max(results)):6.1f}")
    cp_pop = [
        {k: v + np.random.randn(*v.shape) * 0.1 for k, v in best.items()}
        for _ in range(pop_size)
    ]
```

```output
gen  0 | mean   27.8 | max  177.0
gen  1 | mean   61.0 | max  326.0
gen  2 | mean   94.1 | max  500.0
gen  3 | mean  116.9 | max  500.0
gen  4 | mean   91.5 | max  183.0
gen  5 | mean  154.9 | max  500.0
gen  6 | mean  132.1 | max  500.0
gen  7 | mean  125.5 | max  500.0
gen  8 | mean   76.6 | max  500.0
gen  9 | mean   72.1 | max  500.0
gen 10 | mean  112.0 | max  500.0
gen 11 | mean   58.7 | max  500.0
gen 12 | mean   97.2 | max  318.0
gen 13 | mean  138.7 | max  500.0
gen 14 | mean  166.6 | max  500.0
gen 15 | mean  108.3 | max  500.0
gen 16 | mean  146.4 | max  500.0
gen 17 | mean  132.4 | max  500.0
gen 18 | mean  174.8 | max  500.0
gen 19 | mean  187.2 | max  500.0
```

**The best agent solves CartPole by generation 2**, reaching the maximum reward of 500. The mean reward is noisier — the population hasn't converged — but the peak keeps improving.

## MountainCar (Continuous Actions)

MountainCar is a harder problem. A car sits in a valley and must reach a flag at the top of the right hill. The engine isn't powerful enough to drive straight up — **the agent must learn to swing back and forth to build momentum**.

The action is continuous: a single float in [−1, 1] representing the force applied. This is the only code change needed from CartPole:

```python
np.random.seed(42)
mc_pop = [initialize_parameters(mc_i_size, h_size=8, o_size=mc_o_size) for _ in range(pop_size)]

for gen in range(generations):
    results = [
        episode(p, env_id="MountainCarContinuous-v0", discrete=False, seed=gen)
        for p in mc_pop
    ]
    best = mc_pop[int(np.argmax(results))]
    print(f"gen {gen:2d} | mean {float(np.mean(results)):6.1f} | max {float(np.max(results)):6.1f}")
    mc_pop = [
        {k: v + np.random.randn(*v.shape) * 0.1 for k, v in best.items()}
        for _ in range(pop_size)
    ]
```

```output
gen  0 | mean -114.4 | max   76.6
gen  1 | mean   51.1 | max   87.4
gen  2 | mean   62.0 | max   96.9
gen  3 | mean   64.8 | max   99.2
gen  4 | mean   24.3 | max   98.7
gen  5 | mean    5.7 | max   99.1
gen  6 | mean    1.9 | max   99.2
gen  7 | mean   -0.1 | max   98.9
gen  8 | mean   18.8 | max   97.1
gen  9 | mean   58.6 | max   99.2
gen 10 | mean   48.4 | max   99.3
gen 11 | mean   52.4 | max   99.2
gen 12 | mean   40.8 | max   98.8
gen 13 | mean   46.7 | max   99.2
gen 14 | mean   34.9 | max   99.2
gen 15 | mean   17.8 | max   99.1
gen 16 | mean   15.6 | max   98.5
gen 17 | mean   40.0 | max   98.9
gen 18 | mean   35.7 | max   98.8
gen 19 | mean   57.2 | max   99.2
```

**The best agent solves MountainCar by generation 2** (reward ≥ 90), reaching 96.9. The mean reward is highly variable — most population members fail, but the best performers consistently find the flag. The same algorithm, the same code, handles both discrete and continuous control.

## Parallel with Multiprocessing

**Each episode is independent, so the population evaluation is embarrassingly parallel** — we can distribute across CPU cores with no coordination overhead.

`multiprocessing.Pool.map` replaces the inner list comprehension:

```python
import multiprocessing
from functools import partial


def episode_wrapper(params: dict[str, np.ndarray], env_id: str, seed: int) -> float:
    return episode(params, env_id=env_id, seed=seed)


if __name__ == "__main__":
    np.random.seed(42)
    cp_pop = [initialize_parameters(cp_i_size, h_size=8, o_size=cp_o_size) for _ in range(pop_size)]

    for gen in range(generations):
        fn = partial(episode_wrapper, env_id="CartPole-v1", seed=gen)
        with multiprocessing.Pool(4) as pool:
            results = pool.map(fn, cp_pop)

        best = cp_pop[int(np.argmax(results))]
        print(f"gen {gen:2d} | mean {float(np.mean(results)):6.1f} | max {float(np.max(results)):6.1f}")
        cp_pop = [
            {k: v + np.random.randn(*v.shape) * 0.1 for k, v in best.items()}
            for _ in range(pop_size)
        ]
```

The `if __name__ == "__main__":` guard is required on macOS and Windows, where Python spawns new processes rather than forking. Without it, each worker re-imports the script and tries to create its own pool, causing an infinite recursion.

**The results are identical to the sequential version** — parallelism only changes wall-clock time, not which episodes are evaluated.

## Full Code Snippets

Complete standalone script, ready to copy and run.

```python { title = "evolution.py" }
import multiprocessing
from functools import partial

import gymnasium
import numpy as np


def forward(
    x: np.ndarray, params: dict[str, np.ndarray], discrete: bool = True
) -> int | np.ndarray:
    x = np.array(x).reshape(-1)
    z0 = x.dot(params["w0"]) + params["b0"].flatten()
    a0 = np.maximum(z0, 0)
    z1 = a0.dot(params["w1"]) + params["b1"].flatten()
    if discrete:
        return int(1 / (1 + np.exp(-z1[0])) > 0.5)
    return z1


def initialize_parameters(
    i_size: int, h_size: int, o_size: int
) -> dict[str, np.ndarray]:
    return {
        "w0": np.random.randn(i_size, h_size),
        "b0": np.zeros(h_size),
        "w1": np.random.randn(h_size, o_size),
        "b1": np.zeros(o_size),
    }


def episode(
    params: dict[str, np.ndarray],
    env_id: str = "CartPole-v1",
    discrete: bool = True,
    seed: int | None = None,
) -> float:
    env = gymnasium.make(env_id)
    obs, _ = env.reset(seed=seed)
    total_reward = 0.0
    terminated = False
    truncated = False
    while not terminated and not truncated:
        action = forward(obs, params, discrete=discrete)
        obs, reward, terminated, truncated, _ = env.step(action)
        total_reward += float(reward)
    env.close()
    return total_reward


def episode_wrapper(params: dict[str, np.ndarray], env_id: str, seed: int) -> float:
    return episode(params, env_id=env_id, seed=seed)


def evolve(
    env_id: str = "CartPole-v1",
    discrete: bool = True,
    i_size: int = 4,
    o_size: int = 1,
    h_size: int = 8,
    pop_size: int = 64,
    generations: int = 20,
) -> None:
    pop = [initialize_parameters(i_size, h_size, o_size) for _ in range(pop_size)]
    for gen in range(generations):
        results = [episode(p, env_id=env_id, discrete=discrete, seed=gen) for p in pop]
        best = pop[int(np.argmax(results))]
        print(f"gen {gen:2d} | mean {float(np.mean(results)):6.1f} | max {float(np.max(results)):6.1f}")
        pop = [
            {k: v + np.random.randn(*v.shape) * 0.1 for k, v in best.items()}
            for _ in range(pop_size)
        ]


if __name__ == "__main__":
    h_size = 8

    cartpole_env = gymnasium.make("CartPole-v1")
    cp_i_size = cartpole_env.observation_space.shape[0]

    mc_env = gymnasium.make("MountainCarContinuous-v0")
    mc_i_size = mc_env.observation_space.shape[0]
    mc_o_size = mc_env.action_space.shape[0]

    np.random.seed(42)
    print("CartPole")
    evolve(env_id="CartPole-v1", discrete=True, i_size=cp_i_size, o_size=1)

    np.random.seed(42)
    print("\nMountainCar")
    evolve(env_id="MountainCarContinuous-v0", discrete=False, i_size=mc_i_size, o_size=mc_o_size)

    np.random.seed(42)
    pop_size = 64
    generations = 20
    cp_pop = [initialize_parameters(cp_i_size, h_size, 1) for _ in range(pop_size)]

    print("\nCartPole (parallel)")
    for gen in range(generations):
        fn = partial(episode_wrapper, env_id="CartPole-v1", seed=gen)
        with multiprocessing.Pool(4) as pool:
            results = pool.map(fn, cp_pop)
        best = cp_pop[int(np.argmax(results))]
        print(f"gen {gen:2d} | mean {float(np.mean(results)):6.1f} | max {float(np.max(results)):6.1f}")
        cp_pop = [
            {k: v + np.random.randn(*v.shape) * 0.1 for k, v in best.items()}
            for _ in range(pop_size)
        ]
```

## Summary

**Evolutionary optimization train agents by generating a population, evaluating fitness, and selecting the best to mutate into the next generation** — no gradients required.

- **Neuroevolution**: Evolutionary optimization applied to neural network weights; forward pass in numpy is sufficient, no autodiff needed
- **Fitness function**: Total episode reward is the only signal; the same `episode()` function works for discrete and continuous environments
- **Discrete vs. continuous**: Switching environments requires only changing `env_id` and `discrete=False`; the algorithm is identical
- **Parallelism**: Episode evaluation is embarrassingly parallel; `multiprocessing.Pool` gives near-linear speedup with cores
- **CMA-ES**: For production use, prefer CMA-ES over simple Gaussian perturbation — it adapts the sampling distribution and scales to thousands of parameters

---

Thanks for reading!
