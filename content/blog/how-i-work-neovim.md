---
id: how-i-neovim
aliases: []
tags: []
competencies:
  - How I Work
date_created: "2026-08-26"
date_updated: "2026-08-26"
description: The system I use to manage my work across a day, week and forever.
draft: false
title: How I Work in Neovim
---

This post takes you through the way I use Neovim.  My Neovim config is here.

## Before Starting Neovim

I use the Kitty terminal emulator to start a Tmux session in a Zsh shell. [I configure Tmux a bit](), and do make the cardinal sin of editing the default key-bindings, but Tmux configuration is not something I change much.

I have my Neovim config Stow'd into `~/.config/nvim`.

## Starting Neovim

Most of the time, I start Neovim using a command `s` in the root of a project I'm working on:

```shell-session
$ s
```
{{< img
    src="/images/how-i-neovim/0.png"
    width="1000"
>}}

This opens up a fuzzy file selector of files in the current working directory, powered by fzf and Ripgrep.

This allows me to start Neovim with one or many files selected from whatever project I'm in.

`s` allows me to fuzzy find files to open with my new Neovim session.  Most commonly I'm just fuzzy matching simple strings, sometimes I'll use regex for the file suffix (ie `.py$`, or `.md$`) to narrow down files by type.

`s` (s for search) is a shell function that runs a script in my dotfiles [`search.sh`]():

```bash
#!/usr/bin/env sh

TERM_HEIGHT=$(tput lines)
MIN_HEIGHT=20

# Use provided directory or default to current directory
target_dir="${1:-.}"
cd "$target_dir" || exit

# respect local .gitignore and the global one (core.excludesFile), plus exclude ./archive
# --no-require-git applies the gitignore rules outside git repos too
FZF_DEFAULT_COMMAND='fd --type f --hidden --no-require-git --exclude .git --exclude archive'
export FZF_DEFAULT_COMMAND

if [ "$TERM_HEIGHT" -ge "$MIN_HEIGHT" ]; then
  fzf --preview 'bat --style=numbers --color=always {}' --height 60% -m --print0 | xargs -0 "$EDITOR"
else
  fzf --no-preview --height 40% -m --print0 | xargs -0 "$EDITOR"
fi
```

The `search.sh` script is not the prettiest bit of shell code, but it does some nice things like saving the command to shell history or file previews.

## Opening Local Files

Once running Neovim, I often want to open more files. I almost always work from the root of a Git repo, so the files I want are local to my current working directory.

`<leader>j` opens a fzf (suprise) picker in my running Neovim session:

{{< img
    src="/images/how-i-neovim/1.png"
    width="1000"
>}}

This works similar to `s` in that it is a fuzzy search over files in the current working directory, but from within Neovim, rather than on startup.

Most of the time, these two things (starting Neovim with fuzzy searched files from working directory and fuzzy finding more files from within Neovim) are all I need to navigate & open files.

I'm someone who probably closes and opens their text editor more than I should (I'm the opposite of someone who uses browser tabs as bookmarks), so I'm often opening new Neovim sessions.

I prefer to start fresh with a smaller set of files, and be re-opening them, than to be burdened by too many files open at once in my text editor. Just feels cleaner to me when working, but likely an artifact of something quite different.

## Opening Files from Anywhere

Sometimes I'll want to do a similar process, but with files in a different directory.

To solve this, I'll reach for Telescope

I can type:

```
:F ~
```

{{< img
    src="/images/how-i-neovim/2.png"
    width="1000"
>}}

{{< img
    src="/images/how-i-neovim/3.png"
    width="1000"
>}}

Tab complete the directory, and expand to a fuzzy finder of files in that directory, to open files from anywhere on my machine.

This runs a custom bit of Lua:

```lua
-- Fuzzy-find a directory under ~, then find files in it
local function pickDirAndFindFiles()
	local home = vim.fn.expand("~")
	require("telescope.pickers")
		.new(require("telescope.themes").get_ivy({ prompt_title = "<Directories>" }), {
			finder = require("telescope.finders").new_oneshot_job({
				"fd",
				"-H",
				"-a",
				"--type",
				"d",
				"--max-depth",
				"2",
				"--exclude",
				"node_modules",
				"--exclude",
				"venv",
				"--exclude",
				".git",
				".",
				home,
			}, {}),
			sorter = require("telescope.config").values.file_sorter({}),
			attach_mappings = function(prompt_bufnr)
				require("telescope.actions").select_default:replace(function()
					local entry = require("telescope.actions.state").get_selected_entry()
					require("telescope.actions").close(prompt_bufnr)
					require("telescope.builtin").find_files({ cwd = entry.value })
				end)
				return true
			end,
		})
		:find()
end
```

## Opening Recent Files

One lesson I took from Algorithms to Live By is that recency is a good way to sort your work.

When in Neovim, I can open recent files with this:

`<leader>'` or `<leader>ro`

{{< img
    src="/images/how-i-neovim/4.png"
    width="1000"
>}}

Under the hood this runs:

```lua
```

## Navigating Open Buffers

`<leader>,`

{{< img
    src="/images/how-i-neovim/5.png"
    width="1000"
>}}

also closing with `BD`

## Find Words Anywhere

Probably area that I've thrashed the most - both in terms of shortcuts and what Lua they run.

`<leader>.` OR `<leader>g`
opens telescope live grep

{{< img
    src="/images/how-i-neovim/6.png"
    width="1000"
>}}

## File Management with Oil

The only workflow that depends on a plugin

Moving files around, renaming etc

{{< img
    src="/images/how-i-neovim/7.png"
    width="1000"
>}}

Can install with Lazy with:

```lua
{
  'stevearc/oil.nvim',
  ---@module 'oil'
  ---@type oil.SetupOpts
  opts = {},
  -- Optional dependencies
  dependencies = { { "nvim-mini/mini.icons", opts = {} } },
  -- dependencies = { "nvim-tree/nvim-web-devicons" }, -- use if you prefer nvim-web-devicons
  -- Lazy loading is not recommended because it is very tricky to make it work correctly in all situations.
  lazy = false,
}
```

## Summary

Edits to this post in future might cover:

- completion
- linting
- formatting
- lsp
