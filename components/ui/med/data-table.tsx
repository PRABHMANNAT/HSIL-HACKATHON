"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Eye,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /** Stable column identifier. */
  id: string;
  /** Header label. */
  header: string;
  /** Field key or accessor function used to resolve values. */
  accessor: keyof T | ((row: T) => string | number);
  /** Optional custom cell renderer. */
  cell?: (row: T) => React.ReactNode;
  /** Whether the column can be sorted. */
  sortable?: boolean;
  /** Optional static filter options. */
  filterOptions?: string[];
}

export interface DataTableProps<T extends { id: string }> {
  /** Column definitions used to render the table. */
  columns: Array<DataTableColumn<T>>;
  /** Source rows shown in the table. */
  data: T[];
  /** Accessible label for the table region. */
  ariaLabel: string;
  /** Optional caption rendered above the toolbar. */
  caption?: string;
  /** Rows per page. */
  pageSize?: number;
}

function resolveValue<T>(row: T, accessor: DataTableColumn<T>["accessor"]) {
  if (typeof accessor === "function") {
    return accessor(row);
  }

  return row[accessor];
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  ariaLabel,
  caption,
  pageSize = 4,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [filters, setFilters] = React.useState<Record<string, string[]>>({});
  const [hiddenColumns, setHiddenColumns] = React.useState<string[]>([]);

  const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.id));
  const lowerSearch = search.trim().toLowerCase();

  let rows = data.filter((row) => {
    const matchesSearch =
      !lowerSearch ||
      columns.some((column) =>
        String(resolveValue(row, column.accessor)).toLowerCase().includes(lowerSearch),
      );

    if (!matchesSearch) {
      return false;
    }

    return columns.every((column) => {
      const filterValues = filters[column.id];
      if (!filterValues?.length) {
        return true;
      }

      const value = String(resolveValue(row, column.accessor));
      return filterValues.includes(value);
    });
  });

  if (sortColumn) {
    const activeColumn = columns.find((column) => column.id === sortColumn);
    if (activeColumn) {
      rows = [...rows].sort((left, right) => {
        const leftValue = String(resolveValue(left, activeColumn.accessor));
        const rightValue = String(resolveValue(right, activeColumn.accessor));
        const result = leftValue.localeCompare(rightValue, undefined, { numeric: true });
        return sortDirection === "asc" ? result : result * -1;
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((row) => selectedRows.includes(row.id));

  function toggleSort(columnId: string) {
    if (sortColumn !== columnId) {
      setSortColumn(columnId);
      setSortDirection("asc");
      return;
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  }

  function toggleFilter(columnId: string, value: string) {
    setFilters((current) => {
      const currentValues = current[columnId] ?? [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...current,
        [columnId]: nextValues,
      };
    });
    setCurrentPage(1);
  }

  function toggleColumnVisibility(columnId: string) {
    setHiddenColumns((current) =>
      current.includes(columnId)
        ? current.filter((item) => item !== columnId)
        : [...current, columnId],
    );
  }

  function exportCsv() {
    const headings = visibleColumns.map((column) => column.header);
    const body = rows.map((row) =>
      visibleColumns
        .map((column) => JSON.stringify(String(resolveValue(row, column.accessor))))
        .join(","),
    );
    const blob = new Blob([[headings.join(","), ...body].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meddevice-suite-pro-table.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="space-y-4"
      aria-label={ariaLabel}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {caption ? (
            <h3 className="text-lg font-medium text-[var(--text-primary)]">{caption}</h3>
          ) : null}
          <p className="text-sm text-[var(--text-secondary)]">
            Sort, filter, select rows, and export the current evidence view.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search rows"
            aria-label="Search table rows"
            className="w-[220px] rounded-full"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="rounded-full">
                <Filter className="mr-2 size-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {columns
                .filter((column) => column.filterOptions?.length)
                .map((column) => (
                  <div key={column.id}>
                    <DropdownMenuLabel>{column.header}</DropdownMenuLabel>
                    {column.filterOptions?.map((option) => (
                      <DropdownMenuCheckboxItem
                        key={`${column.id}-${option}`}
                        checked={(filters[column.id] ?? []).includes(option)}
                        onCheckedChange={() => toggleFilter(column.id, option)}
                      >
                        {option}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="rounded-full">
                <Eye className="mr-2 size-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={!hiddenColumns.includes(column.id)}
                  onCheckedChange={() => toggleColumnVisibility(column.id)}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" className="rounded-full" onClick={exportCsv}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)]/78">
        <div className="max-h-[380px] overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10 bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)] backdrop-blur-xl">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={() =>
                      setSelectedRows((current) =>
                        allPageSelected
                          ? current.filter((id) => !pageRows.some((row) => row.id === id))
                          : Array.from(new Set([...current, ...pageRows.map((row) => row.id)])),
                      )
                    }
                    aria-label="Select current page rows"
                  />
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    className="px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]"
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.id)}
                        className="inline-flex items-center gap-2"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {column.header}
                        {sortColumn === column.id ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <motion.tr
                  key={row.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group border-l-2 border-transparent hover:border-[var(--primary)]"
                >
                  <td className="border-t border-[var(--border)] px-4 py-3 align-top">
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onCheckedChange={() =>
                        setSelectedRows((current) =>
                          current.includes(row.id)
                            ? current.filter((id) => id !== row.id)
                            : [...current, row.id],
                        )
                      }
                      aria-label={`Select row ${row.id}`}
                    />
                  </td>
                  {visibleColumns.map((column) => (
                    <td
                      key={`${row.id}-${column.id}`}
                      className={cn(
                        "border-t border-[var(--border)] px-4 py-4 align-top text-[var(--text-primary)]",
                        "group-hover:bg-[color:color-mix(in_srgb,var(--primary)_4%,transparent)]",
                      )}
                    >
                      {column.cell ? column.cell(row) : String(resolveValue(row, column.accessor))}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <span>
            {selectedRows.length} selected • {rows.length} total rows
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
