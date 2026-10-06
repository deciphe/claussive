const pairedIds = [
  "maven-001", "maven-002", "maven-003", "maven-004", "maven-005", "maven-006",
  "maven-008", "maven-009", "maven-010", "maven-011", "maven-012", "maven-013",
  "maven-014", "maven-015", "maven-016", "maven-017", "maven-018", "maven-019",
  "maven-020", "maven-021", "maven-022", "maven-023", "maven-024", "maven-025",
  "maven-027", "maven-028",
];

export const depositById = Object.fromEntries(
  pairedIds.map(id => [id, `${import.meta.env.BASE_URL}payouts/maven-deposits/${id}-deposit.jpg`]),
);

// Owner-confirmed total; remaining receipt images will be supplied separately.
export const depositCount = 31;
