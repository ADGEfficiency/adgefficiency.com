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


h_size = 8

cartpole_env = gymnasium.make("CartPole-v1")
cp_i_size = cartpole_env.observation_space.shape[0]
cp_o_size = 1

np.random.seed(42)
params = initialize_parameters(cp_i_size, h_size, cp_o_size)
print(list(params.keys()))
"""
['w0', 'b0', 'w1', 'b1']
"""

cp_obs = cartpole_env.observation_space.sample()
cp_action = forward(cp_obs, params)
print(f"CartPole observation shape: {cp_obs.shape}, action: {cp_action}")
"""
CartPole observation shape: (4,), action: 0
"""

mc_env = gymnasium.make("MountainCarContinuous-v0")
mc_i_size = mc_env.observation_space.shape[0]
mc_o_size = mc_env.action_space.shape[0]

np.random.seed(42)
mc_params = initialize_parameters(mc_i_size, h_size, mc_o_size)
mc_obs = mc_env.observation_space.sample()
mc_action = forward(mc_obs, mc_params, discrete=False)
print(f"MountainCar observation shape: {mc_obs.shape}, action: {mc_action}")
"""
MountainCar observation shape: (2,), action: [-0.65990582]
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
cp_params = initialize_parameters(cp_i_size, h_size, cp_o_size)
cp_reward = episode(cp_params, env_id="CartPole-v1", discrete=True, seed=0)
print(f"CartPole random agent reward: {cp_reward}")
"""
CartPole random agent reward: 11.0
"""

np.random.seed(42)
mc_params = initialize_parameters(mc_i_size, h_size, mc_o_size)
mc_reward = episode(mc_params, env_id="MountainCarContinuous-v0", discrete=False, seed=0)
print(f"MountainCar random agent reward: {mc_reward}")
"""
MountainCar random agent reward: -2.6802394684063904
"""

print("\nCARTPOLE EVOLUTIONARY LOOP")

np.random.seed(42)
pop_size = 64
generations = 20

cp_pop = [initialize_parameters(cp_i_size, h_size, cp_o_size) for _ in range(pop_size)]

for gen in range(generations):
    results = [episode(p, env_id="CartPole-v1", discrete=True, seed=gen) for p in cp_pop]
    best_idx = int(np.argmax(results))
    best = cp_pop[best_idx]
    mean_reward = float(np.mean(results))
    max_reward = float(np.max(results))
    print(f"gen {gen:2d} | mean {mean_reward:6.1f} | max {max_reward:6.1f}")

    new_pop: list[dict[str, np.ndarray]] = []
    for _ in range(pop_size):
        child: dict[str, np.ndarray] = {}
        for k, v in best.items():
            child[k] = v + np.random.randn(*v.shape) * 0.1
        new_pop.append(child)
    cp_pop = new_pop

"""
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
"""

print("\nMOUNTAINCARCONTINUOUS EVOLUTIONARY LOOP")

np.random.seed(42)
mc_pop = [initialize_parameters(mc_i_size, h_size, mc_o_size) for _ in range(pop_size)]

for gen in range(generations):
    results = [
        episode(p, env_id="MountainCarContinuous-v0", discrete=False, seed=gen)
        for p in mc_pop
    ]
    best_idx = int(np.argmax(results))
    best = mc_pop[best_idx]
    mean_reward = float(np.mean(results))
    max_reward = float(np.max(results))
    print(f"gen {gen:2d} | mean {mean_reward:6.1f} | max {max_reward:6.1f}")

    new_mc_pop: list[dict[str, np.ndarray]] = []
    for _ in range(pop_size):
        child: dict[str, np.ndarray] = {}
        for k, v in best.items():
            child[k] = v + np.random.randn(*v.shape) * 0.1
        new_mc_pop.append(child)
    mc_pop = new_mc_pop

"""
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
"""

import multiprocessing
from functools import partial


def episode_wrapper(params: dict[str, np.ndarray], env_id: str, seed: int) -> float:
    return episode(params, env_id=env_id, seed=seed)


if __name__ == "__main__":
    print("\nPARALLEL WITH MULTIPROCESSING")

    np.random.seed(42)
    cp_pop = [initialize_parameters(cp_i_size, h_size, cp_o_size) for _ in range(pop_size)]

    for gen in range(generations):
        fn = partial(episode_wrapper, env_id="CartPole-v1", seed=gen)
        with multiprocessing.Pool(4) as pool:
            results = pool.map(fn, cp_pop)

        best_idx = int(np.argmax(results))
        best = cp_pop[best_idx]
        mean_reward = float(np.mean(results))
        max_reward = float(np.max(results))
        print(f"gen {gen:2d} | mean {mean_reward:6.1f} | max {max_reward:6.1f}")

        new_cp_pop: list[dict[str, np.ndarray]] = []
        for _ in range(pop_size):
            child: dict[str, np.ndarray] = {}
            for k, v in best.items():
                child[k] = v + np.random.randn(*v.shape) * 0.1
            new_cp_pop.append(child)
        cp_pop = new_cp_pop

    """
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
    gen 19 | mean  212.3 | max  500.0
    """
