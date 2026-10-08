// Simple standalone test harness for SelectToEndOfTrack.js - no dependencies,
// since the script has to stay Duktape-compatible (ES5.1) and we don't want a
// test framework implying otherwise. The real script file is loaded into a
// Node vm context against a fake SV object (see fakeSV.js). Run with:
//   node test/selectToEnd.test.js

var FakeSV = require('./fakeSV.js');

var cases = [
  // single selected note in the main group -> it and everything after
  {
    name: 'selects from the selected note to the end of the main group',
    spec: { groups: [{ name: 'main', notes: [0, 100, 200, 300] }], selected: [100] },
    expect: { notes: ['main@100', 'main@200', 'main@300'], groups: [], messages: 0, finished: 1 }
  },
  {
    name: 'first note selected -> whole group',
    spec: { groups: [{ name: 'main', notes: [0, 100, 200] }], selected: [0] },
    expect: { notes: ['main@0', 'main@100', 'main@200'], groups: [], messages: 0, finished: 1 }
  },
  {
    name: 'last note selected -> just that note',
    spec: { groups: [{ name: 'main', notes: [0, 100, 200] }], selected: [200] },
    expect: { notes: ['main@200'], groups: [], messages: 0, finished: 1 }
  },

  // several notes selected -> the earliest one is the starting point,
  // whatever order SynthV returns them in
  {
    name: 'several selected notes start from the earliest',
    spec: { groups: [{ name: 'main', notes: [0, 100, 200, 300] }], selected: [300, 100] },
    expect: { notes: ['main@100', 'main@200', 'main@300'], groups: [], messages: 0, finished: 1 }
  },

  // nothing selected -> message, no selection, still finishes
  {
    name: 'no selection shows a message and selects nothing',
    spec: { groups: [{ name: 'main', notes: [0, 100] }], selected: [] },
    expect: { notes: [], groups: [], messages: 1, finished: 1 }
  },

  // other note groups on the track, compared in absolute track time
  {
    name: 'later note groups are selected as whole groups',
    spec: {
      groups: [
        { name: 'main', notes: [0, 100] },
        { name: 'chorus', offset: 1000, notes: [0, 50] }
      ],
      selected: [100]
    },
    expect: { notes: ['main@100'], groups: ['chorus'], messages: 0, finished: 1 }
  },
  {
    name: 'earlier note groups are not selected',
    spec: {
      groups: [
        { name: 'main', notes: [500, 600] },
        { name: 'intro', offset: 0, notes: [0, 100] }
      ],
      selected: [500]
    },
    expect: { notes: ['main@500', 'main@600'], groups: [], messages: 0, finished: 1 }
  },
  {
    name: 'a group starting before the note but running past it is not selected',
    spec: {
      groups: [
        { name: 'main', notes: [500] },
        { name: 'overlap', offset: 400, notes: [0, 200] }
      ],
      selected: [500]
    },
    expect: { notes: ['main@500'], groups: [], messages: 0, finished: 1 }
  },
  {
    name: 'a group starting exactly at the note is selected',
    spec: {
      groups: [
        { name: 'main', notes: [500] },
        { name: 'same', offset: 500, notes: [0] }
      ],
      selected: [500]
    },
    expect: { notes: ['main@500'], groups: ['same'], messages: 0, finished: 1 }
  },
  {
    name: 'group start uses its first note, not its offset alone',
    spec: {
      groups: [
        { name: 'main', notes: [500] },
        { name: 'late-first-note', offset: 400, notes: [200] }
      ],
      selected: [500]
    },
    expect: { notes: ['main@500'], groups: ['late-first-note'], messages: 0, finished: 1 }
  },
  {
    name: 'empty note groups are skipped',
    spec: {
      groups: [
        { name: 'main', notes: [0] },
        { name: 'empty', offset: 1000, notes: [] }
      ],
      selected: [0]
    },
    expect: { notes: ['main@0'], groups: [], messages: 0, finished: 1 }
  },

  // editing inside a note group: onsets are relative to that group, so the
  // comparison with other groups must add its time offset
  {
    name: 'inside an offset group, other groups are compared in absolute time',
    spec: {
      groups: [
        { name: 'main', notes: [0] },
        { name: 'verse', offset: 1000, notes: [0, 100, 200] },
        { name: 'before', offset: 1050, notes: [0] },
        { name: 'after', offset: 1150, notes: [0] }
      ],
      current: 1,
      selected: [100]
    },
    expect: { notes: ['verse@100', 'verse@200'], groups: ['after'], messages: 0, finished: 1 }
  },
  {
    name: 'inside a group, the open group itself is not also selected as a group',
    spec: {
      groups: [
        { name: 'main', notes: [] },
        { name: 'verse', offset: 0, notes: [0, 100] }
      ],
      current: 1,
      selected: [0]
    },
    expect: { notes: ['verse@0', 'verse@100'], groups: [], messages: 0, finished: 1 }
  }
];

var failures = 0;

cases.forEach(function (testCase) {
  var calls = FakeSV.run(testCase.spec);
  var actual = {
    notes: calls.notes.slice().sort(),
    groups: calls.groups.slice().sort(),
    messages: calls.messages,
    finished: calls.finished
  };
  var expect = {
    notes: testCase.expect.notes.slice().sort(),
    groups: testCase.expect.groups.slice().sort(),
    messages: testCase.expect.messages,
    finished: testCase.expect.finished
  };
  var pass = JSON.stringify(actual) === JSON.stringify(expect);

  if (!pass) {
    failures++;
    console.log(
      'FAIL: ' + testCase.name +
      ' expected=' + JSON.stringify(expect) +
      ' actual=' + JSON.stringify(actual)
    );
  }
});

// getClientInfo - what SynthV shows in the Scripts menu
var infoCases = [
  { field: 'name', expect: 'Select To End Of Track' },
  { field: 'category', expect: 'Selection' },
  { field: 'author', expect: 'Stuart Izon' }
];

var info = FakeSV.clientInfo();
infoCases.forEach(function (testCase) {
  if (info[testCase.field] !== testCase.expect) {
    failures++;
    console.log(
      'FAIL: getClientInfo().' + testCase.field +
      ' expected=' + JSON.stringify(testCase.expect) +
      ' actual=' + JSON.stringify(info[testCase.field])
    );
  }
});

var total = cases.length + infoCases.length;
if (failures === 0) {
  console.log('All ' + total + ' selectToEnd tests passed.');
  process.exit(0);
} else {
  console.log(failures + ' of ' + total + ' tests failed.');
  process.exit(1);
}
