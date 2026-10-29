import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Pagination({
  page,
  total,
  onPageChange,
}: {
  page: number
  total: number
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / 10))
  return (
    <div className="table-pagination">
      <span>
        {total ? `${(page - 1) * 10 + 1}–${Math.min(page * 10, total)}` : "0"} /{" "}
        {total}
      </span>
      <div>
        <button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={15} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .map((p) => (
            <button
              key={p}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={p === page ? "selected" : ""}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}
        <button
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
