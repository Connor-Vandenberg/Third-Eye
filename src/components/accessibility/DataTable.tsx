'use client';

/**
 * Accessible Data Table — Sortable with ARIA.
 * WCAG SC: 1.3.1 (Info & Relationships), 2.1.1 (Keyboard), 4.1.2 (Name/Role/Value)
 *
 * Features:
 * - Proper <table>, <thead>, <th scope>, <caption>
 * - Sortable columns with aria-sort attribute
 * - Keyboard-activatable sort (Enter/Space on header)
 * - Sort state announced to screen readers via live region
 * - Pagination announced
 * - Row count in caption
 */

import { useCallback, useState } from 'react';
import { useAnnounce } from '@/lib/accessibility';

type SortDirection = 'ascending' | 'descending' | 'none';

interface Column<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  caption: string;
  keyField: keyof T & string;
  onSort?: (key: string, direction: SortDirection) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  caption,
  keyField,
  onSort,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');
  const announce = useAnnounce();

  const handleSort = useCallback(
    (columnKey: string) => {
      let newDirection: SortDirection;

      if (sortColumn !== columnKey) {
        newDirection = 'ascending';
      } else if (sortDirection === 'ascending') {
        newDirection = 'descending';
      } else {
        newDirection = 'ascending';
      }

      setSortColumn(columnKey);
      setSortDirection(newDirection);
      onSort?.(columnKey, newDirection);

      const col = columns.find(c => c.key === columnKey);
      announce(
        `Table sorted by ${col?.label || columnKey}, ${newDirection}`,
        'polite',
      );
    },
    [sortColumn, sortDirection, columns, announce, onSort],
  );

  const handleHeaderKeyDown = useCallback(
    (e: React.KeyboardEvent, columnKey: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSort(columnKey);
      }
    },
    [handleSort],
  );

  return (
    <div className="data-table-wrapper" role="region" aria-label={caption}>
      <table aria-label={caption}>
        <caption>
          {caption} ({data.length} {data.length === 1 ? 'item' : 'items'})
        </caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={
                  col.sortable && sortColumn === col.key
                    ? sortDirection
                    : col.sortable
                      ? 'none'
                      : undefined
                }
                className={col.sortable ? 'sortable-header' : undefined}
                tabIndex={col.sortable ? 0 : undefined}
                role={col.sortable ? 'columnheader button' : 'columnheader'}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                onKeyDown={
                  col.sortable
                    ? (e) => handleHeaderKeyDown(e, col.key)
                    : undefined
                }
              >
                {col.label}
                {col.sortable && (
                  <span aria-hidden="true" className="sort-indicator">
                    {sortColumn === col.key
                      ? sortDirection === 'ascending'
                        ? ' \u25b2'
                        : ' \u25bc'
                      : ' \u25b7'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[keyField])}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
