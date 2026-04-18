---
title: How I use AI for Development
description: TODO
date_created: 2026-04-05
competencies:
  - AI
  - Software Engineering
  - How I
---

Titles
- my notes on ai development
- how i use ai for programming
- how i program with ai
- XXX levels of ai programming development

## Introduction

This blog post is a snapshot in time of how I use AI for development (aka coding, programming).

## The Basics

Some of the basic knowledge needed to work with large language models (LLMs).  Most apply across non-development tasks as well.

### LLMs are Random

This means the same prompt should not be expected to return the same thing

LLMs should be treated as stochastic (ie random). A few of the things that can change between one prompt and another when using a cloud based LLM:

- Configured to be stochastic at the token generation level
- Can be retrained (model parameters changed)
- Tools & skills can be changed (tool & skill markdown changed)

This stochastic nature is complemented by a non-stationary environment:
- Models keep improving, making previously necessary instructions counterproductive
- Models will be retired and taken away

### Context is King

Context is the text available to an LLM.  It includes the system prompt (set in secret by the LLM provider), your user messages and the response from the LLM.

```
TODO - example of system prompt, user message and response, and how they all interact to create the context for the next prompt
```

Context is important as the LLM uses this context to generate the next response.  Managing context provided to an LLM is perhaps the key skill in using LLMs.

This means you need to master a few things

- How to add custom instructions that are added to context each time you use a LLM
- When to add information into context - examples
- When to reset the context (by starting a new session)

Custom instructions are perhaps the highest value tip - when you start using any AI tool, your first thing to configure should be custom instructions.  Commonly custom instructions will be added into every prompt, making them a good place for steering how you want an AI to behave based on general or specific instructions.

Behaviour you always (or almost always want)

- Ask to be more concise
- Ask to push back and offer alternative ideas
- Apply coding standards (`all Python staticially typed`)

```
TODO - example of my custom instructions
```

### Hallucinations

LLMs can make up facts.  How likely this is depends on how good you are at managing the context (see above), or using workflows that have valiadion built in (see below).

LLM users that are highly skilled at managing context (adding or resetting) will experience fewer hallucinations.

### Security

`/sandbox`

prompt injection

source control helps, but if you are letting your agent do `rm -rf`, that risk exists - it's a tradeoff

## Tools

### Chat

I've used two LLM chat apps - OpenAI (from XXXX to XXXX) & Claude (from XXXX to now).  Today, Claude is the superior product - I would not recommend anything else.

Never expect that your chat history will not be trained on - even if the current ToS says it won't be.  At least it's a risk.

The things you need to be able to do with a AI chat app is how to configure instructions, and perhaps use different models if you are hitting usage limits for more powerful models.

### IDE

IDE can matter a lot here - Cursor is a different philosophy of IDE versus vanilla VS Code.

Skills
- source control
- autocomplete (commonly github copilot)
- edit prompts natively in your editor, copy paste between the two easily
- quickly applying AI generated diffs
- jump to next place (cursor functionality)

<C-y> — apply nearest diff to the source buffer
gj — jump to the section of nearest diff
gd — show diff between source and nearest diff
gqd — add all diffs to quickfix list

### Terminal

Openrouter to get cheap models - Kimi, GLM 5 prices verus Sonnet & Opus.  Then need to use PI.

Agent harness (PI, Claude Code) versus model provider (OpenAI, Anthropic) 

I've used two terminal coding agents - Claude Code & PI.  While I like pi and will keep checking it out, Claude Code is the superior product.  Even if other coding agents can use the same base LLM (like Claude Opus), differentiators such as tools, system prompts or TUI performance matter a lot.

Validation is particularly powerful for terminal coding agents, as you can `set and forget` and rely on the test validation (unit tests, linting, type checking etc) to keep the agent on track.  Make sure to check that the agent has not changed the test code.

Skills
- source control
- selecting models
- creating a `CLAUDE.md` or `AGENTS.md`
- slash commands
- compacting memory
- /context - see where context is going
- creating skills

Don't learn MCP.

### Asynchronous

Scheduled

shouldn't run ai agents 24/7

my first 4 agents
- cross-references
- tool searcher - looking at the tools i use in my brewfile, and proposing additions

## Models

Claude, Kimi, GLM, Qwen

## Workflows

### Recursive Planning into Execution

Plan loop
- Cross-model review (e.g., plan with Gemini, implement with Claude, review with Codex) surfaces different blind spots

explicitly say dont implement yet

ask for a todo list, that can serve as a progress tracker

resetting context

want to uncover an agents assumptions
- great at syntax
- but different assumptions are problems

Use a concrete file as the plan
- can be edited, add notes, persistls
- should plans be edited, ro should you leave notes?

Plans all go in same place

Edit existing plan if needed

Solves two problems - session management

Goal of plan/research is to

### Iterative Validation against Tests

### Skills - A Few Custom Skills

Starting out here - just a markdown file

A few small skills helps reduce repetitive prompting

Value here is the locality - skills relevant to your workflow = 1000% more valuable than a custom skill (custom skills can be bad if they have different values)

Third party = risky
- Everyone's workflow differs; junk-drawer skills add nondeterminism and blow up context

Skill - load on demand - description allows to not load entire skill into context, specialized knowledge, if you explain repeatedly, this is skill waiting to be written
- `~/.claude/skills` - global
- `.claude/skills` - project

```
---
name: name
description: description (used to determine whether this skill should be used - Claude (Code?) specific)
---

```

### Reviewer

### Teacher

To get the most out of chat gpt, use it as a teacher

Chat GPT can't teach you everything - but it can teach you a lot.  

Teach a Python developer Javascript by converting Python code to the Javascript equivalent.

Teach you SQL by creating both the raw SQL and SQLAlchemy Python code to create a database table from a dictionary.

Better on more popular languages.

Ways in which good teacher:

- patient,
- doesn't require any time to context switch between problems,
- can handle malformed & messy inputs,
- knowledgeable.

Chat GPT will make mistakes.  Chat GPT often hallucinates - below it creates documentation for a Python package that doesn't exist:

This means you must remain vigilant when working with Chat GPT.  See this scepticism as a way to keep you honest and engaged.  This tendency to hallucinate means you always need to think about what Chat GPT has generated.

should REWRITE all code it generates - less you know the code, more you should be rewriting everything

idea = **REWRITE AI**
