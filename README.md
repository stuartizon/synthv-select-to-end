# SynthV Select To End Of Track

A [Synthesizer V Studio 2](https://dreamtonics.com/synthesizerv/) script that
extends the selection from the current note to the end of the track — handy
for shifting, retiming, or editing everything after a given point in one go.

## Install

1. Download `SelectToEndOfTrack.js` from the
   [latest release](../../releases/latest).
2. Copy it into your SynthV scripts folder:
   - **macOS:** `~/Library/Application Support/Dreamtonics/Synthesizer V Studio 2/scripts`
   - **Windows:** `Documents\Dreamtonics\Synthesizer V Studio 2\scripts`
3. Restart SynthV Studio (or use **Scripts → Rescan**) if it was already running.

To use it like a built-in command, bind it to a key in
**Settings → Keyboard Shortcuts**.

## Usage

1. Select a note in the piano roll.
2. Run **Scripts → Selection → Select To End Of Track**.

Every note from that one to the end of the track is selected. If several
notes are selected, the earliest one is the starting point.

### Note groups

SynthV's piano roll can only select individual notes in the group you're
currently editing. So:

- Notes in the open group (usually the track's main group) are selected
  individually.
- Other note groups that start at or after the selected note are selected as
  whole groups.
- A note group that starts before the selected note but runs past it is left
  unselected.

If all your notes are in the main group — the default — none of this matters.

## Development

SynthV runs scripts in Duktape, an **ECMAScript 5.1** engine, so the script
sticks to ES5: `var` and `function`, no `let`/`const`, arrow functions,
template literals, or other ES6+ syntax.

## Releases

Pushing to `main` with a change to `SelectToEndOfTrack.js` automatically bumps
a semver tag and publishes the script as a GitHub Release
([.github/workflows/release.yml](.github/workflows/release.yml)). The bump is a
**patch** by default; include a `Version-Bump: minor` or `Version-Bump: major`
trailer in the commit message to bump differently.
