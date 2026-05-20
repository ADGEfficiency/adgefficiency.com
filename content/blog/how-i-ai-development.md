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

These are my notes on using AI for development/coding/programming.

They are a snapshot of how I use AI (artificial intelligence) for development (aka coding, programming) as at May 2026.

I'm documenting it because I'm interested in improving how I work.

## The Basics

Some of the basic knowledge needed to work with large language model (LLM) based AI.

### LLMs are Random

LLM based AI is stochastic. The same prompt should not be expected to return the same thing if run multiple times.

Some of the many things that can change between one prompt and another when using a cloud based LLM:

- Configured to be stochastic at the token generation level, via a non-zero temperature
- Can be retrained (model parameters have changed)
- System prompts, tools & skills can be changed (tool & skill Markdown changed)
- Meta systems that route prompts to different models can change

This stochastic nature is complemented by a high non-stationary environment (ie AI tooling is getting better, on average, all the time) - what is true about LLMs and AI today might not be true in the future:

- Models get better, making previously necessary instructions or techniques counterproductive
- Models might get worse sometimes
- Models will be retired and taken away
- Bugs/optimizations that break model quality intermittently

### Context is King

Context is the data available to an LLM, that it uses to predict the next token.

Context includes the system prompt (set in secret by the LLM provider), your user messages and the response from the LLM:

```json
[
  { "role": "system", "content": "You are an expert software developer." },
  { "role": "user", "content": "Add a summary to my blog post." },
  { "role": "assistant", "content": "Here's a summary: ..." },
  { "role": "user", "content": "Now write a commit message." }
]
```

Managing context provided to an LLM is perhaps the key skill in using LLMs well.

Mastering context management is done in a few different ways:

- When to add information into context - examples
- When to reset the context (by starting a new session)
- How to add custom instructions that are added to context each time you use a LLM

Removing poisoned sessions (sessions where context rot has set in) should potentially happen multiple times in a single session. Sometimes it's just to get an AI that will consider different paths, other times to reset a dead-end.

### Customize Your Instructions

Custom instructions are perhaps the highest value technique to get more out of AI tools - **when you start using any AI tool, your first thing to configure should be custom instructions**. 

Commonly custom instructions will be added into every prompt (or every prompt in a specific project), making them a good place for steering how you want an AI to behave based on general or specific instructions.

A small example of instructions that mirror my own:

```markdown
You are an expert data scientist. 

Be concise. 

Push back and offer alternative ideas. 

All Python must be statically typed.

Do not start implementing anything without a plan and user approval.
```

The last line is important for agentic coding - to explicitly say don't implement yet.

### Control Thinking Level 

Give time to "think"

### Understand Tool Use

Know when your LLM is using tools like searching the internet, editing your code or running code.

### Beware Hallucinations

LLMs create probability distributions of $P(\text{next token} | \text{context})$ - the probability of any token given context.

This probability distribution is sampled from, which leads to the possibility of hallucinations - which appear as the LLM making up and being confident in false facts.

LLM users that are highly skilled at managing context (adding or resetting) will experience fewer hallucinations. The likelihood of hallucinations can be reduced by managing context well, but the possibility of hallucinations should always be expected and planned for.

Workflows that have validation built in are able to reduce the likelihood of hallucinations causing problems.

This means you must remain vigilant when working with LLM based AI.  See this scepticism as a way to keep you honest and engaged.  This tendency to hallucinate means you always need to think about what Chat GPT has generated.

### Scare Yourself with Security

A scary risk with using LLMs is **prompt injection**, where bad prompt text is injected (ie during a LLM web search) into LLM context, asking the LLM to do bad things on whatever machine the LLM can run tools on.

Another risk with agentic coding is the agent doing `rm -rf /`.  Sandboxes are something that can help, but I've never used one when I'm using an agent in my terminal.

## Writing Good Prompts

Prompts are how you can steer an LLM to program the way you want.  

The most useful thing you can add to any prompt is context.  While this is a bit reductive (make prompts good by making them good), context is king.  

Look to add context where an LLM might struggle:

- Specify versions of libraries when different versions are incompatible (ie Pydantic 1 and 2)
- Add documentation correct for the version of libraries you are using

A few tips:

