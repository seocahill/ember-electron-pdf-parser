import { test } from 'qunit';
import moduleForAcceptance from 'pdf-to-csv/tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | smoke test');

test('basic smoke-test', function(assert) {
  visit('/');

  andThen(function() {
    assert.equal(currentURL(), '/');
  });
});
