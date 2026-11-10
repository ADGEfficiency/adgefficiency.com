---
id: how-i-neovim
aliases: []
tags: []
competencies:
  - How I Work
date_created: "2026-08-26"
date_updated: "2026-11-10"
description: How I work with files in Neovim.
draft: false
title: How I Work in Neovim
---

This post takes you through the way I use Neovim - [My Neovim config is here](https://github.com/ADGEfficiency/dotfiles/tree/main/config/nvim).

**Writing about how I work surfaces strengths, weaknesses and new ideas of how to work**. This helps me understand and improve my work, and helps me when I want to explain how I work to others.

## Before Starting Neovim

I use the Kitty terminal emulator to start a Tmux session in a Zsh shell. [I configure Tmux a bit](https://github.com/ADGEfficiency/dotfiles/blob/main/dotfiles/.tmux.conf), and do make the cardinal sin of editing the default key-bindings, but Tmux configuration is not something I change much.

I symlink my Neovim config into `~/.config/nvim` with `ln`.

## Starting Neovim

Most of the time, I start Neovim using a command `s` in the root of a project I'm working on:

{{< img
    src="/images/how-i-neovim/0.png"
    alt="fzf filtering files in ~/dotfiles with the query read, with README.md selected and its contents previewed below"
    caption="Searching for a README with `s`, with a file preview below."
    width="1000"
>}}

`s` opens a fuzzy file picker powered by fzf and fd. I select one or more files from the current directory to open in Neovim, using suffix matches such as `.py$` or `.md$` to narrow the results.

`s` (s for search) is a shell function that runs a script in my dotfiles [`search.sh`](https://github.com/ADGEfficiency/dotfiles/blob/main/scripts/search.sh):

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

The `search.sh` script is not the prettiest bit of shell code, but it gives me file previews and multi-file selection.

## Opening Local Files

Once running Neovim, I often want to open more files. I almost always work from the root of a Git repo, so the files I want are local to my current working directory.

`<leader>j` opens a Telescope file picker, with fzf providing the fuzzy matching, in my running Neovim session:

{{< img
    src="/images/how-i-neovim/1.png"
    alt="Telescope's Find Files picker listing files from the dotfiles repository inside Neovim"
    caption="Finding files in the current directory with `<leader>j`."
    width="1000"
>}}

This works similarly to `s` in that it is a fuzzy search over files in the current working directory, but from within Neovim, rather than on startup.

Most of the time, these two things (starting Neovim with fuzzy searched files from working directory and fuzzy finding more files from within Neovim) are all I need to navigate & open files.

I'm someone who probably closes and opens their text editor more than I should (I'm the opposite of someone who uses browser tabs as bookmarks), so I'm often opening new Neovim sessions.

I prefer to start fresh with a smaller set of files, and be re-opening them, than to be burdened by too many files open at once in my text editor. Just feels cleaner to me when working, but likely an artifact of something quite different.

## Opening Any Files

Sometimes I'll want to do a similar process, but with files in a different directory. To solve this, I'll reach for Telescope through my custom `:F` command (F for find).

I can type a directory path, using Tab to complete it:

```vim
:F ~/dotfiles
```

{{< img
    src="/images/how-i-neovim/2.png"
    alt="Neovim with README.md open and :F ~/dotfiles entered on the command line"
    caption="Choosing a search directory with `:F ~/dotfiles`."
    width="1000"
>}}

{{< img
    src="/images/how-i-neovim/3.png"
    alt="Telescope's floating Find Files picker showing files from ~/dotfiles over the open README.md buffer"
    caption="Telescope searches for files in the chosen directory."
    width="1000"
>}}

Press Enter to open a fuzzy finder of files in that directory. This lets me open files from anywhere on my machine.

With no path, `:F` first opens a directory picker under `~`. Both forms use this Lua:

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
                home
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

vim.api.nvim_create_user_command("F", function(opts)
	if opts.args ~= "" then
		require("telescope.builtin").find_files({ cwd = vim.fn.expand(opts.args) })
	else
		pickDirAndFindFiles()
	end
end, { nargs = "?", complete = "dir" })
```

## Opening Recent Files

One lesson I took from [Algorithms to Live By](https://adgefficiency.com/blog/popular-statistics-books/) is that recency is a good way to sort your work.

When in Neovim, I can open recent files with `<leader>'`:

{{< img
    src="/images/how-i-neovim/4.png"
    alt="Telescope's Oldfiles picker listing recently opened files from several projects, with .gitignore selected"
    caption="Reopening recent files with `<leader>'`, including files outside the current project."
    width="1000"
>}}

Under the hood this maps to:

```lua
:lua require'telescope.builtin'.oldfiles(require('telescope.themes').get_ivy({}))<cr>
```

## Navigating Open Buffers

When in Neovim, I can navigate open buffers with `<leader>,`:

{{< img
    src="/images/how-i-neovim/5.png"
    alt="Telescope's Buffers picker showing README.md as the only open buffer"
    caption="The open-buffer picker, with just `README.md` open in this session."
    width="1000"
>}}

## Find Words Anywhere

I've changed these shortcuts and their Lua implementations more than anything else in my config.

`<leader>.` runs a Lua function to grep for the word under the cursor:

```lua
local function grep_word(extra)
	return function()
		require("telescope.builtin").live_grep(grep_opts(vim.fn.expand("<cword>"), extra))
	end
end
```

{{< img
    src="/images/how-i-neovim/6.png"
    alt="Telescope's Live Grep picker searching for Setup, with matching lines from README.md and a preview below"
    caption="Searching for the word `Setup` under the cursor with `<leader>.`."
    width="1000"
>}}

## File Management with Oil

I use [Oil](https://github.com/stevearc/oil.nvim) to manage files inside Neovim. `<leader>o` opens the current file's directory in a horizontal split.

Oil lets me edit a directory like a text buffer, allowing navigating the file tree, renaming or moving files all with Vim motions and commands.

{{< img
    src="/images/how-i-neovim/7.png"
    alt="Oil listing the dotfiles directory in a horizontal split below README.md, with README.md selected"
    caption="Browsing the current file's directory with `<leader>o`, while keeping the file visible above."
    width="1000"
>}}

---

Thanks for reading!
