// A minimal fake of the parts of SynthV's scripting API that
// SelectToEndOfTrack.js uses, so the script can run under Node.
//
// It models the API as the script expects it to behave - it can't catch a
// wrong assumption about SynthV itself, so check real behaviour in SynthV too.

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var SCRIPT_PATH = path.join(__dirname, '..', 'SelectToEndOfTrack.js');

// spec: {
//   groups: [{ name, offset, notes: [onset, ...] }, ...]  // index 0 = main group
//   current: index of the group open in the piano roll
//   selected: onsets (within the open group) of the notes already selected
// }
function build(spec) {
  var calls = { notes: [], groups: [], messages: 0, finished: 0 };

  var refs = spec.groups.map(function (g) {
    var notes = g.notes.map(function (onset) {
      return { group: g.name, getOnset: function () { return onset; } };
    });
    var group = {
      getUUID: function () { return g.name; },
      getNumNotes: function () { return notes.length; },
      getNote: function (i) { return notes[i]; }
    };
    return {
      notes: notes,
      name: g.name,
      getTarget: function () { return group; },
      getTimeOffset: function () { return g.offset || 0; }
    };
  });

  var currentRef = refs[spec.current || 0];
  var preselected = currentRef.notes.filter(function (n) {
    return spec.selected.indexOf(n.getOnset()) !== -1;
  });

  var selection = {
    getSelectedNotes: function () { return preselected.slice(); },
    selectNote: function (n) { calls.notes.push(n.group + '@' + n.getOnset()); },
    selectGroup: function (ref) { calls.groups.push(ref.name); }
  };

  var track = {
    getNumGroups: function () { return refs.length; },
    getGroupReference: function (i) { return refs[i]; }
  };

  var SV = {
    T: function (s) { return s; },
    finish: function () { calls.finished++; },
    showMessageBox: function () { calls.messages++; },
    getMainEditor: function () {
      return {
        getSelection: function () { return selection; },
        getCurrentGroup: function () { return currentRef; },
        getCurrentTrack: function () { return track; }
      };
    }
  };

  return { SV: SV, calls: calls };
}

// Runs the real script file against a fake built from spec and returns
// what it selected.
function run(spec) {
  var fake = build(spec);
  var context = vm.createContext({ SV: fake.SV });
  vm.runInContext(fs.readFileSync(SCRIPT_PATH, 'utf8'), context, { filename: SCRIPT_PATH });
  context.main();
  return fake.calls;
}

// getClientInfo() as SynthV would see it.
function clientInfo() {
  var context = vm.createContext({ SV: build({ groups: [{ name: 'main', notes: [] }], selected: [] }).SV });
  vm.runInContext(fs.readFileSync(SCRIPT_PATH, 'utf8'), context, { filename: SCRIPT_PATH });
  return context.getClientInfo();
}

module.exports = { run: run, clientInfo: clientInfo };
