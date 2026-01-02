/**
 * Shared shell hook constants for FDD command guard
 * Used by both init.ts and install-hook.ts
 */

export const HOOK_MARKER_START = "# >>> FDD Command Guard >>>";
export const HOOK_MARKER_END = "# <<< FDD Command Guard <<<";

export const ZSH_HOOK = `${HOOK_MARKER_START}
# FDD (Failure-Driven Development) command guard
# Automatically blocks dangerous commands defined in .fdd/pitfalls/
# Install: fdd install-hook | Uninstall: fdd install-hook --uninstall

__fdd_accept_line() {
  local cmd="$BUFFER"

  # Skip if command is empty or starts with space (private command)
  [[ -z "$cmd" ]] && { zle .accept-line; return; }
  [[ "$cmd" == " "* ]] && { zle .accept-line; return; }

  # Skip fdd commands to avoid recursion
  [[ "$cmd" == fdd* ]] && { zle .accept-line; return; }

  # Check if .fdd directory exists in current or parent directories
  local dir="$PWD"
  local found_fdd=0
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.fdd" ]]; then
      found_fdd=1
      break
    fi
    dir="$(dirname "$dir")"
  done

  # No .fdd directory found, allow command
  [[ $found_fdd -eq 0 ]] && { zle .accept-line; return; }

  # Run guard check - FORCE_COLOR=1 preserves chalk colors in subshell
  local output exit_code
  output=$(FORCE_COLOR=1 fdd guard "$cmd" 2>&1)
  exit_code=$?

  if [[ $exit_code -eq 1 ]]; then
    # Blocked - show output, clear buffer, don't execute
    print
    print -r -- "$output"
    BUFFER=""
    zle reset-prompt
    return
  elif [[ $exit_code -eq 2 ]]; then
    # Warning - show output but proceed with command
    print
    print -r -- "$output"
    zle .accept-line
    return
  fi

  # No match - execute normally
  zle .accept-line
}

# Replace accept-line widget to intercept Enter key
zle -N accept-line __fdd_accept_line
${HOOK_MARKER_END}`;

export const BASH_HOOK = `${HOOK_MARKER_START}
# FDD (Failure-Driven Development) command guard
# Automatically blocks dangerous commands defined in .fdd/pitfalls/
# Install: fdd install-hook --shell bash | Uninstall: fdd install-hook --shell bash --uninstall

# Enable extdebug to allow DEBUG trap to block commands (return 1 = skip command)
shopt -s extdebug

__fdd_guard_check() {
  # Only run for top-level commands, not subshells or functions
  [[ "$BASH_SUBSHELL" -gt 0 ]] && return 0
  [[ -n "$COMP_LINE" ]] && return 0  # Skip during tab completion

  local cmd="$BASH_COMMAND"

  # Skip if command is empty or starts with space (private command)
  [[ -z "$cmd" ]] && return 0
  [[ "$cmd" == " "* ]] && return 0

  # Skip fdd commands to avoid recursion
  [[ "$cmd" == fdd* ]] && return 0

  # Skip internal commands
  [[ "$cmd" == __fdd* ]] && return 0
  [[ "$cmd" == "trap "* ]] && return 0

  # Check if .fdd directory exists in current or parent directories
  local dir="$PWD"
  local found_fdd=0
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.fdd" ]]; then
      found_fdd=1
      break
    fi
    dir="$(dirname "$dir")"
  done

  # No .fdd directory found, allow command
  [[ $found_fdd -eq 0 ]] && return 0

  # Run guard check
  local output exit_code
  output=$(fdd guard "$cmd" 2>&1)
  exit_code=$?

  if [[ $exit_code -eq 1 ]]; then
    # Blocked - show output and return 1 to skip command (extdebug behavior)
    echo "$output" >&2
    return 1
  elif [[ $exit_code -eq 2 ]]; then
    # Warning - show output but continue
    echo "$output" >&2
  fi

  return 0
}

# Set up DEBUG trap - with extdebug, return 1 skips the command
trap '__fdd_guard_check' DEBUG
${HOOK_MARKER_END}`;

export type ShellType = "zsh" | "bash";

export function getHookScript(shell: ShellType): string {
	return shell === "zsh" ? ZSH_HOOK : BASH_HOOK;
}

export function getRcFile(shell: ShellType): string {
	return shell === "zsh" ? ".zshrc" : ".bashrc";
}
