const { operator } = require('putout');
const { getProperty } = operator;

module.exports.report = () => 'use the repository';

module.exports.fix = path => {
  path.remove();
};

module.exports.traverse = ({ push }) => ({
  'r.pool.run(r.table(__a).insert(__b))'(path) {
    const obj = path.get('arguments.0.arguments.0');
    removeTimestamps(push, obj);
  },

  'r.pool.run(r.table(__a).update(__b))'(path) {
    const obj = path.get('arguments.0.arguments.0');
    removeTimestamps(push, obj);
  }
});

function removeTimestamps(push, obj) {
  if (obj?.isObjectExpression()) {
    ['createdAt', 'updatedAt'].forEach(propStr => {
      const prop = getProperty(obj, propStr);
      if (prop?.get('value')?.toString() === 'r.now()') {
        push(prop);
      }
    });
  }
}
