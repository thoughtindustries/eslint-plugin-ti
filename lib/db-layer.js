module.exports.report = () => 'use the repository';

module.exports.replace = () => ({
  'r.pool.run(r.table(__a).insert(__b))': 'r[__a].insert(r, __b)',
  "(await r.pool.run(r.table('__a').insert(__b, { returnChanges: 'always' }))).changes[0].new_val":
    'await r["__a"].insertAndReturnFirstRow(r, __b)',
  "r.pool.run(r.table(__a).insert(__b, { returnChanges: 'always' })('changes').nth(0)('new_val'))":
    'r["__a"].insertAndReturnFirstRow(r, __b)',

  "const __a = (await r.pool.run(r.table('__b').insert(__c, { returnChanges: true }))).changes.map(change => change.new_val)":
    "const __a = await r['__b'].insert(r, __c)",

  "await r.pool.run(r.table('__a').get(__b))": 'await r["__a"].findById(r, __b)',

  'r.pool.run(r.table(tableName).update(__a))': 'r[tableName].update(r, __a)',
  "r.pool.run(r.table(__a).get(__b).update(__c))": "r[__a].update(r, __b, __c)",
  "r.pool.run(r.table(__a).get(__b).update(__c, { returnChanges: 'always' })('changes').nth(0)('new_val'))":
    "r[__a].updateAndReturnFirstRow(r, __b, __c)",
  "(await r.pool.run(r.table(__a).get(__b).update(__c, { returnChanges: 'always' }))).changes[0].new_val":
    "r[__a].updateAndReturnFirstRow(r, __b, __c)",

  "r.pool.run(r.table(__a).get(__b)(__c).default(null))":
    "r[__a].getAttributesByIds(r, [__b], [__c])?.[0]?.[__c]"
});
