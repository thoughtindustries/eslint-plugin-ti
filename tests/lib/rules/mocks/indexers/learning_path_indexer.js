module.exports = {
  *index(r, learningPathIds) {
    yield redshiftIndexer.index(r, 'learningPaths', learningPathIds);
  }
};
