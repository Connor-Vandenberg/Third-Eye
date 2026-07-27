'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Download,
  Settings, ChevronLeft, ChevronRight, Eye, EyeOff, Copy,
  ExternalLink, Columns, SlidersHorizontal, X, Check,
  MoreHorizontal, Trash2, RefreshCw
} from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between';

export interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'score' | 'badge' | 'link' | 'array';
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  pinned?: 'left' | 'right' | null;
  format?: (value: any, row: any) => string | React.ReactNode;
  color?: (value: any) => string;
  exportFormat?: (value: any) => string;
}

export interface ActiveFilter {
  column: string;
  operator: FilterOperator;
  value: any;
}

export interface ObjectTableProps {
  data: any[];
  columns: ColumnConfig[];
  onRowClick?: (row: any) => void;
  onRowSelect?: (rows: any[]) => void;
  onExport?: (format: 'csv' | 'json' | 'stix') => void;
  selectable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  totalCount?: number;
  loading?: boolean;
  searchable?: boolean;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  rowHeight?: 'compact' | 'normal' | 'relaxed';
  zebra?: boolean;
  highlightOnHover?: boolean;
}

function ScoreCell({ value }: { value: number }) {
  const color = value >= 80 ? '#ef4444' : value >= 60 ? '#f97316' : value >= 40 ? '#fbbf24' : value >= 20 ? '#10b981' : '#6b7280';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function BadgeCell({ value, color }: { value: string; color?: string }) {
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${color || '#6b7280'}20`, color: color || '#9ca3af' }}>
      {value}
    </span>
  );
}

export function ObjectTable({
  data,
  columns: initialColumns,
  onRowClick,
  onRowSelect,
  onExport,
  selectable = false,
  pagination = true,
  pageSize: initialPageSize = 25,
  totalCount,
  loading = false,
  searchable = true,
  title,
  subtitle,
  emptyMessage = 'No data found',
  className = '',
  stickyHeader = true,
  rowHeight = 'normal',
  zebra = true,
  highlightOnHover = true,
}: ObjectTableProps) {
  const [columns, setColumns] = useState(initialColumns.map(c => ({ ...c, visible: c.visible !== false })));
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Global search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        visibleColumns.some(col => {
          const val = row[col.accessor];
          return val != null && String(val).toLowerCase().includes(query);
        })
      );
    }

    // Column filters
    filters.forEach(filter => {
      result = result.filter(row => {
        const val = row[filter.column];
        switch (filter.operator) {
          case 'eq': return val === filter.value;
          case 'neq': return val !== filter.value;
          case 'gt': return val > filter.value;
          case 'lt': return val < filter.value;
          case 'gte': return val >= filter.value;
          case 'lte': return val <= filter.value;
          case 'contains': return String(val).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'startsWith': return String(val).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith': return String(val).toLowerCase().endsWith(String(filter.value).toLowerCase());
          default: return true;
        }
      });
    });

    // Sort
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortColumn, sortDirection, visibleColumns]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = pagination ? processedData.slice(page * pageSize, (page + 1) * pageSize) : processedData;

  const handleSort = useCallback((columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortColumn(null); setSortDirection(null); }
      else setSortDirection('asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((_, i) => page * pageSize + i)));
    }
  }, [paginatedData, selectedRows, page, pageSize]);

  const handleSelectRow = useCallback((index: number) => {
    const globalIndex = page * pageSize + index;
    const newSelection = new Set(selectedRows);
    if (newSelection.has(globalIndex)) newSelection.delete(globalIndex);
    else newSelection.add(globalIndex);
    setSelectedRows(newSelection);
    onRowSelect?.(Array.from(newSelection).map(i => processedData[i]));
  }, [page, pageSize, selectedRows, processedData, onRowSelect]);

  const toggleColumn = useCallback((columnId: string) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, visible: !c.visible } : c));
  }, []);

  const exportCSV = useCallback(() => {
    const headers = visibleColumns.map(c => c.label).join(',');
    const rows = processedData.map(row =>
      visibleColumns.map(col => {
        const val = row[col.accessor];
        const formatted = col.exportFormat ? col.exportFormat(val) : String(val ?? '');
        return `"${formatted.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title || 'export'}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [visibleColumns, processedData, title]);

  const rowHeightClass = rowHeight === 'compact' ? 'py-1.5' : rowHeight === 'relaxed' ? 'py-3' : 'py-2';

  const renderCell = (col: ColumnConfig, row: any) => {
    const value = row[col.accessor];
    if (col.format) return col.format(value, row);

    switch (col.type) {
      case 'score': return <ScoreCell value={value} />;
      case 'badge': return <BadgeCell value={value} color={col.color?.(value)} />;
      case 'date': return <span className="font-mono text-[10px]">{value ? new Date(value).toLocaleString() : '-'}</span>;
      case 'number': return <span className="font-mono">{value?.toLocaleString() ?? '-'}</span>;
      case 'boolean': return value ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-zinc-600" />;
      case 'array': return <span className="text-[10px]">{Array.isArray(value) ? value.join(', ') : '-'}</span>;
      case 'link': return <a href={value} className="text-cyan-400 hover:underline text-[10px]" target="_blank" rel="noreferrer">{value}</a>;
      default: return <span className="truncate">{value ?? '-'}</span>;
    }
  };

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          {title && <h3 className="text-sm font-bold text-white">{title}</h3>}
          {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                placeholder="Search..."
                className="bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white placeholder-zinc-500 w-48 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}
          <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-1.5 rounded-lg border transition-colors ${filters.length > 0 ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowColumnConfig(!showColumnConfig)} className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button onClick={exportCSV} className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Export CSV">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column Config Panel */}
      <AnimatePresence>
        {showColumnConfig && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-b border-zinc-800 bg-zinc-900/80">
            <div className="p-3">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Visible Columns</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {columns.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`text-[9px] px-2 py-1 rounded border transition-colors ${
                      col.visible ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {col.visible ? <Eye className="w-2.5 h-2.5 inline mr-1" /> : <EyeOff className="w-2.5 h-2.5 inline mr-1" />}
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 flex-wrap">
          <span className="text-[9px] text-zinc-500">Filters:</span>
          {filters.map((f, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center gap-1">
              {f.column} {f.operator} {String(f.value)}
              <button onClick={() => setFilters(prev => prev.filter((_, j) => j !== i))}><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
          <button onClick={() => setFilters([])} className="text-[9px] text-zinc-500 hover:text-white">Clear all</button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-zinc-900 border-b border-zinc-800">
              {selectable && (
                <th className="px-3 py-2 w-8">
                  <input type="checkbox" checked={selectedRows.size === paginatedData.length && paginatedData.length > 0} onChange={handleSelectAll} className="rounded border-zinc-600" />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={`px-3 ${rowHeightClass} text-left text-[9px] uppercase tracking-wider text-zinc-500 font-medium ${col.sortable !== false ? 'cursor-pointer hover:text-zinc-300 select-none' : ''}`}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable !== false && sortColumn === col.accessor && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-zinc-800/50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${
                  highlightOnHover ? 'hover:bg-zinc-800/30' : ''
                } ${
                  zebra && i % 2 === 1 ? 'bg-zinc-900/30' : ''
                } ${
                  selectedRows.has(page * pageSize + i) ? 'bg-cyan-500/5' : ''
                }`}
              >
                {selectable && (
                  <td className="px-3 py-2 w-8" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedRows.has(page * pageSize + i)} onChange={() => handleSelectRow(i)} className="rounded border-zinc-600" />
                  </td>
                )}
                {visibleColumns.map((col) => (
                  <td key={col.id} className={`px-3 ${rowHeightClass} text-zinc-300`}>
                    {renderCell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="py-12 text-center text-zinc-500 text-sm">{loading ? 'Loading...' : emptyMessage}</div>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, processedData.length)} of {processedData.length}
            {totalCount && totalCount > processedData.length && ` (${totalCount.toLocaleString()} total)`}
            {selectedRows.size > 0 && ` • ${selectedRows.size} selected`}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30">
              <ChevronLeft className="w-3.5 h-3.5" /><ChevronLeft className="w-3.5 h-3.5 -ml-2" />
            </button>
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-zinc-400 px-2">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30">
              <ChevronRight className="w-3.5 h-3.5" /><ChevronRight className="w-3.5 h-3.5 -ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ObjectTable;
