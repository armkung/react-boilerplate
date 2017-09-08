# Pure
# by Sindre Sorhus
# https://github.com/sindresorhus/pure
# MIT License

# For my own and others sanity
# git:
# %b => current branch
# %a => current action (rebase/merge)
# prompt:
# %F => color dict
# %f => reset color
# %~ => current path
# %* => time
# %n => username
# %m => shortname host
# %(?..) => prompt conditional - %(condition.true.false)
# terminal codes:
# \e7   => save cursor position
# \e[2A => move cursor 2 lines up
# \e[1G => go to position 1 in terminal
# \e8   => restore cursor position
# \e[K  => clears everything after the cursor on the current line
# \e[2K => clear everything on the current line


# turns seconds into human readable time
# 165392 => 1d 21h 56m 32s
# https://github.com/sindresorhus/pretty-time-zsh

#!/usr/bin/env zsh

#
# zsh-async
#
# version: 1.5.2
# author: Mathias Fredriksson
# url: https://github.com/mafredri/zsh-async
#

# Produce debug output from zsh-async when set to 1.
typeset -g ASYNC_DEBUG=${ASYNC_DEBUG:-0}

# Wrapper for jobs executed by the async worker, gives output in parseable format with execution time
_async_job() {
	# Disable xtrace as it would mangle the output.
	setopt localoptions noxtrace

	# Store start time for job.
	float -F duration=$EPOCHREALTIME

	# Run the command and capture both stdout (`eval`) and stderr (`cat`) in
	# separate subshells. When the command is complete, we grab write lock
	# (mutex token) and output everything except stderr inside the command
	# block, after the command block has completed, the stdin for `cat` is
	# closed, causing stderr to be appended with a $'\0' at the end to mark the
	# end of output from this job.
	local stdout stderr ret tok
	{
		stdout=$(eval "$@")
		ret=$?
		duration=$(( EPOCHREALTIME - duration ))  # Calculate duration.

		# Grab mutex lock, stalls until token is available.
		read -r -k 1 -p tok || exit 1

		# Return output (<job_name> <return_code> <stdout> <duration> <stderr>).
		print -r -n - ${(q)1} $ret ${(q)stdout} $duration
	} 2> >(stderr=$(cat) && print -r -n - " "${(q)stderr}$'\0')

	# Unlock mutex by inserting a token.
	print -n -p $tok
}

