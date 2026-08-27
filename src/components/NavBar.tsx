import { motion } from 'motion/react'
import { NavLink, useLocation } from 'react-router-dom'
import { EXPLORATIONS } from '../explorations'

/*
 * The active pill is a single shared element (layoutId) rather than a class on
 * each link, so switching pages slides it across instead of popping.
 */
export function NavBar() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-separator bg-surface/80 backdrop-blur-xl transition-colors duration-500">
      <nav className="flex items-center gap-6 px-6 py-3">
        <span className="text-sm font-semibold text-label transition-colors duration-500">
          Animation Playground
        </span>
        <div className="flex items-center gap-1">
          {EXPLORATIONS.map((exploration) => {
            const active = pathname === exploration.path
            return (
              <NavLink
                key={exploration.path}
                to={exploration.path}
                title={exploration.description}
                className="relative rounded-pill px-3 py-1.5 text-sm font-medium transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.2 }}
                    className="absolute inset-0 rounded-pill bg-fill-quaternary"
                  />
                )}
                <span
                  className={`relative transition-colors duration-500 ${
                    active ? 'text-label' : 'text-label-secondary'
                  }`}
                >
                  {exploration.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
