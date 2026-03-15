import typing

import gymnasium
import numpy as np

print("NEURAL NETWORK FORWARD PASS")


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


env = gymnasium.make("CartPole-v1")
i_size = env.observation_space.shape[0]
o_size = 1
h_size = 8

np.random.seed(42)
params = initialize_parameters(i_size, h_size, o_size)
print(list(params.keys()))
"""
['w0', 'b0', 'w1', 'b1']
"""

obs = env.observation_space.sample()
action = forward(obs, params)
print(f"observation shape: {obs.shape}, action: {action}")
"""
observation shape: (4,), action: 1
"""

print("\nEPISODE ROLLOUT")


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


np.random.seed(42)
params = initialize_parameters(i_size, h_size, o_size)
reward = episode(params, seed=0)
print(f"random agent reward: {reward}")
"""
random agent reward: 9.0
"""

print("\nEVOLUTIONARY LOOP")

np.random.seed(42)
pop_size = 64
generations = 20

pop = [initialize_parameters(i_size, h_size, o_size) for _ in range(pop_size)]

for gen in range(generations):
    results = [episode(p, seed=gen) for p in pop]
    best_idx = int(np.argmax(results))
    best = pop[best_idx]
    mean_reward = np.mean(results)
    max_reward = np.max(results)
    print(f"gen {gen:2d} | mean {mean_reward:6.1f} | max {max_reward:6.1f}")

    new_pop: list[dict[str, np.ndarray]] = []
    for _ in range(pop_size):
        child: dict[str, np.ndarray] = {}
        for k, v in best.items():
            child[k] = v + np.random.randn(*v.shape) * 0.1
            typing.cast(np.ndarray, child[k])
        new_pop.append(child)
    pop = new_pop

"""
gen  0 | mean   16.8 | max   45.0
gen  1 | mean   20.8 | max   66.0
gen  2 | mean   19.0 | max   46.0
gen  3 | mean   23.2 | max   73.0
gen  4 | mean   28.1 | max  106.0
gen  5 | mean   23.2 | max   56.0
gen  6 | mean   30.9 | max  117.0
gen  7 | mean   31.7 | max  106.0
gen  8 | mean   44.5 | max  139.0
gen  9 | mean   33.4 | max  118.0
gen 10 | mean   35.1 | max  172.0
gen 11 | mean   61.2 | max  500.0
gen 12 | mean   56.5 | max  500.0
gen 13 | mean   82.1 | max  500.0
gen 14 | mean   95.5 | max  500.0
gen 15 | mean  168.4 | max  500.0
gen 16 | mean  162.3 | max  500.0
gen 17 | mean  239.9 | max  500.0
gen 18 | mean  214.9 | max  500.0
gen 19 | mean  212.3 | max  500.0
"""

print("\nPARALLEL WITH MULTIPROCESSING")

import multiprocessing
from functools import partial


def episode_wrapper(
    params: dict[str, np.ndarray], env_id: str, seed: int
) -> float:
    return episode(params, env_id=env_id, seed=seed)


np.random.seed(42)
pop = [initialize_parameters(i_size, h_size, o_size) for _ in range(pop_size)]

for gen in range(generations):
    fn = partial(episode_wrapper, env_id="CartPole-v1", seed=gen)
    with multiprocessing.Pool(4) as pool:
        results = pool.map(fn, pop)

    best_idx = int(np.argmax(results))
    best = pop[best_idx]
    mean_reward = np.mean(results)
    max_reward = np.max(results)
    print(f"gen {gen:2d} | mean {mean_reward:6.1f} | max {max_reward:6.1f}")

    new_pop: list[dict[str, np.ndarray]] = []
    for _ in range(pop_size):
        child: dict[str, np.ndarray] = {}
        for k, v in best.items():
            child[k] = v + np.random.randn(*v.shape) * 0.1
        new_pop.append(child)
    pop = new_pop

"""
gen  0 | mean   16.8 | max   45.0
gen  1 | mean   20.8 | max   66.0
gen  2 | mean   19.0 | max   46.0
gen  3 | mean   23.2 | max   73.0
gen  4 | mean   28.1 | max  106.0
gen  5 | mean   23.2 | max   56.0
gen  6 | mean   30.9 | max  117.0
gen  7 | mean   31.7 | max  106.0
gen  8 | mean   44.5 | max  139.0
gen  9 | mean   33.4 | max  118.0
gen 10 | mean   35.1 | max  172.0
gen 11 | mean   61.2 | max  500.0
gen 12 | mean   56.5 | max  500.0
gen 13 | mean   82.1 | max  500.0
gen 14 | mean   95.5 | max  500.0
gen 15 | mean  168.4 | max  500.0
gen 16 | mean  162.3 | max  500.0
gen 17 | mean  239.9 | max  500.0
gen 18 | mean  214.9 | max  500.0
gen 19 | mean  212.3 | max  500.0
"""
