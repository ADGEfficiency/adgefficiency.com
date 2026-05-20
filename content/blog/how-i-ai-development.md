---
id: how-i-ai-development
aliases: []
tags: []
competencies:
  - AI
  - Software Engineering
  - How I
date_created: "2026-05-19"
description: My current stack and habits for programming with AI — from IDE plugins to scheduled cloud agents.
draft: false
title: How I Program with AI
---

## Introduction

**These are my notes on programming with AI, as of May 2026**. A snapshot of a workflow that I expect to be wrong by this time next year.

**I'm documenting it because writing it down helps me improve it**. The act of explaining how I work surfaces how I think and gaps holding me back.

**My current stack**: Pi for an agentic terminal coding harness with Qwen, Kimi or Opus as the LLM model. In Neovim with CodeCompanion for chat and Copilot for inline completion.

## The Basics

Some of the basic knowledge needed to work with large language model (LLM) based AI.

### LLMs are Random

**LLMs are stochastic - the same prompt will not return the same thing twice**. Build your workflows assuming this, not despite it.

Things that change between one prompt and the next when using a cloud-based LLM:

- **Sampling temperature**: Most providers use non-zero temperature, randomising token selection.
- **Model retraining**: The same model name can point to different weights over time.
- **System prompts and tools**: Provider-side changes to system prompts, tools and skills are invisible to you.
- **Routing**: Meta systems that route prompts to different underlying models can change which model you actually hit.

On top of stochastic outputs, the environment itself is non-stationary - what is true about LLMs today might not be true next month:

- **Models get better**: Previously necessary instructions or techniques become counterproductive.
- **Models get worse**: Bugs and optimisations can degrade quality intermittently.
- **Models get retired**: A model you depend on will be taken away with a few months' notice.

The practical implication: don't build workflows that depend on exact outputs. Build workflows that validate outputs instead.

### Context is King

**Context is the data the LLM uses to predict the next token**. Managing it is the key skill in using LLMs well.

Context includes the system prompt (set in secret by the LLM provider), your user messages, and every prior response from the model:

```json
[
  { "role": "system", "content": "You are an expert software developer." },
  { "role": "user", "content": "Add a summary to my blog post." },
  { "role": "assistant", "content": "Here's a summary: ..." },
  { "role": "user", "content": "Now write a commit message." }
]
```

There are two skills - knowing when to add to context, and knowing when to throw it away.

**Adding** is the obvious half: paste the failing test, attach the file, link the docs, include the example. Most prompting advice is about this.

**Throwing away** is the half people miss. A session where context rot has set in - the model is going in circles, repeating mistakes, or refusing to consider alternatives - is a dead session. Start a new one. This should happen multiple times in a single piece of work, not once at the end.

### Customize Your Instructions

**Custom instructions are the highest-value setting in any AI tool**. When you start using a new AI tool, configure these before anything else.

Custom instructions are a persistent context injection - they get prepended to every prompt (or every prompt in a specific project). That's why they're high leverage: one edit changes the behaviour of every future session.

They live in different places depending on the tool - ChatGPT settings, Cursor rules, `AGENTS.md`, `CLAUDE.md`. Same idea, different filenames.

A small example of instructions that mirror my own:

```markdown
You are an expert data scientist.

Be concise.

Push back and offer alternative ideas.

All Python must be statically typed.

Do not start implementing anything without a plan and user approval.
```

The last line is the one that matters most for agentic coding. Without it, the agent will start writing code the moment you describe a problem - and the code is almost always against the wrong plan.

### Control Thinking Level

**Modern models let you control how much they think before they answer**. Claude has extended thinking, GPT-5 has reasoning effort, Qwen has thinking mode. The knob is exposed - use it.

Crank thinking up for planning, debugging and anything ambiguous. The extra latency and tokens are worth it when the cost of a wrong answer is high.

Crank it down (or off) for mechanical edits and fast iteration. A typed refactor doesn't need a reasoning model - it needs a fast one.

The default is rarely the right setting. Most tools ship with a middling default that's bad at both extremes.

### Understand Tool Use

**A tool call is the LLM doing something other than generating text** - searching the web, reading a file, editing your code, running a shell command. Tool use is what turns a chat into an agent.

You should be able to see every tool call as it happens. If you can't, switch tools or change settings until you can.

