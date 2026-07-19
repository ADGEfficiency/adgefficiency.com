---
id: how-i-ai-development
aliases: []
tags: []
competencies:
  - AI
  - Software Engineering
  - How I
date_created: "2026-05-19"
date_updated: "2026-06-12"
description: My current stack and habits for programming with AI — from IDE plugins to scheduled cloud agents.
draft: false
title: How I Program with AI
---

## Introduction

These are my notes on programming with AI.

{{< img
    src="/images/how-i-program-with-ai/hero.png"
    alt="Baray at Angkor Wat, Cambodia"
    caption="Baray at Angkor Wat, Cambodia"
>}}

**Writing about how I work surfaces strengths, weaknesses and new ideas of how to work**. This helps me understand and improve my work, and helps me when I want to explain how I work to others.

My current stack is:

- **Agent harness**: [Pi Coding Agent](https://pi.dev/) for an agentic terminal coding harness.
- **Model**: Qwen, Kimi or Opus.
- **Model provider**: [OpenRouter](https://openrouter.ai/) provides access to many different models, from Anthropic to Moonshot AI.
- **Chat**: [CodeCompanion](https://codecompanion.olimorris.dev/) for chat in Neovim.
- **Autocomplete**: [zbirenbaum/copilot.lua](https://github.com/zbirenbaum/copilot.lua) for inline completion in Neovim with Github Copilot.

## The Basics

Some basic knowledge for programming with LLM-based AI.

### LLMs are Random

**LLMs are stochastic - never expect the same prompt to return the same response**.

Many things can change between one prompt and the next when using a cloud-based LLM:

- **Sampling temperature**: Most providers use non-zero temperature, randomising token selection.
- **Model retraining**: The same model name can point to different weights over time.
- **System prompts and tools**: Provider-side changes to system prompts, tools and skills are invisible to you.
- **Routing**: Meta systems that route prompts to different underlying models can change which model you actually hit.

The environment LLMs respond to prompts in is non-stationary - much of what is true about LLMs today might not be true next month:

- **Models get better**: Previously necessary instructions or techniques become counterproductive.
- **Models get worse**: Bugs and optimisations can degrade quality intermittently.
- **Models get retired**: A model you depend on will be taken away with a few months' notice.

Two practical implications of this non-determinism are:

1. **Validate outputs**: Don't assume an LLM returned what you asked for.
2. **Avoid exact-output dependencies**: Don't build workflows that rely on deterministic LLM responses.

### Context

**Context is the tokens that an LLM can use to predict the next token**. Managing context is a key skill in using LLMs.

Context includes the system prompt (set in secret by the LLM provider), and a sequence of user (human) and assistant (AI) messages:

```json
[
  { "role": "system", "content": "You are an expert software developer." },
  { "role": "user", "content": "Add a summary to my blog post." },
  { "role": "assistant", "content": "Here's a summary: ..." },
  { "role": "user", "content": "Now write a commit message." }
]
```

**There are two skills in managing context**:

1. **Adding**: Knowing when to add to context.
2. **Resetting**: Knowing when to restart a session.

Both are important. Often adding more relevant or up-to-date content to the context is the difference between an AI generating useful or useless code.

Examples of adding context:

- **Library versions**: Specify versions when different versions are incompatible (e.g. Pydantic 1 vs 2).
- **Documentation**: Paste in docs for the version of the library you're actually using - the model's training data may be stale.
- **Your conventions**: Code style, naming, project structure - things the model can't infer from the file you're editing alone.

You'll often throw away sessions multiple times in a single piece of work, not just once at the end.

A session where context rot has set in - the model is going in circles, repeating mistakes, or refusing to consider alternatives - is a dead session. Reset context and start a new one.

Context rot is not the only reason to reset context. I often reset context to get a fresh agent to review a plan I just wrote.

### Customise Your Instructions

**Custom instructions are the highest-value configuration setting in any AI tool**. When you start using a new AI tool, configure these early on.

Custom instructions are injected into every prompt. That's why they're high leverage: one edit changes the behaviour of every future session. They live in different places depending on the tool - ChatGPT settings, Cursor rules, `AGENTS.md`, `CLAUDE.md` are all examples of how to customise AI instructions.

A small example of instructions that mirror my own:

```markdown
You are an expert data scientist.

Be concise.

Push back and offer alternative ideas.

All Python must be statically typed.

Do not start implementing anything without a plan and user approval.
```

The last one matters a lot for agentic coding. Without it, the agent will often write code the moment you describe a problem, rather than after you have both agreed on an approach in a concrete plan.

### Control Thinking Level

Thinking (also called reasoning) is an LLM generating tokens for itself to think through a problem, before writing a response. Most AI tools will provide some way to configure the amount of reasoning an LLM does.

**You don't always want high thinking mode - it's slow**. For simple tasks (or tasks where you have a great prompt) start with low thinking mode.

### Understand Tool Use

**A tool call is the LLM doing something other than generating text** - searching the web, reading a file, editing your code, running a shell command. Tool use is what turns a chat into an agent.

You should understand every tool your AI can use, and see every tool call as it happens.

**Tool selection & use is a security decision**. An agent with no shell tool can't `rm -rf /`. An agent with no web search can't be prompt-injected via a poisoned page.

### Beware Hallucinations

LLMs sample from a probability distribution over the next token:

$$P(\text{next token} | \text{context})$$

The model predicts what text is plausible, not what is true. **This means the model can confidently produce falsehoods - hallucinations**. Lowering temperature doesn't fix this - a deterministic model still hallucinates.

Managing context well reduces hallucinations. Resetting a poisoned session, adding correct documentation, and giving the model the right files all cut the rate. But the rate is never zero - hallucinations should always be expected and planned for.

**The practical implication: never trust model output without a way to check it**.

### Scare Yourself with Security

**Prompt injection is the scariest risk with LLMs**. Malicious prompt text gets injected into context (e.g. during a web search the agent runs) and instructs the LLM to do bad things on whatever machine the LLM can run tools on.

**The other risk is the agent doing `rm -rf /`** - or any equivalent destructive command. An agent with shell access is an agent that can delete your work. This can happen by accident or because of prompt injection.

Sandboxes help with both, but I've never used one when running an agent in my terminal. The guardrails I do use are coarse - the [pi-guardrails](https://github.com/aliou/pi-guardrails) extension blocks the worst commands, and I keep anything important in source control so I can recover the work.

This is likely something I'll look to improve, but as with a lot of security work, the tradeoffs hit developer productivity.

## Writing Good Prompts

**Prompts are how you steer an LLM to program the way you want**.

Context is the most important thing here - while "Make prompts good by adding good context" is certainly reductive, it's also useful advice. Most bad output traces back to missing context, not bad phrasing or use of specific words.

A few prompting tips that earn their keep:

- **Use examples**: Probably the highest-value prompting tip - good examples narrow the scope of what you want.
- **Set a role**: Set a role or persona at the top of the prompt - this can help set the tone of the conversation.
- **Be clear about evaluation**: Be explicit about how the output will be judged and how much output you expect.
- **Ask for a plan**: Ask for a plan before any code.  Even a plan made inline in a chat can help an agent structure it's thinking.
- **Repeat the important stuff**: Repeat the important bits at the top and bottom of large prompts.

All these tips also work great with people.

## A Few Custom Skills

A skill is specialised knowledge an agent can load on demand. I'm just starting out with them.

**The trigger for writing a skill is repetition**. If you explain something to an agent repeatedly, or it does a task often, that's a skill waiting to be written.

A skill is a markdown file with a description in the frontmatter and instructions in the body. Skills are loaded lazily - the description is used by the AI to determine whether to load the skill into context.

I have a few small skills and mostly use them in scheduled Claude Code jobs - below is an example of a skill that finds references between my personal notes & writing:

```markdown
---
id: cross-references
aliases: []
tags: []
description: Find thematically connected notes and suggest cross-references between them.
---

Find notes that share themes or ideas but aren't linked to each other.

Before starting, read `area/ai/index.md` (if it exists) to understand existing AI-generated content and avoid duplicating covered ground.

First, randomly pick 20 markdown notes from resource/, resources/programming/, area/, area/blogs/ and area/writing/.

Use a randomized approach — e.g. list all .md files, shuffle, take the first 20. Read all 20 notes in full.

Then find 3-5 pairs (or clusters) of notes with meaningful but non-obvious connections. For each:
- Name the notes (with paths)
- Explain the shared theme or tension
- Suggest which note should reference the other and how

Write the output to area/ai/daily/cross-references/suggest/{short-kebab-summary}.md

The filename summary should capture the dominant theme of the connections you found (e.g. suggest-complexity-and-learning.md, suggest-productivity-vs-mindfulness.md).
```

I have no interest in installing skills written by other people, for security (prompt injection) and relevance reasons.

## AI in Your IDE

**I use AI in Neovim with inline completion and chat**.

I get inline completion with GitHub Copilot via the [zbirenbaum/copilot.lua](https://github.com/zbirenbaum/copilot.lua) Neovim plugin. My completion setup is okayish - Copilot can be slow, and I'm still learning how to trigger completions reliably - I really should learn those shortcuts.

I chat with AI in Neovim via [CodeCompanion](https://codecompanion.olimorris.dev/), having recently switched from [CopilotChat.nvim](https://github.com/CopilotC-Nvim/CopilotChat.nvim).

An `AGENTS.md` is commonly used as the place to write custom instructions for agents. CodeCompanion looks for these kinds of agent-steering files and adds them to the IDE chat context automatically. This means the same file steers my terminal agent (Pi) and my IDE chat (CodeCompanion).

A list of capabilities to look for in your IDE - some I have, some I'm still missing:

- **Add files to context**: Add a buffer with `#{buffer}` or a file with `/file` (CodeCompanion syntax).
- **Edit prompts in your editor**: Copy and paste between buffer and chat without friction.
- **Quickly apply AI-generated diffs**: I can't do this yet - it's my biggest gap.
- **Jump to next edit**: Cursor's flagship feature - I haven't replicated it in Neovim.
- **Use `/slash` commands**: Most AI tools expose configuration and tool use through slash commands.
- **Compact memory**: Take part of a session and throw it away or summarise it.
- **Token usage tracking**: Understand where your tokens are going.

## AI in the Terminal

**Terminal agents are where I get the most done with AI**. I started on Claude Code, but increasingly I'm on Pi - it's open source, extensible and lightweight.

**Kimi and Qwen are my daily drivers for LLM models**. GLM is on my radar but my initial experience was bad - mostly the agent acting without my permission (which is likely bad instructions on my part). I've found it's important to emphasise to an agentic coding AI to not do anything unless I ask for it. Without that line, the agent will run off and make changes on its own.

I currently use these Pi extensions:

- **[npm:@aliou/pi-guardrails](https://github.com/aliou/pi-guardrails)**: Safety checks so agents are less likely to read secrets, write protected files, access paths outside the workspace, or run dangerous shell commands by accident.
- **[npm:pi-web-access](https://github.com/nicobailon/pi-web-access)**: Web search, content extraction and video understanding for the Pi agent.
- **[npm:pi-vim](https://github.com/lajarre/pi-vim)**: Vim for the Pi prompt.

With Pi I use OpenRouter as a model provider. OpenRouter has been a great way to quickly access different models (including OpenAI, Claude & Gemini). I started out with Kimi 2.5 (and have been impressed by it) and I'm now using Qwen 3.6. Coming up with an `AGENTS.md` that works for both is an interesting task in itself.

**Terminal agents amplify whatever validation you already have**. Unit tests, linting and type checking become the loop that keeps the agent on track - the better the validation, the more you can leave the agent alone.

A few things you want to be able to do with AI in your terminal:

- **Source control**: Important with agents, as you will often want to throw away their work.
- **Evaluation**: The better validation you have, the more reliably the agent can self-correct.
- **Selecting models**: You should know how to switch models mid-session.
- **Session management**: Branching with `/tree` or resuming with `/resume`.

## Asynchronous Cloud Agents

**Asynchronous agentic AI is the workflow I'm least sure about**. I've only been experimenting with it since the initial OpenClaw hype. I tried OpenClaw and liked the idea of running agents on a schedule, but hated the OpenClaw agent persona. I now use Claude Code's scheduled tasks.

**Review is the bottleneck, not generation**. I'm not trying to run agents 24/7 - one run per day already produces more than I can review. The constraint is my attention, not the agent's throughput.

A few useful agent scheduled tasks have been:

- **Cross-references**: Find thematically connected notes and suggest cross-references between them.
- **Tool searcher**: Look at shell tools in a `Brewfile` and suggest complementary additions with explanations of what value each adds.

It's important that an agent reads what it has done previously - for example with the tool searcher, the AI first checks to see what it has recommended previously, to avoid recommending the same tool every run.

I probably need to tune the schedule down to once or twice per week.

## Roles

Presented in the order I started using each. "Role" here could just as well be "workflow" - these are the roles AI has played for me so far.

### Teacher

**My first use of modern LLM AI was as a teacher**. It can't teach you everything, but it can teach you a lot.

If you're learning something niche or version-specific, you'll need to bring documentation into context yourself.

One useful learning trick is to use AI as a translator from what you know to what you don't:

- Convert Python to JavaScript.
- Generate the raw SQL alongside the SQLAlchemy.

It's about taking advantage of the fact that the AI knows both topics, allowing you to anchor new knowledge to your existing knowledge.

#### Why AI is a Good Teacher

AI has a few properties that make it a strong teacher:

- **Patient**: It will accept any question repeated any number of times.
- **Fast**: No context-switch cost between problems or topics.
- **Not fussy**: Handles malformed and messy inputs.
- **Knowledgeable**: An incredible range of expertise across topics.

A human teacher beats AI on judgement, taste and knowing what you don't know. AI beats a human teacher on availability and throughput.

#### Rewrite the Code by Hand

**A useful but expensive tip for learning with AI is to rewrite by hand any code it generates**. The less you know a language, the more useful this is.

When rewriting, do it in a way where the program is runnable as often as possible - not top to bottom.

This becomes a kind of repetitive practice, which is great for learning something new. It is, however, hard work.

#### Meta-Teaching: Teach the AI to Teach You Better

This is all about looking at a finished session and finding where it went wrong before it went right.

After a chat session, ask the AI:

- **What could I have done to make this chat quicker?**
- **What documentation or code changes would have helped?**
- **What could I add to the repo to help the agent reach its goal faster?**

The answers feed directly back into your `AGENTS.md`, your custom instructions, or the project's docs. Each retrospective makes the next session shorter.

Closely related is **meta-prompting** - asking the AI to improve a prompt before you run it. Useful for prompts you'll run more than once.

These two techniques (meta-teaching & meta-prompting) can be used to improve other AI workflows, such as execution or planning. You can as easily ask how a planning session could have been improved as a teaching session.

### Planner

**Planning is the AI workflow I use the most today**.

The loop is plan, save, review, and finally execute. Decide the task, ask for a plan, save the plan to a file, review it (human or fresh agent), then execute against it.

**The plan file is the artifact**. The chat is disposable - the plan file is what survives lost sessions, model switches, and agent handoffs.

Review is where most of the value lands. A fresh agent has no investment in the plan it's reading - it will push back on assumptions the planning agent quietly made.

#### Plans Go in Files, Not Chats

A plan in a chat dies with the session. A plan in a file persists across sessions, models and agents.

I keep all plans in one directory. This makes it easy for an agent to find and edit an existing plan rather than start a new one. From my `AGENTS.md`:

```markdown
Put your plans into `./ai` - if a plan already exists, use it.
```

An example of what a plan file looks like:

```markdown { title = "ai/refactor-pricing-module.md" }
# Plan: refactor pricing module

## Goal
Split `pricing.py` into `pricing/spot.py` and `pricing/imbalance.py` without changing public API.

## Assumptions
- `PricingClient` stays the single public entry point
- All existing tests pass without modification

## TODO
- [ ] Move `SpotPrice` and helpers to `pricing/spot.py`
- [ ] Move `ImbalancePrice` and helpers to `pricing/imbalance.py`
- [ ] Re-export from `pricing/__init__.py`
- [ ] Run `make test` and `make static`

## Out of scope
- Changing the public API
- Adding new price sources
```

Different models have different blind spots - to take your planning to the next level, plan with one model and then review with another.

#### Planning Uncovers Assumptions

Agents are great at syntax. They are bad at knowing which assumptions you would reject.

The point of the plan is not the TODO list - it's the assumptions section. Force the agent to write down what it's taking for granted before it writes code. Lots of bad agent output traces back to an assumption that was never surfaced.

### Executor

**Letting AI write code on my machine is the newest workflow I've learnt**. It's also the one I trust & use the least.

Most of the code I care about is still hand written - around 80% accounting for the small AI edits and autocomplete.

**Currently I mostly generate one-off, throwaway proof-of-concept code with agents** - this means my most common AI writing code for me' workflow is:

- **Iteratively plan**: Work on multiple iterations of a plan in a Markdown file. Use fresh agents to critique the plan as needed.
- **AI executes once**: AI generates a throwaway version of the plan.  This is used to test the plan, uncover issues and inspire ideas that I can use in the next step.
- **User executes**: I write the final version by hand, using the throwaway code as a reference.

A key factor in agent success is how well it can evaluate its own work - some of the things I've used:

- **Static typing**: `mypy`, `basedpyright` or `pyright` in strict mode - catches most agent hallucinations at the type level.
- **Unit tests**: Fast enough that the agent can run them in a loop.
- **Linting**: `ruff` or equivalent - catches dead imports, unused variables, style drift.

Experienced developers will note that the things allow an agent to validate it's work, such as fast, reliable, useful test suites, are also great for non-AI development. The agent just punishes you faster for not having it, as it can generate code more quickly.

## Working with Others

Most of this post is about how I work with AI - the other area of my work impacted by AI is how other developers I work with do their work.

I've also worked with developers who have grown up in the world of AI. Some are quite competent. I do encourage them to olearn to write by hand - but I appreciate the productivity hit is large.

## Stuff I Don't Know

- **Marking up plans**: How to mark up an AI plan for changes. I just write in a chat - defining syntax like `<human>Remove the section above</human>` has never felt or worked as well as relying on a chat working with the file.
- **Next edit in Neovim**: How to replicate Cursor's TAB (next edit) functionality.
- **Applying diffs**: How to quickly apply AI-generated diffs in Neovim.
- **Copilot triggering**: How to get autocomplete to trigger reliably in Neovim.
- **Magic words**: I'm not sure how much magic words really matter.
- **Set expert role**: I do this, it makes sense, but no idea if it works.

## Summary

My current AI programming stack is:

- **Agent harness**: [Pi Coding Agent](https://pi.dev/) for an agentic terminal coding harness.
- **Model**: Qwen, Kimi or Opus.
- **Model provider**: [OpenRouter](https://openrouter.ai/) provides access to many different models, from Anthropic to Moonshot AI.
- **Chat**: [CodeCompanion](https://codecompanion.olimorris.dev/) for chat in Neovim.
- **Autocomplete**: [zbirenbaum/copilot.lua](https://github.com/zbirenbaum/copilot.lua) for inline completion in Neovim with Github Copilot.

Currently, my main workflows with AI are:

- **Teacher**: Learning new things with a patient, knowledgeable teacher.
- **Planner**: Creating multiple iterations of plans on how to do programming tasks.
- **Proof of Concept Generator**: Most of the code AI writes is proof-of-concept, throwaway implementations that I can use to test ideas quickly, or to learn from for my actual hand written implementation.

A few of the key points:

- **Stochastic**: LLMs are non-deterministic - the same prompt will not return the same thing twice.
- **Context**: Context management is the key AI technique - know when to add, when to reset.
- **Custom Instructions**: You should set these in every AI tool, before you do anything else.
- **Plan, then execute**: The plan file is the artifact that survives sessions and model switches.
- **Validation**: Static typing, tests and linting are what let you set and forget an agent.

**Many of the best practices for working with AI also hold true when working with others**. Examples, clear evaluation, asking for a plan, and repeating the important bits are all great tips for working with people too.

Thanks for reading!
