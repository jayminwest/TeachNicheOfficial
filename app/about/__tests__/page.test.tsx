import { render, userEvent } from '../../__tests__/utils/test-utils'
import { axe } from 'jest-axe'
import React from 'react'
import AboutPage from '../page'

describe('AboutPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders without crashing', async () => {
      const { container } = render(<AboutPage />)
      expect(container).toBeTruthy()
    })

    it('renders expected elements', async () => {
      const { getByRole, getByText } = render(<AboutPage />)
      
      // Test main heading
      const mainHeading = getByRole('heading', { name: 'About Teach Niche' })
      expect(mainHeading).toBeInTheDocument()

      // Test mission section
      const missionHeading = getByRole('heading', { name: /our mission/i })
      expect(missionHeading).toBeInTheDocument()
      const missionText = getByText(/The mission of Teach Niche is/i)
      expect(missionText).toBeInTheDocument()

      // Test story section
      const storyHeading = getByRole('heading', { name: /our story/i })
      expect(storyHeading).toBeInTheDocument()
      const storyText = getByText(/Hello! I'm Jaymin West/i)
      expect(storyText).toBeInTheDocument()

      // Test feature sections
      const teachersHeading = getByRole('heading', { name: 'For Kendama Players' })
      expect(teachersHeading).toBeInTheDocument()

      const studentsHeading = getByRole('heading', { name: 'For Students' })
      expect(studentsHeading).toBeInTheDocument()
    })

    it('meets accessibility requirements', async () => {
      const { container } = render(<AboutPage />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('interactions', () => {
    it('handles accordion interactions correctly', async () => {
      const { getAllByRole, getByText, queryByText } = render(<AboutPage />)

      // Get all accordion buttons
      const accordionButtons = getAllByRole('button')
      
      // Find the Values button
      const valuesTrigger = accordionButtons.find(button => 
        button.textContent?.includes('Values')
      )
      expect(valuesTrigger).toBeInTheDocument()
      
      // Initially, content should not be visible
      expect(queryByText(/Community Collaboration/i)).not.toBeVisible()
      
      // Click to expand
      if (valuesTrigger) {
        await userEvent.click(valuesTrigger)
      }
      
      // After clicking, content should be visible
      const valuesContent = getByText(/Community Collaboration/i)
      expect(valuesContent).toBeVisible()

      // Find the Why Teach Niche button
      const whyTrigger = accordionButtons.find(button => 
        button.textContent?.includes('Why Teach Niche')
      )
      expect(whyTrigger).toBeInTheDocument()
      
      // Click to expand
      if (whyTrigger) {
        await userEvent.click(whyTrigger)
      }
      
      // Content should be visible
      const whyContent = getByText(/Empowerment/i)
      expect(whyContent).toBeVisible()
    })
  })

  describe('props', () => {
    it('handles no props correctly', () => {
      // AboutPage has no required props and should render with defaults
      const { container } = render(<AboutPage />)
      expect(container).toBeTruthy()
    })
  })
})