Two reasons it matters. **Security**: an agent running unexpected tools is the first sign something is wrong - a tool call you didn't ask for is a prompt injection waiting to be confirmed. **Debugging**: tool failures look different from model failures. A failed `grep` is not a hallucination; a confidently wrong file edit is.

The set of available tools defines what the agent can actually do. An agent with no shell tool can't `rm -rf /`. An agent with no web search can't be prompt-injected via a poisoned page. Tool selection is a security decision.

### Beware Hallucinations

**LLMs sample from a probability distribution over the next token**: $P(\text{next token} | \text{context})$. Sampling means the model can confidently produce false facts - this is what we call a hallucination.

Managing context well reduces hallucinations. Resetting a poisoned session, adding correct documentation, and giving the model the right files all cut the rate. But the rate is never zero - hallucinations should always be expected and planned for.

**Validation is the second line of defence**. Tests, type checking and linting catch hallucinations before they ship.

The practical implication: never trust model output without a way to check it.

### Scare Yourself with Security

**Prompt injection is the scariest risk with LLMs**. Malicious prompt text gets injected into context (e.g. during a web search the agent runs) and instructs the LLM to do bad things on whatever machine the LLM can run tools on.

**The other risk is the agent doing `rm -rf /`** - or any equivalent destructive command. An agent with shell access is an agent that can delete your work.

Sandboxes help with both, but I've never used one when running an agent in my terminal. The guardrails I do use are coarse - the [pi-guardrails](https://github.com/aliou/pi-guardrails) extension blocks the worst commands, and I keep anything important in source control.

## Writing Good Prompts

**Prompts are how you steer an LLM to program the way you want**. Everything else is decoration.

**Context is the main lever**. "Make prompts good by adding good context" is a bit reductive, but it's also the truth - most bad output traces back to missing context, not bad phrasing.

**The tips below are what you reach for once the context is right**. They don't substitute for context, they amplify it.

### Add Context Where the LLM Will Struggle

LLMs have predictable weak spots. Add context there before anything else:

- **Library versions**: Specify versions when different versions are incompatible (e.g. Pydantic 1 vs 2).
- **Documentation**: Paste in docs for the version of the library you're actually using - the model's training data may be stale.
- **Your conventions**: Code style, naming, project structure - things the model can't infer from the file you're editing alone.

### Prompting Tips

A few tips that earn their keep:

- **Use examples**: Probably the highest-value prompting tip. One example beats three paragraphs of description.
- **Role**: Set a role or persona at the top of the prompt.
- **Clear evaluation**: Be explicit about how the output will be judged and how much output you expect.
- **Plan**: Ask for a plan before any code.
- **Repeat yourself**: Repeat the important bits at the top and bottom of large prompts.

## A Few Custom Skills

**A skill is specialised knowledge an agent can load on demand**. I'm just starting out with them.

**The trigger for writing a skill is repetition**. If you explain something to an agent repeatedly, or it does a task often, that's a skill waiting to be written.

**Skills live either local or global** - local in something like `.agents/skills`, global in something like `~/.agents/skills`. Local for project-specific knowledge, global for cross-project workflows.

### How Skills Work

A skill is a markdown file with a description in the frontmatter and instructions in the body. The description is what the model sees up front - the body only gets loaded into context when the model decides the skill is relevant.

This matters because context is finite. Loading every skill into every session would burn tokens on knowledge you don't need. Lazy loading is the whole point.

### An Example Skill

I have a few small skills and mostly use them in scheduled Claude Code jobs. This is the skill behind the cross-references task mentioned above:

```markdown
---
id: cross-references
aliases: []
tags: []
description: Find thematically connected notes and suggest cross-references between them.
---

Find notes that share themes or ideas but aren't linked to each other.

Before starting, read `area/ai/index.md` (if it exists) to understand existing AI-generated content and avoid duplicating covered ground.

First, randomly pick 20 markdown notes from resource/, resources/programming/, area/, area/blogs/, area/writing/, and area/inbox/final-personal-blog/_pre_drafts/ (mix of all, including drafts). Use a randomized approach — e.g. list all .md files, shuffle, take the first 20. Read all 20 notes in full.

Then, based on what you've read, find 3-5 pairs (or clusters) of notes with meaningful but non-obvious connections. For each:
- Name the notes (with paths)
- Explain the shared theme or tension
- Suggest which note should reference the other and how

Write the output to area/ai/daily/cross-references/suggest/{short-kebab-summary}.md

The filename summary should capture the dominant theme of the connections you found (e.g. suggest-complexity-and-learning.md, suggest-productivity-vs-mindfulness.md).
```

