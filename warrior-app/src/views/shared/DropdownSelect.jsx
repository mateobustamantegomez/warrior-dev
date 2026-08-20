import { useEffect, useRef, useState } from 'react'

/**
 * DropdownSelect
 * --------------
 * VIEW layer (shared UI primitive). Custom-styled replacement for the
 * native <select> — the browser's own expanded-menu chrome can't be
 * restyled, and it broke the military HUD look. Pure presentation:
 * receives `options`, `value`, `onChange` and has no business logic.
 */
function DropdownSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function selectOption(option) {
    onChange(option)
    setOpen(false)
  }

  return (
    <div className="dropdown" ref={rootRef}>
      {label && <span className="dropdown-label">{label}</span>}
      <button
        type="button"
        className={`dropdown-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value}</span>
        <span className="dropdown-caret" aria-hidden="true" />
      </button>

      {open && (
        <ul className="dropdown-list" role="listbox">
          {options.map((option) => (
            <li key={option} role="option" aria-selected={option === value}>
              <button
                type="button"
                className={`dropdown-option${option === value ? ' selected' : ''}`}
                onClick={() => selectOption(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DropdownSelect