- **Use Examples**: Probably the highest value prompting tip
- **Role**: Set a role or personna
- **Clear Evaluation**: Be explicit about how it will be judged & how much output expected
- **Plan**: Ask for a plan
- **Repeat Yourself**: Repeat the important bits (top & bottom) - useful for large prompts

All of these are also great instructions for how to communicate & work effectively with others.

## A Few Custom Skills

I'm just starting out with skills.

A skill is loaded on demand - it's description allows a model to not load entire skill into context.

A skill is specialized knowledge. If you explain something repeatedly or do a task often, this is skill waiting to be written.

Skills can be either local (in something like `.agents/skills`) or global (is something like `~/.agents/skills`).

I have a few small skills and mostly use them in a scheduled Claude Code job - an example of a cross references skill that finds links between my personal notes:

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

I have no interest in third-party skills - both for the security prompt injection risk and because I want skills relevant to my workflows.

## AI in your IDE

I use AI in my IDE (Neovim) with inline completion and chat.

For inline completion I use Github Copilot with the [zbirenbaum/copilot.lua](https://github.com/zbirenbaum/copilot.lua) plugin - my setup is okayish, and Copilot can be a bit slow. I've still got a bit to learn about how to trigger completions - sometimes Copilot refuses to give me anything.

For chat I currently use [CodeCompanion](https://codecompanion.olimorris.dev/), but have actually used [CopilotChat.nvim](https://github.com/CopilotC-Nvim/CopilotChat.nvim) for most of my chat within editor AI tooling experience.

An `AGENTS.md` is commonly used as a place to write custom instructions for agents - my CodeCompanion chat will look for and add these kind of agent steering files into your IDE chat context.

Some of the things you want to be able to do:

- **Add Files to Context**: Adding buffer with `#{buffer}` or adding a file with `/file` (examples for CodeCompanion in Neovim)
- **Edit Prompts in Your Editor**: copy paste between the two easily
- **Quickly Apply AI Generated Diffs**: I can't do this yet!
- **Jump to Next Edit**: Cursor functionality - I can't do this either :(
- **Use `/slash` Commands**: Many AI tools offer configuration or tool use through `/slash` commands.
- **Compact Memory**: Taking part of a session and throwing it away or summarizing it.
- **Token Usage Tracking**: Understand where tokens are going

## AI in the Terminal

I use AI in my terminal using either Claude Code, or more commonly Pi as an agent harness, with an OpenRouter model backend.

For harnesses, I started out using Claude Code, but more and more I'm using Pi, as it's open source, extensible and lightweight.  

For models, I've used both Kimi and Qwen as daily drivers. GLM is on my radar, but I had bad initial experience (mostly around the agent acting without my permission).

I currently use the following Pi extensions:

- [npm:@aliou/pi-guardrails](https://github.com/aliou/pi-guardrails): Safety checks to Pi so agents are less likely to read secrets, write protected files, access paths outside the workspace, or run dangerous shell commands by accident.
- [npm:pi-web-access](https://github.com/nicobailon/pi-web-access): Web search, content extraction, and video understanding for Pi agent
- [npm:pi-vim](https://github.com/lajarre/pi-vim): Vim for the Pi prompt.

With Pi I use Openrouter as a model provider.  I started out (and have been impressed by) Kimi 2.5, and I'm now using Qwen 3.6. It's an interesting task coming up with an `AGENTS.md` that works for both.

I've found it's really important to emphasize to agentinc coding AI to not do anything unless I ask for it.

Validation is particularly powerful for terminal coding agents, as you can `set and forget` and rely on the test validation (unit tests, linting, type checking etc) to keep the agent on track.  Make sure to check that the agent has not changed the test code.

Some of the things you want to be able to do:

- **Source Control**: Important with agents, as you will often want to throw away their work.
- **Evaluation**: The better validation or evaluation you have, the better the agent will be at improving itself.
- **Selecting Models**: You should know how to switch models.
- **Session Management**: Branching with `/tree` or resuming sessions with `/resume`.

## Asynchronous Cloud Agents

I've only been experimenting with scheduled AI since the initial OpenClaw hype.  I tried OpenClaw - I like the idea of the scheduled LLM, was semi-impressed by connecting an LLM to a phone, but I hated the OpenClaw implementation and personna.

Claude Code currently has the ability to run scheduled tasks, which I'm currently using.

I'm not trying to run AI agents 24/7 - one run per day has already been overwhelming in terms of the amount an LLM can produce.  It all needs my review, so I'm quickly the bottleneck.

A few useful agent scheduled tasks have been:

- **Cross-References**: Find thematically connected notes and suggesting cross-references between them.
- **Tool Searcher**: Look at shell tools in a `Brewfile` and suggest complementary additions with explanations of what value each adds.

## Roles

Presented in the order that I started using each way of working with AI.

### Teacher

My first use of modern AI (GPT 3.5 onwards) was as a teacher. AI can't teach you everything - but it can teach you a lot.  

Examples were:

- Teach a Python developer Javascript by converting Python code to the Javascript equivalent.
- Teach you SQL by creating both the raw SQL and SQLAlchemy Python code to create a database table from a dictionary.

A teacher will be better on more popular topics or languages. If something is esoteric or requires specifics (ie a specific version of a library that has changed), you should include it into context.

There are many ways in which AI can be a good teacher:

- **Patient**: AI will accept any level of question repeated any number of times.
- **Fast**: Doesn't require any time to context switch between problems.
- **Not Fussy**: Can handle malformed & messy inputs.
- **Knowledgeable**: An incredible range of expertise on a wide range of topics.

**A great tip with using AI when learning a new language is to rewrite by hand any code in generates**. The less you know a language, the more likely you should be rewriting the code.  When rewriting, rewrite in a way where the program is as runnable as often as possible, rather than top to bottom.

**A meta-teaching strategy is to analyze previous session and find places where agent went wrong way and later found the right way**. 

After a chat session, ask the AI:

- What could I have done to make this chat quicker?
- What documentation or code changes you we add to help?
- Make recommendations on what I could have added to the repo that would help the agent reach it's goal faster.

Closely related is meta-prompting - asking AI to improve a prompt.

### Planner

One of my most common workflows in my job (although I probably only use AI for 20 to 30% of my development) is recursive planning into execution.

The most solid plan loop involves first deciding what task you want completed.  All the regular prompt engineering tips apply (for example being clear about evaluation) as well as additional considerations as to whether to split a complex task into smaller tasks.

generating a plan, saving the plan to a file, then reviewing the plan.  Review can be a human, or a fresh agent.

The ability to plan, then get a fresh agent to critique and improve it is very powerful.

Ask for an explicit TODO list, that can serve as a progress tracker.

Cross-model review (e.g., plan with Gemini, implement with Claude, review with Codex) can potentially surface different blind spots.

When planning, you want to uncover an agents assumptions.  Agents are great at syntax, but different assumptions are problems.

Using a concrete file as the plan
- can be edited, add notes, persistls
- should plans be edited, ro should you leave notes?

Plans all go in same place - makes it easy for AI to edit existing plan if it exists.  I have this instruction as part of my `AGENTS.md`:

```markdown
Put your plans into `./ai` - if a plan already exists, use it.
```

Also helps with session management - if you lose your chat history, or want to use a different LLM, the concrete plan file helps.

### Executor

Getting an AI to write code on your machine was the most recent workflow I've learnt.

After planning, sometimes I'll let the AI do it - other times I'll do it myself. Probably around 80% of the code I care about is hand written.

Very rarely do I want an AI to commit to Git - a few times I've had an AI go end to end (including opening & merging the PR on Github) but I don't quite trust AI with source control yet.

The key factor in your success is how well an agent can evaluate it's work.

Best experience = static typing stuff (mostry the returns in test funcs etc) - just let it run `make static`

Experienced developers will note that all this (fast, reliable & useful test suites) is also great for sans-AI development.

## Stuff I Don't Know

How to markup an AI plan to be changed - I will just write in a chat.  I guess I can just define some syntax like:

```markdown
<human>Remove the section above</human>
```

But it's never felt or worked as well as just relying on a chat working with the file.

I don't know how to replicate the TAB functionality in Cursor in Neovim.

Quickly apply AI generated diffs - I don't know how to do this in Neovim.

## Summary

A few of the key points:

- **Stochastic**: LLMs are non-deterministic
- **Context**: Context management is the key AI technique
- **Custom Instructions**: You should set these in every AI tool

Some of the best practices for prompting are also great for working with others:

---

Thanks for reading!
