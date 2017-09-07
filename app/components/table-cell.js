import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'td',
  attributeBindings: [
    'contenteditable',
  ],

  contenteditable: true,

  focusOut() {
    const newValue = this.$().text();
    if (this.get('value') !== newValue) {
      this.get('updateCell')(newValue);
    }
  }
});
