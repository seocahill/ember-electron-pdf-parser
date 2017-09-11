import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pdf-picker', 'Integration | Component | pdf picker', {
  integration: true
});

test('it renders', function(assert) {

  this.render(hbs`{{pdf-picker}}`);

  assert.equal(this.$().text().trim(), 'Choose file');
});
