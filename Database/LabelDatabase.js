async function logKeyValuePairs(db, values) {
  for (const obj of values) {
    const columns = Object.keys(obj).filter(
      (key) => obj[key] !== undefined && obj[key] !== null,
    );
    if (columns.length === 0) continue; // Skip empty objects

    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => obj[key]);

    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO  category_type (${columns.join(", ")})
                 VALUES (${placeholders})`,
        [...values],
      );
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
}

function reduceArray(value, labelType) {
  return value.reduce((accumulator, currentObject) => {
    currentObject = { ...currentObject, type_group: labelType };
    accumulator[currentObject.type_id] = currentObject;
    return accumulator;
  }, {});
}

//---------------SQLITE Functions---------------//

export async function insertCategoryLabelSqlite(db, labels) {
  const documentTypes = reduceArray(labels.document_types, "Document Label");
  const photoTypes = reduceArray(labels.photo_types, "Photo Label");
  const commentTypes = reduceArray(labels.comment_types, "Comment Label");

  const obj = { ...documentTypes, ...photoTypes, ...commentTypes };
  const data = Object.values(obj);

  await logKeyValuePairs(db, data);

  console.log("Insert category type function ran");
}

export async function selectCategoryLabelSqlite(db, key, value) {
  try {
    return await db.getAllAsync(
      `SELECT * FROM category_type WHERE ${key} = ?`,
      [value],
    );
  } catch (error) {
    console.error("Select SQLITE contacts failed:", error);
  }
}
