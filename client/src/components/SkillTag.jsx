export function SkillTag({ children, kind = 'matched' }) {
  return <span className={`skill-tag ${kind}`}>{children}</span>;
}

export function SkillTagList({ items = [], kind = 'matched', emptyLabel = 'None identified' }) {
  if (!items.length) return <p className="muted small">{emptyLabel}</p>;
  return (
    <div className="tag-list">
      {items.map((skill, i) => (
        <SkillTag key={`${skill}-${i}`} kind={kind}>
          {skill}
        </SkillTag>
      ))}
    </div>
  );
}