### Why I Avoid Third-Party Skills

I have no interest in installing skills written by other people. Two reasons:

- **Prompt injection risk**: A third-party skill is code that runs in your agent's context. Treating it as trusted input is the same mistake as `curl | bash`.
- **Relevance**: Skills earn their place by matching *your* workflows. A generic skill is by definition not matched to yours - if it were, you'd have written it.

## AI in Your IDE

**I use AI in Neovim with inline completion and chat**. Two different tools, two different jobs.

**Inline completion is Github Copilot** via the [zbirenbaum/copilot.lua](https://github.com/zbirenbaum/copilot.lua) plugin. My setup is okayish - Copilot can be slow, and I'm still learning how to trigger completions reliably. Sometimes it refuses to give me anything.

**Chat is [CodeCompanion](https://codecompanion.olimorris.dev/)**. I've previously used [CopilotChat.nvim](https://github.com/CopilotC-Nvim/CopilotChat.nvim) for most of my in-editor AI work and recently switched.

### AGENTS.md as Steering

An `AGENTS.md` is commonly used as the place to write custom instructions for agents. CodeCompanion looks for these kinds of agent-steering files and adds them to the IDE chat context automatically.

This means the same file steers my terminal agent (Pi) and my IDE chat (CodeCompanion). Write the instructions once, get them everywhere.

### What You Want from an IDE AI

A list of capabilities to look for - some I have, some I'm still missing:

- **Add files to context**: Add a buffer with `#{buffer}` or a file with `/file` (CodeCompanion syntax).
- **Edit prompts in your editor**: Copy and paste between buffer and chat without friction.
- **Quickly apply AI-generated diffs**: I can't do this yet - it's my biggest gap.
- **Jump to next edit**: Cursor's flagship feature - I haven't replicated it in Neovim.
- **Use `/slash` commands**: Most AI tools expose configuration and tool use through slash commands.
- **Compact memory**: Take part of a session and throw it away or summarise it.
- **Token usage tracking**: Understand where your tokens are going.

## AI in the Terminal

**Terminal agents are where I get the most done with AI**. I use either Claude Code or, more commonly, Pi as an agent harness with an OpenRouter model backend.

**Pi is my default harness**. I started on Claude Code, but more and more I'm on Pi - it's open source, extensible and lightweight.

**Kimi and Qwen are my daily drivers**. GLM is on my radar but my initial experience was bad - mostly the agent acting without my permission.

### Pi Extensions

The extensions I currently use:

- **[npm:@aliou/pi-guardrails](https://github.com/aliou/pi-guardrails)**: Safety checks so agents are less likely to read secrets, write protected files, access paths outside the workspace, or run dangerous shell commands by accident.
- **[npm:pi-web-access](https://github.com/nicobailon/pi-web-access)**: Web search, content extraction and video understanding for the Pi agent.
- **[npm:pi-vim](https://github.com/lajarre/pi-vim)**: Vim for the Pi prompt.

With Pi I use OpenRouter as a model provider. I started out with Kimi 2.5 (and have been impressed by it) and I'm now using Qwen 3.6. Coming up with an `AGENTS.md` that works for both is an interesting task in itself.

### Validation Lets You Set and Forget

Terminal agents amplify whatever validation you already have. Unit tests, linting and type checking become the loop that keeps the agent on track - the better the validation, the more you can leave the agent alone.

The other side of that is the instruction. I've found it's important to emphasise to an agentic coding AI to not do anything unless I ask for it. Without that line, the agent will run.

### What You Want from a Terminal Harness

A few things you want to be able to do:

- **Source control**: Important with agents, as you will often want to throw away their work.
- **Evaluation**: The better validation you have, the better the agent will be at improving itself.
- **Selecting models**: You should know how to switch models mid-session.
- **Session management**: Branching with `/tree` or resuming with `/resume`.

## Asynchronous Cloud Agents

**Scheduled AI is the workflow I'm least sure about**. I've only been experimenting with it since the initial OpenClaw hype.

**OpenClaw got the idea right and the execution wrong**. I liked the concept of a scheduled LLM, was semi-impressed by connecting one to a phone, but hated the implementation and persona. I now use Claude Code's scheduled tasks instead.

**Review is the bottleneck, not generation**. I'm not trying to run agents 24/7 - one run per day already produces more output than I can review. The constraint is my attention, not the agent's throughput.

A few useful agent scheduled tasks have been:

- **Cross-references**: Find thematically connected notes and suggest cross-references between them.
- **Tool searcher**: Look at shell tools in a `Brewfile` and suggest complementary additions with explanations of what value each adds.

### The Review Loop

Scheduled output that doesn't get reviewed is worse than no output. It rots in a directory and trains you to ignore the agent.

My loop for each scheduled run:

- **Skim everything**: One pass, fast. Most of it gets deleted.
- **Promote the useful parts**: A cross-reference suggestion becomes an edit to a real note. A tool suggestion becomes a line in the `Brewfile`. The artifact moves out of `area/ai/` and into the codebase or vault.
- **Delete the rest**: The default destination for scheduled output is the bin.

The promotion step is where the value is. If nothing gets promoted, the task isn't pulling its weight and should be turned off or rewritten.

### Why Not 24/7

The constraint on running agents continuously isn't cost or capability - it's backlog.

Each run produces output that has to be cleared before the next run is useful. Run twice as often and you don't get twice the value, you get the same value plus twice the noise to triage.

One run per day is already at the edge of what I can review. Anything faster would mean either reviewing less carefully, or ignoring runs entirely - both of which defeat the point.

## Roles

Presented in the order that I started using each way of working with AI.

### Teacher

**My first use of modern AI was as a teacher**. GPT 3.5 onwards - it can't teach you everything, but it can teach you a lot.

**AI teaches popular topics well and esoteric topics badly**. The wider the training data, the better the teacher - if you're learning something niche or version-specific, you'll need to bring documentation into context yourself.

**The trick is to use AI as a translator from what you know to what you don't**. Convert Python to Javascript. Generate the raw SQL alongside the SQLAlchemy. Anchor new knowledge to existing knowledge.

#### Why AI is a Good Teacher

AI has a few properties that make it a strong teacher:

- **Patient**: It will accept any question repeated any number of times.
- **Fast**: No context-switch cost between problems or topics.
- **Not fussy**: Handles malformed and messy inputs.
- **Knowledgeable**: An incredible range of expertise across topics.

A human teacher beats AI on judgement, taste and knowing what you don't know. AI beats a human teacher on availability and throughput.

#### Rewrite the Code by Hand

**The single best tip for learning with AI is to rewrite by hand any code it generates**. The less you know a language, the more important this is.

When rewriting, do it in a way where the program is runnable as often as possible - not top to bottom. Type a few lines, run it, type a few more. The feedback loop is the lesson.

Reading AI-generated code feels like learning. It isn't. Typing it is.

#### Meta-Teaching: Teach the AI to Teach You Better

The other half of teaching is the retrospective - looking at a finished session and finding where it went wrong before it went right.

After a chat session, ask the AI:

- **What could I have done to make this chat quicker?**
- **What documentation or code changes would have helped?**
- **What could I add to the repo to help the agent reach its goal faster?**

The answers feed directly back into your `AGENTS.md`, your custom instructions, or the project's docs. Each retrospective makes the next session shorter.

Closely related is **meta-prompting** - asking the AI to improve a prompt before you run it. Useful for prompts you'll run more than once.

### Planner

**Planning is where AI earns its keep**. I only let AI write about 20-30% of the code I care about, but I use it as a planner for most non-trivial work.

**The loop is plan, save, review, execute**. Decide the task, ask for a plan, save the plan to a file, review it (human or fresh agent), then execute against it.

**The plan file is the artifact**. The chat is disposable - the plan file is what survives lost sessions, model switches, and agent handoffs.

#### The Planning Loop

The loop has four steps:

- **Decide the task**: Be explicit about scope and evaluation. Split complex tasks into smaller plans.
- **Generate the plan**: Ask for an explicit TODO list - this doubles as a progress tracker during execution.
- **Save the plan**: Write it to a file in a known location.
- **Review the plan**: A fresh agent or a human reads the plan before any code is written.

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

**Should plans be edited, or should you leave notes alongside them?** I edit. A plan that doesn't reflect what was actually built is worse than no plan. If the agent deviates, the plan gets updated - the file is the current truth, not a historical record. Source control keeps the history.

#### Cross-Model Review

Different models have different blind spots. Plan with one, implement with another, review with a third - the disagreements are where the interesting problems live.

A rough split that has worked for me:

- **Plan with a strong reasoning model**: Gemini or GPT-5 for the initial plan.
- **Implement with a fast coding model**: Qwen or Kimi via Pi for execution.
- **Review with a different model**: Claude or Codex on the finished diff.

This is expensive in attention, not tokens - you have to actually read what each model says.

#### Planning Uncovers Assumptions

Agents are great at syntax. They are bad at knowing which assumptions you would reject.

The point of the plan is not the TODO list - it's the assumptions section. Force the agent to write down what it's taking for granted before it writes code. Most bad agent output traces back to an assumption that was never surfaced.

### Executor

**Letting AI write code on my machine is the newest workflow I've learnt**. It's also the one I trust least.

**Most of the code I care about is still hand written** - around 80%. The other 20% is where the agent's strengths and my validation overlap.

**Validation is what turns an agent from a liability into a tool**. Without tests, types and linting, an executing agent is just generating plausible-looking diffs.

#### What I Let AI Execute

The agent is good at mechanical work with a clear definition of done:

- **Typed refactors**: Renames, moves, signature changes - `make static` is the oracle.
- **Test scaffolding**: Writing fixtures and parametrised cases against an existing API.
- **Boilerplate**: Config, CLI plumbing, repetitive data class definitions.
- **Small, isolated bug fixes**: Where a failing test exists or can be written first.

The agent is bad at work where the definition of done lives in my head:

- **Anything touching naming or API design**: The agent will pick something plausible and wrong.
- **Code I want to understand deeply**: Writing it myself is the learning.
- **Cross-cutting changes**: Where the right answer requires holding the whole system in mind.

#### Validation is the Foundation

The key factor in agent success is how well it can evaluate its own work.

A good validation stack for an executing agent:

- **Static typing**: `mypy`, `basedpyright` or `pyright` in strict mode - catches most agent hallucinations at the type level.
- **Unit tests**: Fast enough that the agent can run them in a loop.
- **Linting**: `ruff` or equivalent - catches dead imports, unused variables, style drift.
- **A single `make` target**: `make check` runs all of the above. The agent only needs to know one command.

Experienced developers will note that all of this - fast, reliable, useful test suites - is also great for non-AI development. The agent just punishes you faster for not having it.

#### Watch the Tests

Agents will modify tests to make them pass. This is the single most common failure mode of set-and-forget execution.

A few defences:

- **Review the diff, not the output**: Don't trust "all tests pass" - check what changed in the test files.
- **Pin the tests in the plan**: State explicitly which tests must not be modified.
- **Use source control as a tripwire**: `git diff tests/` before accepting any agent work.

#### Don't Let Agents Touch Source Control

I rarely want an AI to commit to Git. A few times I've let an agent go end-to-end - opening and merging the PR on Github - and it worked, but I don't trust it yet.

The asymmetry is bad: the agent can ship a regression in seconds, and I'll spend hours unwinding it. Source control is the one place where a human checkpoint is cheap and the alternative is expensive.

## Stuff I Don't Know

How to markup an AI plan to be changed - I will just write in a chat.  I guess I can just define some syntax like:

```markdown
<human>Remove the section above</human>
```

But it's never felt or worked as well as just relying on a chat working with the file.

I don't know how to replicate the TAB functionality in Cursor in Neovim.

Quickly apply AI generated diffs - I don't know how to do this in Neovim.

## Summary

**The job is context management, not prompting**. Everything else is downstream of that.

A few of the key points:

- **Stochastic**: LLMs are non-deterministic - the same prompt will not return the same thing twice.
- **Context**: Context management is the key AI technique - know when to add, when to reset.
- **Custom Instructions**: You should set these in every AI tool, before you do anything else.
- **Plan, then execute**: The plan file is the artifact that survives sessions and model switches.
- **Validation**: Static typing, tests and linting are what let you set and forget an agent.

The best practices for prompting - examples, clear evaluation, asking for a plan, repeating the important bits - are also the best practices for working with other people. None of this is really about AI.

Thanks for reading!
