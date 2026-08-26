// Page title block. `actions` holds the (single) gold primary action on the
// right; `breadcrumb` renders a back link above the title on detail pages;
// `titleAdornment` sits inline after the title (e.g. a copy-number button).
export default function PageHeader({ title, subtitle, breadcrumb, actions, titleAdornment }) {
  return (
    <div className="mb-6">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="t-h1">{title}</h1>
            {titleAdornment}
          </div>
          {subtitle && <p className="t-secondary text-sm mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}
