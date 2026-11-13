function AttributeRow({ attribute }) {
  const value = attribute.value
    ?? (attribute.currentValue !== undefined && attribute.maxValue !== undefined
      ? `${attribute.currentValue}/${attribute.maxValue}`
      : null);

  return (
    <div className="section-item">
      <div className="section-row">
        <p className="section-label">{attribute.name}:</p>
        {value !== null && <p className="section-value">{value}</p>}
      </div>
      {attribute.description && (
        <p className="section-description">{attribute.description}</p>
      )}
    </div>
  );
}

function CharacterInfoSection({ title, columns = [], children }) {
  return (
    <section className="sections">
      <p className="section-title">{title}</p>
      <div className="section-columns">
        {columns.map((column, columnIndex) => (
          <div className="section-column" key={`${title}-${columnIndex}`}>
            {column.map((attribute, attributeIndex) => (
              <AttributeRow
                attribute={attribute}
                key={`${attribute.name}-${attributeIndex}`}
              />
            ))}
          </div>
        ))}
      </div>
      {children}
    </section>
  );
}

export default CharacterInfoSection;
