import AppRoute from './Routes/AppRoute'
import ThemeProvider from './components/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <AppRoute />
    </ThemeProvider>
  )
}
