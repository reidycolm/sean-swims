const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the actual renderer without browser/CDN dependencies. This verifies
// content and DOM ordering, not CSS layout or Chart.js rendering.
function dashboard() {
    const nodes = new Map();
    const cards = ['high', 'low'].map(type => ({
        type, order: {}, querySelector() { return this.order; }
    }));
    const summary = {
        children: [...cards],
        querySelector(selector) { return cards.find(card => selector.endsWith(`.${card.type}`)); },
        appendChild(card) { this.children = this.children.filter(child => child !== card); this.children.push(card); }
    };
    const context = {
        TideEngine: require('../tides'), TARBERT_TIDES_2026: require('../data/tides-2026'),
        Date: class extends Date { static now() { return context.now; } },
        window: {}, getMoonPhase: () => ({ icon: '', name: '', type: '' }),
        document: {
            querySelector: () => summary,
            getElementById(id) {
                if (!nodes.has(id)) nodes.set(id, { classList: { toggle() {} }, parentElement: {} });
                return nodes.get(id);
            }
        }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(require.resolve('../tide-ui.js'), 'utf8'), context);
    return { nodes, summary, render(instant) {
        context.now = Date.parse(instant);
        vm.runInContext('renderTidesFromTable()', context);
    } };
}

test('next tide cards follow chronological order and hero stays concise', () => {
    const ui = dashboard();
    ui.render('2026-09-05T09:00:00Z');
    assert.deepEqual(ui.summary.children.map(c => c.type), ['high', 'low']);
    assert.equal(ui.nodes.get('tide-state').textContent, '↗ Tide rising');
    ui.render('2026-09-05T11:37:00Z');
    assert.deepEqual(ui.summary.children.map(c => c.type), ['low', 'high']);
    assert.equal(ui.nodes.get('next-low-tide').textContent, '18:58');
    assert.equal(ui.nodes.get('next-high-tide').textContent, '01:28');
    assert.equal(ui.nodes.get('high-tide-context').textContent, 'Tomorrow');
    assert.equal(ui.nodes.get('low-tide-countdown').textContent, 'In 6h 21m');
    assert.equal(ui.nodes.get('tide-state').textContent, '↘ Tide falling');
    assert.deepEqual(ui.summary.children.map(c => c.order.textContent), ['Next tide', 'Following tide']);
    assert.equal(ui.summary.children.length, 2);
});

test('ordering handles the clock change and exhausted source coverage', () => {
    const ui = dashboard();
    ui.render('2026-10-24T20:00:00Z');
    assert.deepEqual(ui.summary.children.map(c => c.type), ['low', 'high']);
    assert.equal(ui.nodes.get('next-low-tide').textContent, '23:24');
    assert.equal(ui.nodes.get('next-high-tide').textContent, '04:38');
    ui.render('2026-10-25T01:30:00Z');
    assert.deepEqual(ui.summary.children.map(c => c.type), ['high', 'low']);
    assert.equal(ui.nodes.get('high-tide-countdown').textContent, 'In 3h 8m');
    ui.render('2026-12-31T20:00:00Z');
    assert.equal(ui.summary.children[0].type, 'high');
    assert.equal(ui.summary.children[1].order.textContent, 'Unavailable');
    ui.render('2027-01-01T00:00:00Z');
    assert.equal(ui.nodes.get('tide-state').textContent, 'Tide state unavailable');
    assert.equal(ui.summary.children.length, 2);
});
