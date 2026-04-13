---
title: Rocket Landing using Reinforcement Learning!
date: 2025-04-28 12:12:11 +0530
image: /images/rocket_landing/cover.png
author: codevardhan
tags: [reinforcement-learning, rocket, python]

usemathjax: true
---

> “A crash is just a high-speed landing... in the wrong place.” – Unknown RL Agent

# 🚀 Landing Rockets and Losing Our Minds: A Reinforcement Learning Journey

*By Harshavardhan Manohar & [Nivedita Shainaj Nair](https://www.linkedin.com/in/nivedita-nair15/)*

---

## 🧠 Prologue: It Started With a Rocket

We wanted to land a rocket. Not in real life, of course, that would’ve been wildly over budget for two grad students, but in a 2D simulation. Our project was supposed to be a "standard" application of reinforcement learning, something nice and contained.

What we got was a crash course in chaos.

The environment we used was borrowed from this amazing [repo](https://github.com/taherfattahi/ppo-rocket-landing)

---

## 🎮 Chapter One: DQN – Our Shaky Firstborn

We began with Deep Q-Networks (DQN). It seemed logical: value-based methods had conquered Atari, so surely they could handle a rocket in two dimensions. We gave our agent dueling networks, prioritized experience replay, and every other method we learned in our RL class.

At first, things were promising. The rocket jittered, learned, wobbled its way down… and then it would just nosedive into the virtual ground.

Over hundreds of episodes, DQN learned, slowly. And not always in the ways we wanted. Sometimes it hovered, sometimes it pirouetted mid-air like a confused ballerina.

We blamed hyperparameters. Then the replay buffer. Then ourselves.

Anyway, here's the end result.

<!-- raw html --> 

<video width=100% controls autoplay>
    <source src="/videos/DQN.mp4" type="video/mp4">
    Your browser does not support the video tag.  
</video>



---

## 🌬️ Chapter Two: Who Ordered Wind?

Since things were obviously going well according to plan, we had the genius idea of adding **wind** to make it more realistic.

**Mistake.**

Imagine trying to teach a child to ride a bike… and then you fire a leaf blower at their face every 0.05 seconds.

That's what our DQN agent experienced. Even the modest breeze we added, random accelerations in both x and y directions, turned our learning curves into wild mountain ranges.

DQN, poor thing, couldn’t keep up.

---

## 🧘 Chapter Three: PPO – The Calm Strategist

We decided to switch strategies. Enter Proximal Policy Optimization (PPO), the algorithm everyone online swears by.

This was a turning point.

PPO handled the wind like a zen monk in a hurricane. With **Generalized Advantage Estimation (GAE)**, the learning became smoother. The rocket stopped thrashing and started *gliding*.

Sure, it still crashed. But now, it was *learning* from it.

We watched our agent figure out how to compensate for the wind, just slightly tilting left to counter a push to the right. It was… beautiful.

And then we asked: what if we cared about *how* it landed, not just *whether* it did?

---

## 🛡️ Chapter Four: Safe PPO – Rocket Science Meets Ethics

Enter **Safe PPO**, our agent with a conscience.

We gave it a cost function: if you land too hard, tilt too far, or spin too wildly, you pay the price. Literally.

Safe PPO didn't aim for the highest rewards, it aimed for the safest ones. While PPO with GAE often chased scoreboards, Safe PPO quietly mastered soft landings. Episode lengths stabilized. Explosions reduced. It didn’t always *win*, but it never killed its passengers, maybe they suffered minor injuries at worst.

The average episode length increased, and so did our hopes.

<video width=100% controls autoplay>
    <source src="/videos/PPO.mp4" type="video/mp4">
    Your browser does not support the video tag.  
</video>

---

## 🧪 Chapter Five: Experiments, Burnout, and Breakthroughs

We ran thousands of episodes. DQN trained for **10+ hours** and still acted confused. PPO and Safe PPO finished in **1 hour** and looked wise beyond their steps.

We tweaked learning rates, added **decay schedules**, balanced exploration vs exploitation, and watched as Safe PPO converged steadily, even if it never quite reached the flamboyant peaks of PPO with GAE.

---

## 📊 Results: What We Learned

| Agent       | Best Episode Reward | Stability | Safety | Training Time |
|-------------|---------------------|-----------|--------|----------------|
| DQN         | ⭐️⭐️⭐️               | ❌        | ❌     | 10+ hours      |
| PPO + GAE   | ⭐️⭐️⭐️⭐️⭐️           | ⚠️        | ⚠️     | ~1 hour        |
| Safe PPO    | ⭐️⭐️⭐️⭐️             | ✅        | ✅     | ~1 hour        |

- **DQN** taught us patience.  
- **PPO-GAE** taught us power.  
- **Safe PPO** taught us responsibility.

---

## 🧭 Epilogue: Would We Do It Again?

Ask us on a good day.

Despite the crashes, of rockets and our sanity, we came out stronger. We built something from scratch, wrestled it into functionality, and even gave it ethics. Reinforcement learning isn’t magic. It's messy, beautiful trial-and-error.

This project wasn’t just about landing a rocket.

It was about landing **ourselves** into the wild world of RL. Anyway do checkout the repo and the technical report below if you prefer math and code over whatever this was.

---

## 📂 Code and Report

- 🔗 [GitHub Repository](https://github.com/shainajnairn/Reinforcement-Learning-Project---CS5180)  
- 📄 [Final Report (PDF)](https://1drv.ms/b/c/2086135d5589e708/EZrjp0kuSG9CqiGB9NCa8bsBe20cn9xNxv5xEE5lhhy5KA?e=uT11Sr)

---
