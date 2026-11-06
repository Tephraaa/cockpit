export const TABLE_COLUMNS = [
  { key: "name", label: "Entreprises", className: "justify-start" },
  { key: "segment", label: "Segment et étape", className: "justify-start" },
  { key: "owner", label: "Responsable", className: "justify-start" },
  {
    key: "openDeals",
    label: "Affaires",
    className: "hidden justify-end tabular-nums 2xl:flex",
  },
  {
    key: "pipelineValue",
    label: "Pipeline",
    className: "justify-end tabular-nums",
  },
  {
    key: "winProbability",
    label: "Chances de signer",
    className: "justify-end tabular-nums",
  },
  { key: "trend", label: "Activité", className: "justify-center" },
  {
    key: "lastInteraction",
    label: "Dernier échange",
    className: "justify-start",
  },
  { key: "action", label: "Action", className: "justify-center" },
] as const;

export type TableColumnKey = (typeof TABLE_COLUMNS)[number]["key"];

export const TABLE_GRID_CLASS =
  "grid min-w-max grid-cols-[repeat(8,max-content)] justify-between 2xl:grid-cols-[repeat(9,max-content)]";

export const TABLE_ROW_CLASS = "col-span-full grid grid-cols-subgrid";

export const TABLE_CELL_CLASS = "flex items-center";

export function columnClass(key: TableColumnKey) {
  return TABLE_COLUMNS.find((column) => column.key === key)?.className ?? "";
}
