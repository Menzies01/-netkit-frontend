import React, { memo } from 'react'
import { NavLink } from 'react-router-dom'

export const Sidebar = memo(() => (
  <nav className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-2">
    <div className="text-blue-500 font-bold text-lg mb-4">N</div>
    <NavLink
      to="/"
      end
      className={({ isActive }) =>
        `w-8 h-8 flex items-center justify-center rounded transition-colors ${
          isActive ? 'bg-gray-800 text-blue-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
        }`
      }
      title="Overview"
    >
      ◈
    </NavLink>
    <NavLink
      to="/policies"
      className={({ isActive }) =>
        `w-8 h-8 flex items-center justify-center rounded transition-colors ${
          isActive ? 'bg-gray-800 text-blue-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
        }`
      }
      title="Policies"
    >
      ⚡
    </NavLink>
  </nav>
))

Sidebar.displayName = 'Sidebar'