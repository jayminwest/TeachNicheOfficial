import { render, screen } from '@testing-library/react'
import { Header } from '@/components/ui/header'
import '@testing-library/jest-dom'

describe('Header', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Header />)
      expect(screen.getByText('Teach Niche')).toBeInTheDocument()
    })
  })
})
