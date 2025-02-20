import { render, screen } from '@testing-library/react'
import { Header } from '@/components/ui/header'
import { describe, it, expect } from 'vitest'

describe('Header', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Header />)
      expect(screen.getByText('Teach Niche')).toBeInTheDocument()
    })
  })
})
