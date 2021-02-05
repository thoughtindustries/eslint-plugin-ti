function* copyLearningPath(learningPath, r, name, companyId) {
  const newLearningPathAttrs = {
    ...learningPath,
    company: companyId,
    milestones: [],
    createdAt: r.now(),
    name,
    // Cloned LPs should always be unpublished when first cloned.
    status: 'draft',
    slug: yield availableSlugFinder(r, companyId, 'learningPaths', parameterize(name))
  };

  delete newLearningPathAttrs.id;

  // walk:ignoreMissingIndexer
  return yield r.pool.run(
    r
      .table('learningPaths')
      .insert(newLearningPathAttrs, { returnChanges: 'always' })('changes')
      .nth(0)('new_val')
  );
}
