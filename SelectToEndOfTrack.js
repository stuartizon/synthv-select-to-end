// Select To End Of Track - a Synthesizer V Studio 2 script.
//
// Extends the selection from the earliest selected note to the end of the
// track. Notes in the group being edited are selected individually; other
// note groups that start at or after that note are selected as whole groups,
// since the piano roll can only select individual notes in the open group.
//
// SynthV runs scripts in Duktape (ECMAScript 5.1): keep this file ES5 -
// var, function, string concatenation; no let/const, arrows or templates.

var SCRIPT_TITLE = "Select To End Of Track";

function getClientInfo() {
  return {
    "name": SV.T(SCRIPT_TITLE),
    "category": "Selection",
    "author": "Stuart Izon",
    "versionNumber": 1,
    "minEditorVersion": 65537
  };
}

function main() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var selected = selection.getSelectedNotes();

  if (selected.length === 0) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Select a note first."));
    SV.finish();
    return;
  }

  var currentRef = editor.getCurrentGroup();
  var currentGroup = currentRef.getTarget();

  // Earliest selected note, relative to the open group
  var start = selected[0].getOnset();
  for (var i = 1; i < selected.length; i++) {
    start = Math.min(start, selected[i].getOnset());
  }
  // ...and in absolute track time, for comparing against other groups
  var absStart = start + currentRef.getTimeOffset();

  // Notes in the open group
  for (var j = 0; j < currentGroup.getNumNotes(); j++) {
    var note = currentGroup.getNote(j);
    if (note.getOnset() >= start) {
      selection.selectNote(note);
    }
  }

  // Other note groups on the track that start at or after the note
  var track = editor.getCurrentTrack();
  for (var k = 1; k < track.getNumGroups(); k++) { // index 0 is the main group
    var ref = track.getGroupReference(k);
    var group = ref.getTarget();
    if (group.getUUID() === currentGroup.getUUID()) continue;
    if (group.getNumNotes() === 0) continue;
    if (group.getNote(0).getOnset() + ref.getTimeOffset() >= absStart) {
      selection.selectGroup(ref);
    }
  }

  SV.finish();
}
