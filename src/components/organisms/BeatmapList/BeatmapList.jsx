import { useState, useMemo } from 'react'
import { useAtom } from 'jotai'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { 
  FaMusic, 
  FaHeart, 
  FaDownload, 
  FaPlay, 
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaClock,
  FaUser,
  FaCalendar,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'
import { selectedBeatmapsAtom } from '../../../store'
import './BeatmapList.scss'

const BeatmapList = ({ 
  beatmaps = [], 
  loading = false, 
  onBeatmapSelect, 
  onBeatmapDownload,
  onBeatmapPlay,
  selectedBeatmaps = [],
  showSelection = true,
  compact = false 
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [, setSelectedBeatmapsAtom] = useAtom(selectedBeatmapsAtom)

  // Table columns configuration
  const columns = useMemo(() => {
    const baseColumns = [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="select-checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="select-checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            disabled={!row.getCanSelect()}
          />
        ),
        enableSorting: false,
        size: 50,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className="beatmap-info">
            <div className="beatmap-title">{row.original.title}</div>
            <div className="beatmap-artist">{row.original.artist}</div>
          </div>
        ),
        size: 300,
      },
      {
        accessorKey: 'creator',
        header: 'Mapper',
        cell: ({ getValue }) => (
          <div className="mapper-cell">
            <FaUser className="mapper-icon" />
            <span>{getValue()}</span>
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'difficulty_rating',
        header: 'Difficulty',
        cell: ({ getValue }) => (
          <div className="difficulty-cell">
            <span className={`difficulty-stars difficulty-${Math.floor(getValue() || 0)}`}>
              {'★'.repeat(Math.min(Math.floor(getValue() || 0), 5))}
            </span>
            <span className="difficulty-value">{(getValue() || 0).toFixed(2)}★</span>
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: 'bpm',
        header: 'BPM',
        cell: ({ getValue }) => (
          <div className="bpm-cell">
            <FaClock className="bpm-icon" />
            <span>{getValue() || 'N/A'}</span>
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: 'total_length',
        header: 'Length',
        cell: ({ getValue }) => {
          const seconds = getValue() || 0
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          return (
            <div className="length-cell">
              <span>{minutes}:{remainingSeconds.toString().padStart(2, '0')}</span>
            </div>
          )
        },
        size: 80,
      },
      {
        accessorKey: 'ranked_date',
        header: 'Date',
        cell: ({ getValue }) => (
          <div className="date-cell">
            <FaCalendar className="date-icon" />
            <span>{getValue() ? new Date(getValue()).toLocaleDateString() : 'N/A'}</span>
          </div>
        ),
        size: 100,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="action-buttons">
            <button
              className="action-btn play-btn"
              onClick={() => onBeatmapPlay?.(row.original)}
              title="Preview"
            >
              <FaPlay />
            </button>
            <button
              className="action-btn download-btn"
              onClick={() => onBeatmapDownload?.(row.original)}
              title="Download"
            >
              <FaDownload />
            </button>
            <button
              className="action-btn favorite-btn"
              onClick={() => onBeatmapSelect?.(row.original)}
              title="Add to collection"
            >
              <FaHeart />
            </button>
          </div>
        ),
        enableSorting: false,
        size: 120,
      },
    ]

    return showSelection ? baseColumns : baseColumns.slice(1)
  }, [showSelection, onBeatmapPlay, onBeatmapDownload, onBeatmapSelect])

  const table = useReactTable({
    data: beatmaps,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      rowSelection: selectedBeatmaps.reduce((acc, id) => {
        acc[id] = true
        return acc
      }, {}),
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(table.getState().rowSelection)
        : updater
      
      const selectedIds = Object.keys(newSelection).filter(key => newSelection[key])
      setSelectedBeatmapsAtom(selectedIds)
    },
    globalFilterFn: 'includesString',
    initialState: {
      pagination: {
        pageSize: compact ? 25 : 50,
      },
    },
  })

  const getSortIcon = (column) => {
    const sorted = column.getIsSorted()
    if (sorted === 'asc') return <FaSortUp />
    if (sorted === 'desc') return <FaSortDown />
    return <FaSort />
  }

  if (loading) {
    return (
      <div className="beatmap-list-loading">
        <div className="loading-spinner large"></div>
        <span>Loading beatmaps...</span>
      </div>
    )
  }

  if (beatmaps.length === 0) {
    return (
      <div className="beatmap-list-empty">
        <FaMusic className="empty-icon" />
        <h3>No beatmaps found</h3>
        <p>Try adjusting your search criteria or filters</p>
      </div>
    )
  }

  return (
    <div className={`beatmap-list ${compact ? 'compact' : ''}`}>
      <div className="list-header">
        <div className="list-info">
          <FaMusic className="list-icon" />
          <span className="list-title">
            Beatmaps ({table.getFilteredRowModel().rows.length})
          </span>
          {showSelection && table.getSelectedRowModel().rows.length > 0 && (
            <span className="selection-info">
              {table.getSelectedRowModel().rows.length} selected
            </span>
          )}
        </div>

        <div className="list-controls">
          <input
            type="text"
            placeholder="Search beatmaps..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="beatmap-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className="header-content"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && getSortIcon(header.column)}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`${row.getIsSelected() ? 'selected' : ''} ${
                  selectedBeatmaps.includes(row.original.id) ? 'highlighted' : ''
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <div className="pagination-info">
          <span>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </span>
        </div>

        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <FaChevronLeft />
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: table.getPageCount() }, (_, i) => (
              <button
                key={i}
                className={`page-btn ${table.getState().pagination.pageIndex === i ? 'active' : ''}`}
                onClick={() => table.setPageIndex(i)}
              >
                {i + 1}
              </button>
            )).slice(
              Math.max(0, table.getState().pagination.pageIndex - 2),
              Math.min(table.getPageCount(), table.getState().pagination.pageIndex + 3)
            )}
          </div>

          <button
            className="pagination-btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <FaChevronRight />
          </button>
        </div>

        <div className="page-size-selector">
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="page-size-select"
          >
            {[25, 50, 100, 200].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default BeatmapList