# The background worker manages all tasks and runs them without interfering with other processes
_async_worker() {
	# Reset all options to defaults inside async worker.
	emulate -R zsh

	# Make sure monitor is unset to avoid printing the
	# pids of child processes.
	unsetopt monitor

	# Redirect stderr to `/dev/null` in case unforseen errors produced by the
	# worker. For example: `fork failed: resource temporarily unavailable`.
	# Some older versions of zsh might also print malloc errors (know to happen
	# on at least zsh 5.0.2 and 5.0.8) likely due to kill signals.
	exec 2>/dev/null

	# When a zpty is deleted (using -d) all the zpty instances created before
	# the one being deleted receive a SIGHUP, unless we catch it, the async
	# worker would simply exit (stop working) even though visible in the list
	# of zpty's (zpty -L).
	TRAPHUP() {
		return 0  # Return 0, indicating signal was handled.
	}

	local -A storage
	local unique=0
	local notify_parent=0
	local parent_pid=0
	local coproc_pid=0
	local processing=0

	local -a zsh_hooks zsh_hook_functions
	zsh_hooks=(chpwd periodic precmd preexec zshexit zshaddhistory)
	zsh_hook_functions=(${^zsh_hooks}_functions)
	unfunction $zsh_hooks &>/dev/null   # Deactivate all zsh hooks inside the worker.
	unset $zsh_hook_functions           # And hooks with registered functions.
	unset zsh_hooks zsh_hook_functions  # Cleanup.

	child_exit() {
		local -a pids
		pids=(${${(v)jobstates##*:*:}%\=*})

		# If coproc (cat) is the only child running, we close it to avoid
		# leaving it running indefinitely and cluttering the process tree.
		if  (( ! processing )) && [[ $#pids = 1 ]] && [[ $coproc_pid = $pids[1] ]]; then
			coproc :
			coproc_pid=0
		fi

		# On older version of zsh (pre 5.2) we notify the parent through a
		# SIGWINCH signal because `zpty` did not return a file descriptor (fd)
		# prior to that.
		if (( notify_parent )); then
			# We use SIGWINCH for compatibility with older versions of zsh
			# (pre 5.1.1) where other signals (INFO, ALRM, USR1, etc.) could
			# cause a deadlock in the shell under certain circumstances.
			kill -WINCH $parent_pid
		fi
	}

	# Register a SIGCHLD trap to handle the completion of child processes.
	trap child_exit CHLD

	# Process option parameters passed to worker
	while getopts "np:u" opt; do
		case $opt in
			n) notify_parent=1;;
			p) parent_pid=$OPTARG;;
			u) unique=1;;
		esac
	done

	killjobs() {
		local tok
		local -a pids
		pids=(${${(v)jobstates##*:*:}%\=*})

		# No need to send SIGHUP if no jobs are running.
		(( $#pids == 0 )) && continue
		(( $#pids == 1 )) && [[ $coproc_pid = $pids[1] ]] && continue

		# Grab lock to prevent half-written output in case a child
		# process is in the middle of writing to stdin during kill.
		(( coproc_pid )) && read -r -k 1 -p tok

		kill -HUP -$$  # Send to entire process group.
		coproc :       # Quit coproc.
		coproc_pid=0   # Reset pid.
	}

	local request
	local -a cmd
	while :; do
		# Wait for jobs sent by async_job.
		read -r -d $'\0' request || {
			# Since we handle SIGHUP above (and thus do not know when `zpty -d`)
			# occurs, a failure to read probably indicates that stdin has
			# closed. This is why we propagate the signal to all children and
			# exit manually.
			kill -HUP -$$  # Send SIGHUP to all jobs.
			exit 0
		}

		# Check for non-job commands sent to worker
		case $request in
			_unset_trap) notify_parent=0; continue;;
			_killjobs)   killjobs; continue;;
		esac

		# Parse the request using shell parsing (z) to allow commands
		# to be parsed from single strings and multi-args alike.
		cmd=("${(z)request}")

		# Name of the job (first argument).
		local job=$cmd[1]

		# If worker should perform unique jobs
		if (( unique )); then
			# Check if a previous job is still running, if yes, let it finnish
			for pid in ${${(v)jobstates##*:*:}%\=*}; do
				if [[ ${storage[$job]} == $pid ]]; then
					continue 2
				fi
			done
		fi

		# Guard against closing coproc from trap before command has started.
		processing=1

		# Because we close the coproc after the last job has completed, we must
		# recreate it when there are no other jobs running.
		if (( ! coproc_pid )); then
			# Use coproc as a mutex for synchronized output between children.
			coproc cat
			coproc_pid="$!"
			# Insert token into coproc
			print -n -p "t"
		fi

		# Run job in background, completed jobs are printed to stdout.
		_async_job $cmd &
		# Store pid because zsh job manager is extremely unflexible (show jobname as non-unique '$job')...
		storage[$job]="$!"

		processing=0  # Disable guard.
	done
}

#
#  Get results from finnished jobs and pass it to the to callback function. This is the only way to reliably return the
#  job name, return code, output and execution time and with minimal effort.
#
# usage:
# 	async_process_results <worker_name> <callback_function>
#
# callback_function is called with the following parameters:
# 	$1 = job name, e.g. the function passed to async_job
# 	$2 = return code
# 	$3 = resulting stdout from execution
# 	$4 = execution time, floating point e.g. 2.05 seconds
# 	$5 = resulting stderr from execution
#
async_process_results() {
	setopt localoptions unset noshwordsplit noksharrays noposixidentifiers noposixstrings

	local worker=$1
	local callback=$2
	local caller=$3
	local -a items
	local null=$'\0' data
	integer -l len pos num_processed

	typeset -gA ASYNC_PROCESS_BUFFER

	# Read output from zpty and parse it if available.
	while zpty -r -t $worker data 2>/dev/null; do
		ASYNC_PROCESS_BUFFER[$worker]+=$data
		len=${#ASYNC_PROCESS_BUFFER[$worker]}
		pos=${ASYNC_PROCESS_BUFFER[$worker][(i)$null]}  # Get index of NULL-character (delimiter).

		# Keep going until we find a NULL-character.
		if (( ! len )) || (( pos > len )); then
			continue
		fi

		while (( pos <= len )); do
			# Take the content from the beginning, until the NULL-character and
			# perform shell parsing (z) and unquoting (Q) as an array (@).
			items=("${(@Q)${(z)ASYNC_PROCESS_BUFFER[$worker][1,$pos-1]}}")

			# Remove the extracted items from the buffer.
			ASYNC_PROCESS_BUFFER[$worker]=${ASYNC_PROCESS_BUFFER[$worker][$pos+1,$len]}

			if (( $#items == 5 )); then
				$callback "${(@)items}"  # Send all parsed items to the callback.
			else
				# In case of corrupt data, invoke callback with *async* as job
				# name, non-zero exit status and an error message on stderr.
				$callback "async" 1 "" 0 "$0:$LINENO: error: bad format, got ${#items} items (${(@q)items})"
			fi

			(( num_processed++ ))

			len=${#ASYNC_PROCESS_BUFFER[$worker]}
			if (( len > 1 )); then
				pos=${ASYNC_PROCESS_BUFFER[$worker][(i)$null]}  # Get index of NULL-character (delimiter).
			fi
		done
	done

	(( num_processed )) && return 0

	# Avoid printing exit value when `setopt printexitvalue` is active.`
	[[ $caller = trap || $caller = watcher ]] && return 0

	# No results were processed
	return 1
}

# Watch worker for output
_async_zle_watcher() {
	setopt localoptions noshwordsplit
	typeset -gA ASYNC_PTYS ASYNC_CALLBACKS
	local worker=$ASYNC_PTYS[$1]
	local callback=$ASYNC_CALLBACKS[$worker]

	if [[ -n $callback ]]; then
		async_process_results $worker $callback watcher
	fi
}

#
# Start a new asynchronous job on specified worker, assumes the worker is running.
#
# usage:
# 	async_job <worker_name> <my_function> [<function_params>]
#
async_job() {
	setopt localoptions noshwordsplit noksharrays noposixidentifiers noposixstrings

	local worker=$1; shift

	local -a cmd
	cmd=("$@")
	if (( $#cmd > 1 )); then
		cmd=(${(q)cmd})  # Quote special characters in multi argument commands.
	fi

	# Quote the cmd in case RC_EXPAND_PARAM is set.
	zpty -w $worker "$cmd"$'\0'
}

# This function traps notification signals and calls all registered callbacks
_async_notify_trap() {
	setopt localoptions noshwordsplit

	local k
	for k in ${(k)ASYNC_CALLBACKS}; do
		async_process_results $k ${ASYNC_CALLBACKS[$k]} trap
	done
}

#
# Register a callback for completed jobs. As soon as a job is finnished, async_process_results will be called with the
# specified callback function. This requires that a worker is initialized with the -n (notify) option.
#
# usage:
# 	async_register_callback <worker_name> <callback_function>
#
async_register_callback() {
	setopt localoptions noshwordsplit nolocaltraps

	typeset -gA ASYNC_CALLBACKS
	local worker=$1; shift

	ASYNC_CALLBACKS[$worker]="$*"

	# Enable trap when the ZLE watcher is unavailable, allows
	# workers to notify (via -n) when a job is done.
	if [[ ! -o interactive ]] || [[ ! -o zle ]]; then
		trap '_async_notify_trap' WINCH
	fi
}

#
# Unregister the callback for a specific worker.
#
# usage:
# 	async_unregister_callback <worker_name>
#
async_unregister_callback() {
	typeset -gA ASYNC_CALLBACKS

	unset "ASYNC_CALLBACKS[$1]"
}

#
# Flush all current jobs running on a worker. This will terminate any and all running processes under the worker, use
# with caution.
#
# usage:
# 	async_flush_jobs <worker_name>
#
async_flush_jobs() {
	setopt localoptions noshwordsplit

	local worker=$1; shift

	# Check if the worker exists
	zpty -t $worker &>/dev/null || return 1

	# Send kill command to worker
	async_job $worker "_killjobs"

	# Clear the zpty buffer.
	local junk
	if zpty -r -t $worker junk '*'; then
		(( ASYNC_DEBUG )) && print -n "async_flush_jobs $worker: ${(V)junk}"
		while zpty -r -t $worker junk '*'; do
			(( ASYNC_DEBUG )) && print -n "${(V)junk}"
		done
		(( ASYNC_DEBUG )) && print
	fi

	# Finally, clear the process buffer in case of partially parsed responses.
	typeset -gA ASYNC_PROCESS_BUFFER
	unset "ASYNC_PROCESS_BUFFER[$worker]"
}

#
# Start a new async worker with optional parameters, a worker can be told to only run unique tasks and to notify a
# process when tasks are complete.
#
# usage:
# 	async_start_worker <worker_name> [-u] [-n] [-p <pid>]
#
# opts:
# 	-u unique (only unique job names can run)
# 	-n notify through SIGWINCH signal
# 	-p pid to notify (defaults to current pid)
#
async_start_worker() {
	setopt localoptions noshwordsplit

	local worker=$1; shift
	zpty -t $worker &>/dev/null && return

	typeset -gA ASYNC_PTYS
	typeset -h REPLY
	typeset has_xtrace=0

	# Make sure async worker is started without xtrace
	# (the trace output interferes with the worker).
	[[ -o xtrace ]] && {
		has_xtrace=1
		unsetopt xtrace
	}

	if (( ! ASYNC_ZPTY_RETURNS_FD )) && [[ -o interactive ]] && [[ -o zle ]]; then
		# When zpty doesn't return a file descriptor (on older versions of zsh)
		# we try to guess it anyway.
		integer -l zptyfd
		exec {zptyfd}>&1  # Open a new file descriptor (above 10).
		exec {zptyfd}>&-  # Close it so it's free to be used by zpty.
	fi

	zpty -b $worker _async_worker -p $$ $@ || {
		async_stop_worker $worker
		return 1
	}

	# Re-enable it if it was enabled, for debugging.
	(( has_xtrace )) && setopt xtrace

	if [[ $ZSH_VERSION < 5.0.8 ]]; then
		# For ZSH versions older than 5.0.8 we delay a bit to give
		# time for the worker to start before issuing commands,
		# otherwise it will not be ready to receive them.
		sleep 0.001
	fi

	if [[ -o interactive ]] && [[ -o zle ]]; then
		if (( ! ASYNC_ZPTY_RETURNS_FD )); then
			REPLY=$zptyfd  # Use the guessed value for the file desciptor.
		fi

		ASYNC_PTYS[$REPLY]=$worker        # Map the file desciptor to the worker.
		zle -F $REPLY _async_zle_watcher  # Register the ZLE handler.

		# Disable trap in favor of ZLE handler when notify is enabled (-n).
		async_job $worker _unset_trap
	fi
}

#
# Stop one or multiple workers that are running, all unfetched and incomplete work will be lost.
#
# usage:
# 	async_stop_worker <worker_name_1> [<worker_name_2>]
#
async_stop_worker() {
	setopt localoptions noshwordsplit

	local ret=0 worker k v
	for worker in $@; do
		# Find and unregister the zle handler for the worker
		for k v in ${(@kv)ASYNC_PTYS}; do
			if [[ $v == $worker ]]; then
				zle -F $k
				unset "ASYNC_PTYS[$k]"
			fi
		done
		async_unregister_callback $worker
		zpty -d $worker 2>/dev/null || ret=$?

		# Clear any partial buffers.
		typeset -gA ASYNC_PROCESS_BUFFER
		unset "ASYNC_PROCESS_BUFFER[$worker]"
	done

	return $ret
}

#
# Initialize the required modules for zsh-async. To be called before using the zsh-async library.
#
# usage:
# 	async_init
#
async_init() {
	(( ASYNC_INIT_DONE )) && return
	typeset -g ASYNC_INIT_DONE=1

	zmodload zsh/zpty
	zmodload zsh/datetime

	# Check if zsh/zpty returns a file descriptor or not,
	# shell must also be interactive with zle enabled.
	typeset -g ASYNC_ZPTY_RETURNS_FD=0
	[[ -o interactive ]] && [[ -o zle ]] && {
		typeset -h REPLY
		zpty _async_test :
		(( REPLY )) && ASYNC_ZPTY_RETURNS_FD=1
		zpty -d _async_test
	}
}

async() {
	async_init
}

async "$@"

prompt_pure_human_time_to_var() {
	local human total_seconds=$1 var=$2
	local days=$(( total_seconds / 60 / 60 / 24 ))
	local hours=$(( total_seconds / 60 / 60 % 24 ))
	local minutes=$(( total_seconds / 60 % 60 ))
	local seconds=$(( total_seconds % 60 ))
	(( days > 0 )) && human+="${days}d "
	(( hours > 0 )) && human+="${hours}h "
	(( minutes > 0 )) && human+="${minutes}m "
	human+="${seconds}s"

	# store human readable time in variable as specified by caller
	typeset -g "${var}"="${human}"
}

# stores (into prompt_pure_cmd_exec_time) the exec time of the last command if set threshold was exceeded
prompt_pure_check_cmd_exec_time() {
	integer elapsed
	(( elapsed = EPOCHSECONDS - ${prompt_pure_cmd_timestamp:-$EPOCHSECONDS} ))
	typeset -g prompt_pure_cmd_exec_time=
	(( elapsed > ${PURE_CMD_MAX_EXEC_TIME:-5} )) && {
		prompt_pure_human_time_to_var $elapsed "prompt_pure_cmd_exec_time"
	}
}

prompt_pure_set_title() {
	# emacs terminal does not support settings the title
	(( ${+EMACS} )) && return

	# tell the terminal we are setting the title
	print -n '\e]0;'
	# show hostname if connected through ssh
	[[ -n $SSH_CONNECTION ]] && print -Pn '(%m) '
	case $1 in
		expand-prompt)
			print -Pn $2;;
		ignore-escape)
			print -rn $2;;
	esac
	# end set title
	print -n '\a'
}

prompt_pure_preexec() {
	if [[ -n $prompt_pure_git_fetch_pattern ]]; then
		# detect when git is performing pull/fetch (including git aliases).
		if [[ $2 =~ (git|hub)\ (.*\ )?($prompt_pure_git_fetch_pattern)(\ .*)?$ ]]; then
			# we must flush the async jobs to cancel our git fetch in order
			# to avoid conflicts with the user issued pull / fetch.
			async_flush_jobs 'prompt_pure'
		fi
	fi

	typeset -g prompt_pure_cmd_timestamp=$EPOCHSECONDS

	# shows the current dir and executed command in the title while a process is active
	prompt_pure_set_title 'ignore-escape' "$PWD:t: $2"
}

# string length ignoring ansi escapes
prompt_pure_string_length_to_var() {
	local str=$1 var=$2 length
	# perform expansion on str and check length
	length=$(( ${#${(S%%)str//(\%([KF1]|)\{*\}|\%[Bbkf])}} ))

	# store string length in variable as specified by caller
	typeset -g "${var}"="${length}"
}

prompt_pure_preprompt_render() {
	setopt localoptions noshwordsplit

	# Set color for git branch/dirty status, change color if dirty checking has
	# been delayed.
	local git_color=242
	[[ -n ${prompt_pure_git_last_dirty_check_timestamp+x} ]] && git_color=red

	# Initialize the preprompt array.
	local -a preprompt_parts

	# Set the path.
	preprompt_parts+=('%F{blue}%~%f')

	# Add git branch and dirty status info.
	typeset -gA prompt_pure_vcs_info
	if [[ -n $prompt_pure_vcs_info[branch] ]]; then
		preprompt_parts+=("%F{$git_color}"'${prompt_pure_vcs_info[branch]}${prompt_pure_git_dirty}%f')
	fi
	# Git pull/push arrows.
	if [[ -n $prompt_pure_git_arrows ]]; then
		preprompt_parts+=('%F{cyan}${prompt_pure_git_arrows}%f')
	fi

	# Username and machine, if applicable.
	[[ -n $prompt_pure_username ]] && preprompt_parts+=('$prompt_pure_username')
	# Execution time.
	[[ -n $prompt_pure_cmd_exec_time ]] && preprompt_parts+=('%F{yellow}${prompt_pure_cmd_exec_time}%f')

	local cleaned_ps1=$PROMPT
	local -H MATCH
	if [[ $PROMPT = *$prompt_newline* ]]; then
		# When the prompt contains newlines, we keep everything before the first
		# and after the last newline, leaving us with everything except the
		# preprompt. This is needed because some software prefixes the prompt
		# (e.g. virtualenv).
		cleaned_ps1=${PROMPT%%${prompt_newline}*}${PROMPT##*${prompt_newline}}
	fi

	# Construct the new prompt with a clean preprompt.
	local -ah ps1
	ps1=(
		$prompt_newline           # Initial newline, for spaciousness.
		${(j. .)preprompt_parts}  # Join parts, space separated.
		$prompt_newline           # Separate preprompt and prompt.
		$cleaned_ps1
	)

	PROMPT="${(j..)ps1}"

	# Expand the prompt for future comparision.
	local expanded_prompt
	expanded_prompt="${(S%%)PROMPT}"

	if [[ $1 != precmd ]] && [[ $prompt_pure_last_prompt != $expanded_prompt ]]; then
		# Redraw the prompt.
		zle && zle .reset-prompt
	fi

	typeset -g prompt_pure_last_prompt=$expanded_prompt
}

prompt_pure_precmd() {
	# check exec time and store it in a variable
	prompt_pure_check_cmd_exec_time
	unset prompt_pure_cmd_timestamp

	# shows the full path in the title
	prompt_pure_set_title 'expand-prompt' '%~'

	# preform async git dirty check and fetch
	prompt_pure_async_tasks

	# store name of virtualenv in psvar if activated
	psvar[12]=
	[[ -n $VIRTUAL_ENV ]] && psvar[12]="${VIRTUAL_ENV:t}"

	# print the preprompt
	prompt_pure_preprompt_render "precmd"
}

prompt_pure_async_git_aliases() {
	setopt localoptions noshwordsplit
	local dir=$1
	local -a gitalias pullalias

	# we enter repo to get local aliases as well.
	builtin cd -q $dir

	# list all aliases and split on newline.
	gitalias=(${(@f)"$(command git config --get-regexp "^alias\.")"})
	for line in $gitalias; do
		parts=(${(@)=line})           # split line on spaces
		aliasname=${parts[1]#alias.}  # grab the name (alias.[name])
		shift parts                   # remove aliasname

		# check alias for pull or fetch (must be exact match).
		if [[ $parts =~ ^(.*\ )?(pull|fetch)(\ .*)?$ ]]; then
			pullalias+=($aliasname)
		fi
	done

	print -- ${(j:|:)pullalias}  # join on pipe (for use in regex).
}

prompt_pure_async_vcs_info() {
	setopt localoptions noshwordsplit
	builtin cd -q $1 2>/dev/null

	# configure vcs_info inside async task, this frees up vcs_info
	# to be used or configured as the user pleases.
	zstyle ':vcs_info:*' enable git
	zstyle ':vcs_info:*' use-simple true
	# only export two msg variables from vcs_info
	zstyle ':vcs_info:*' max-exports 2
	# export branch (%b) and git toplevel (%R)
	zstyle ':vcs_info:git*' formats '%b' '%R'
	zstyle ':vcs_info:git*' actionformats '%b|%a' '%R'

	vcs_info

	local -A info
	info[top]=$vcs_info_msg_1_
	info[branch]=$vcs_info_msg_0_

	print -r - ${(@kvq)info}
}

# fastest possible way to check if repo is dirty
prompt_pure_async_git_dirty() {
	setopt localoptions noshwordsplit
	local untracked_dirty=$1 dir=$2

	# use cd -q to avoid side effects of changing directory, e.g. chpwd hooks
	builtin cd -q $dir

	if [[ $untracked_dirty = 0 ]]; then
		command git diff --no-ext-diff --quiet --exit-code
	else
		test -z "$(command git status --porcelain --ignore-submodules -unormal)"
	fi

	return $?
}

prompt_pure_async_git_fetch() {
	setopt localoptions noshwordsplit
	# use cd -q to avoid side effects of changing directory, e.g. chpwd hooks
	builtin cd -q $1

	# set GIT_TERMINAL_PROMPT=0 to disable auth prompting for git fetch (git 2.3+)
	export GIT_TERMINAL_PROMPT=0
	# set ssh BachMode to disable all interactive ssh password prompting
	export GIT_SSH_COMMAND=${GIT_SSH_COMMAND:-"ssh -o BatchMode=yes"}

	command git -c gc.auto=0 fetch &>/dev/null || return 99

	# check arrow status after a successful git fetch
	prompt_pure_async_git_arrows $1
}

prompt_pure_async_git_arrows() {
	setopt localoptions noshwordsplit
	builtin cd -q $1
	command git rev-list --left-right --count HEAD...@'{u}'
}

prompt_pure_async_tasks() {
	setopt localoptions noshwordsplit

	# initialize async worker
	((!${prompt_pure_async_init:-0})) && {
		async_start_worker "prompt_pure" -u -n
		async_register_callback "prompt_pure" prompt_pure_async_callback
		typeset -g prompt_pure_async_init=1
	}

	typeset -gA prompt_pure_vcs_info

	local -H MATCH
	if ! [[ $PWD = ${prompt_pure_vcs_info[pwd]}* ]]; then
		# stop any running async jobs
		async_flush_jobs "prompt_pure"

		# reset git preprompt variables, switching working tree
		unset prompt_pure_git_dirty
		unset prompt_pure_git_last_dirty_check_timestamp
		unset prompt_pure_git_arrows
		unset prompt_pure_git_fetch_pattern
		prompt_pure_vcs_info[branch]=
		prompt_pure_vcs_info[top]=
	fi
	unset MATCH

	async_job "prompt_pure" prompt_pure_async_vcs_info $PWD

	# # only perform tasks inside git working tree
	[[ -n $prompt_pure_vcs_info[top] ]] || return

	prompt_pure_async_refresh
}

prompt_pure_async_refresh() {
	setopt localoptions noshwordsplit

	if [[ -z $prompt_pure_git_fetch_pattern ]]; then
		# we set the pattern here to avoid redoing the pattern check until the
		# working three has changed. pull and fetch are always valid patterns.
		typeset -g prompt_pure_git_fetch_pattern="pull|fetch"
		async_job "prompt_pure" prompt_pure_async_git_aliases $working_tree
	fi

	async_job "prompt_pure" prompt_pure_async_git_arrows $PWD

	# do not preform git fetch if it is disabled or working_tree == HOME
	if (( ${PURE_GIT_PULL:-1} )) && [[ $working_tree != $HOME ]]; then
		# tell worker to do a git fetch
		async_job "prompt_pure" prompt_pure_async_git_fetch $PWD
	fi

	# if dirty checking is sufficiently fast, tell worker to check it again, or wait for timeout
	integer time_since_last_dirty_check=$(( EPOCHSECONDS - ${prompt_pure_git_last_dirty_check_timestamp:-0} ))
	if (( time_since_last_dirty_check > ${PURE_GIT_DELAY_DIRTY_CHECK:-1800} )); then
		unset prompt_pure_git_last_dirty_check_timestamp
		# check check if there is anything to pull
		async_job "prompt_pure" prompt_pure_async_git_dirty ${PURE_GIT_UNTRACKED_DIRTY:-1} $PWD
	fi
}

prompt_pure_check_git_arrows() {
	setopt localoptions noshwordsplit
	local arrows left=${1:-0} right=${2:-0}

	(( right > 0 )) && arrows+=${PURE_GIT_DOWN_ARROW:-⇣}
	(( left > 0 )) && arrows+=${PURE_GIT_UP_ARROW:-⇡}

	[[ -n $arrows ]] || return
	typeset -g REPLY=$arrows
}

prompt_pure_async_callback() {
	setopt localoptions noshwordsplit
	local job=$1 code=$2 output=$3 exec_time=$4

	case $job in
		prompt_pure_async_vcs_info)
			local -A info
			typeset -gA prompt_pure_vcs_info

			# parse output (z) and unquote as array (Q@)
			info=("${(Q@)${(z)output}}")
			local -H MATCH
			# check if git toplevel has changed
			if [[ $info[top] = $prompt_pure_vcs_info[top] ]]; then
				# if stored pwd is part of $PWD, $PWD is shorter and likelier
				# to be toplevel, so we update pwd
				if [[ $prompt_pure_vcs_info[pwd] = ${PWD}* ]]; then
					prompt_pure_vcs_info[pwd]=$PWD
				fi
			else
				# store $PWD to detect if we (maybe) left the git path
				prompt_pure_vcs_info[pwd]=$PWD
			fi
			unset MATCH

			# update has a git toplevel set which means we just entered a new
			# git directory, run the async refresh tasks
			[[ -n $info[top] ]] && [[ -z $prompt_pure_vcs_info[top] ]] && prompt_pure_async_refresh

			# always update branch and toplevel
			prompt_pure_vcs_info[branch]=$info[branch]
			prompt_pure_vcs_info[top]=$info[top]

			prompt_pure_preprompt_render
			;;
		prompt_pure_async_git_aliases)
			if [[ -n $output ]]; then
				# append custom git aliases to the predefined ones.
				prompt_pure_git_fetch_pattern+="|$output"
			fi
			;;
		prompt_pure_async_git_dirty)
			local prev_dirty=$prompt_pure_git_dirty
			if (( code == 0 )); then
				unset prompt_pure_git_dirty
			else
				typeset -g prompt_pure_git_dirty="*"
			fi

			[[ $prev_dirty != $prompt_pure_git_dirty ]] && prompt_pure_preprompt_render

			# When prompt_pure_git_last_dirty_check_timestamp is set, the git info is displayed in a different color.
			# To distinguish between a "fresh" and a "cached" result, the preprompt is rendered before setting this
			# variable. Thus, only upon next rendering of the preprompt will the result appear in a different color.
			(( $exec_time > 5 )) && prompt_pure_git_last_dirty_check_timestamp=$EPOCHSECONDS
			;;
		prompt_pure_async_git_fetch|prompt_pure_async_git_arrows)
			# prompt_pure_async_git_fetch executes prompt_pure_async_git_arrows
			# after a successful fetch.
			if (( code == 0 )); then
				local REPLY
				prompt_pure_check_git_arrows ${(ps:\t:)output}
				if [[ $prompt_pure_git_arrows != $REPLY ]]; then
					prompt_pure_git_arrows=$REPLY
					prompt_pure_preprompt_render
				fi
			elif (( code != 99 )); then
				# Unless the exit code is 99, prompt_pure_async_git_arrows
				# failed with a non-zero exit status, meaning there is no
				# upstream configured.
				if [[ -n $prompt_pure_git_arrows ]]; then
					unset prompt_pure_git_arrows
					prompt_pure_preprompt_render
				fi
			fi
			;;
	esac
}

prompt_pure_setup() {
	# Prevent percentage showing up if output doesn't end with a newline.
	export PROMPT_EOL_MARK=''

	# disallow python virtualenvs from updating the prompt
	export VIRTUAL_ENV_DISABLE_PROMPT=1

	prompt_opts=(subst percent)

	# borrowed from promptinit, sets the prompt options in case pure was not
	# initialized via promptinit.
	setopt noprompt{bang,cr,percent,subst} "prompt${^prompt_opts[@]}"

	if [[ -z $prompt_newline ]]; then
		# This variable needs to be set, usually set by promptinit.
		typeset -g prompt_newline=$'\n%{\r%}'
	fi

	zmodload zsh/datetime
	zmodload zsh/zle
	zmodload zsh/parameter

	autoload -Uz add-zsh-hook
	autoload -Uz vcs_info
	autoload -Uz async && async

	add-zsh-hook precmd prompt_pure_precmd
	add-zsh-hook preexec prompt_pure_preexec

	# show username@host if logged in through SSH
	[[ "$SSH_CONNECTION" != '' ]] && prompt_pure_username='%F{242}%n@%m%f'

	# show username@host if root, with username in white
	[[ $UID -eq 0 ]] && prompt_pure_username='%F{white}%n%f%F{242}@%m%f'

	# if a virtualenv is activated, display it in grey
	PROMPT='%(12V.%F{242}%12v%f .)'

	# prompt turns red if the previous command didn't exit with 0
	PROMPT+='%(?.%F{magenta}.%F{red})${PURE_PROMPT_SYMBOL:-❯}%f '
}

prompt_pure_setup "$@"