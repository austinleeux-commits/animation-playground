import { Agentation } from 'agentation'
import { DialRoot } from 'dialkit'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { EXPLORATIONS } from './explorations'
import { ThemeProvider } from './theme/ThemeProvider'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="flex min-h-svh flex-col bg-surface transition-colors duration-500">
          <NavBar />
          <Routes>
            {EXPLORATIONS.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Routes>

          <DialRoot position="top-right" />
          {import.meta.env.DEV && <Agentation />}
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
