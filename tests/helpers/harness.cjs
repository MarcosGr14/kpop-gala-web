// Executes the actual application scripts with storage owned only by this process.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../kpop-gala-web/js');

class MemoryStorage {
  constructor(initial = {}) { this.values = new Map(Object.entries(initial)); this.fail = null; }
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) {
    if (this.fail?.(String(key), String(value), 'set')) throw new Error('Simulated storage failure');
    this.values.set(String(key), String(value));
  }
  removeItem(key) {
    if (this.fail?.(String(key), null, 'remove')) throw new Error('Simulated storage failure');
    this.values.delete(String(key));
  }
  snapshot() { return Object.fromEntries(this.values); }
}

function element() {
  const children = [], listeners = new Map(), selectors = new Map();
  return {
    value: '', innerHTML: '', textContent: '', disabled: false, dataset: {}, style: {}, children,
    classList: { add() {}, remove() {}, toggle() {} },
    resetCount: 0, reset() { this.resetCount++; },
    setAttribute(name, value) { this[name] = value; },
    appendChild(child) { children.push(child); return child; },
    querySelector(sel) { if (!selectors.has(sel)) selectors.set(sel, element()); return selectors.get(sel); },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    async emit(type, event = {}) { for (const fn of listeners.get(type) || []) await fn(event); },
    remove() { this.removed = true; }, focus() {}, scrollIntoView() {},
  };
}

function harness(initial = {}) {
  const storage = new MemoryStorage(initial), nodes = new Map(), ready = [];
  const document = {
    readyState: 'loading', body: element(),
    addEventListener(type, fn) { if (type === 'DOMContentLoaded') ready.push(fn); },
    dispatchEvent() {}, createElement: element,
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); },
    querySelector(selector) { return this.getElementById(selector); },
    querySelectorAll() { return []; },
  };
  const context = vm.createContext({
    localStorage: storage, document,
    console: { warn() {}, error() {}, log() {} },
    location: { origin: 'https://isolated.invalid', pathname: '/index.html', search: '' },
    CustomEvent: class { constructor(type) { this.type = type; } },
    URL, URLSearchParams, Blob, atob, Uint8Array,
    setTimeout() { return 1; }, clearTimeout() {}, confirm() { return true; },
    // No real network or browser storage is reachable from application code.
    fetch() { throw new Error('Network disabled in tests'); },
  });
  context.window = context;
  context.addEventListener = document.addEventListener.bind(document);
  context.scrollTo = () => {};
  const run = code => vm.runInContext(code, context);
  const load = file => run(fs.readFileSync(path.join(root, file), 'utf8'));
  load('data.js');
  return { context, storage, document, nodes, ready, run, load,
    json: code => JSON.parse(JSON.stringify(run(code))),
    set: (key, value) => storage.setItem(key, JSON.stringify(value)),
  };
}

module.exports = { harness, MemoryStorage, element, root };
