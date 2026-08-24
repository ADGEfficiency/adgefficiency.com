# CLAUDE.md

The app is a Hugo app using Tailwind.

You can test this app using Playwright, BUT ONLY IF YOU REALLY NEED IT. Do NOT always run a Playwright session when working with the code base. The application is always running on `http://localhost:1313/`. The Playwright MCP server is already installed.

You do not need to start a Hugo server - never start a Hugo server yourself, use the one that is already running.

This codebase is for a data science education website, with content provided as lessons and blogs.  

The core taxonomy is competencies, which really is just a tag.

The competency taxonomy is used to link lesson and blog content together.

## Build / Test / Lint Commands

None

## Code Style Guidelines

- Use comments rarely.  If you need to comment, comment on the line above.
- When you create class or call methods or call functions, show the most common inputs with good default arguments.
- Keep examples concise.

### Hugo/Website
- Use Hugo shortcodes for reusable components
- Follow existing structure for layouts and partials

### Git
- Use Conventional Commits format: `<type>: <description>`
- Keep commits small and frequent

## Writing Style Guidelines

### Voice and Tone
- Direct, educational, and authoritative but approachable
- Use first person singular ("I") for personal experience and opinion
- Use first person plural ("we") when guiding the reader through examples or shared learning
- Short, declarative sentences preferred over complex compound sentences
- Paragraphs are short, typically 1-3 sentences, rarely more than 4
- No emojis in body text
- No exclamation marks except in the sign-off "Thanks for reading!"

### Bold Emphasis
- Bold is the primary emphasis tool, used heavily throughout all posts
- **Key definitions** are always bolded on first appearance
- **Important conclusions and takeaways** are bolded
- **Transitions between ideas** often use bold to signal the key point of the next paragraph
- Avoid bolding entire paragraphs, bold only the core sentence or phrase
- Typically 1-3 bold statements per section

### Headings
- `##` (H2) for all main sections, `###` (H3) for subsections
- Never use H1 in body text (the title serves as H1 via Hugo front matter)
- Headings are title case or sentence case, be consistent within a post
- No bold inside headings

### Code Examples
- Favor small, focused code blocks (3 lines or less when possible)
- Show expected output in a separate ```output block, never as comments inside the code block
- End the Python block with a `print()` call, then follow it immediately with the ```output block
- Put the real output in the ```output block - run the code and paste what it actually printed, do not write it from memory
- Use realistic, domain-relevant examples (energy, data science)
- Break complex concepts into multiple small examples rather than one large block
- Use language annotations on all code blocks: `python`, `output`, `sql`, `bash`, `shell-session`, `makefile`
- Use `shell-session` (with `$` prompt) for terminal commands showing input and output
- Use `bash` for shell scripts or commands without output
- Use title annotations for file-specific code: ````python { title = "filename.py" }````
- When showing terminal output after a command, use `shell-session` with `$` prefix
- Use `import pulp; pulp.LpVariable` rather than `from pulp import LpVariable`

Example of the code and output pattern:

````md
```python
import datetime

print(datetime.date(2020, 1, 1))
```

```output
2020-01-01
```
````

### Tables
- Use markdown tables for structured comparisons and data
- Include a header row with clear column names
- Align columns for readability

### Math and Diagrams
- Use LaTeX math: `$$` for display equations, `$` for inline
- Use Mermaid diagrams for flowcharts and process diagrams
- Use Hugo shortcodes for images: `{{< img src="" caption="" width="" >}}`

### Bulleted Lists
- Start each item with a lowercase letter unless it's a proper noun or acronym
- Use periods at the end of complete sentences only
- Keep items parallel in structure (all phrases or all complete sentences)
- Avoid mixing sentence fragments and complete sentences
- Start each item with a bolded keyword or phrase, then a colon :, then detail about that point
- Detail should be capitalized after the colon
- Use sentence case for the key phrase and detail
- One line gap between the sentence that introduces the list and the first line

Examples:

```md
Concept or sentence:

- **First point**: Detail about this point
- **Second point**: Detail about this second point
```

### Numbered Lists
- Use when sequence or priority matters
- Follow the same capitalization and punctuation rules as bulleted lists
- Maintain consistent formatting throughout the list

### Links and References
- Use inline markdown links: `[text](url)`
- Cross-reference other posts on the site when topics overlap
- Include a "Further Reading" or "Resources" section with external links when relevant
- Use descriptive link text, not bare URLs

### Tips Pattern
- For tool/library roundup posts, end each section with an italicized tip
- Format: `*Tip - Description of the tip.*`

## Pull Request Description Format

Should be small, bullet lists based on conventional commits.

```
Feat:
- added feature
- and another

Fix:
- did fixes

Test:
- did test things
```

### Front Matter

All content files use Hugo front matter with these fields:

```yaml
---
title: Post Title
description: One sentence summary of the post.
date_created: YYYY-MM-DD
date_updated: YYYY-MM-DD
competencies:
  - Software Engineering
aliases:
  - /old-url
  - /blog/old-url
---
```

Competency values used across the site: `Software Engineering`, `Machine Learning`, `Reinforcement Learning`, `Energy`, `Python`, `Soft Skills`, `Data Engineering`, `AI`, `How I`.

Always include `date_updated` when modifying an existing post.

Two optional keys control which heading levels appear in the sidebar table of contents:

- **`toc_start_level`**: Shallowest heading shown, defaults to `2`
- **`toc_end_level`**: Deepest heading shown, defaults to `3`

Set `toc_end_level: 2` on a post with many `###` subsections to show only `##` in the sidebar. Both keys affect the sidebar only, the body still renders every heading.

## Blog Post Structure

```
**Bold opening statement defining the core concept**.

Body sections with ## headings.

## Summary

**Bold sentence restating the core concept or key takeaway**.

- **Key point one**: Detail about this point
- **Key point two**: Detail about this point

---

Thanks for reading!
```

### Blog Post Sign-off
- Always end blog posts with "Thanks for reading!" on its own line
- No horizontal rule (`---`) before the sign-off
- No exclamation mark anywhere else in the post

## Lesson Structure

```
## What is $SUBJECT?

### Cheat Sheet (optional)

### This Lesson

### Resources

## Why Learn $SUBJECT?

## Content

## Full Code Snippets

## Summary
```

What could I add to this?
- could rework this - it's not quite right
