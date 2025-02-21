import { render } from '../../../components/ui/test-utils'
import { axe } from 'axe-core'
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
      const { getByRole, getByLabelText, queryByRole } = render(<AboutPage />)
      
      // Test main heading
      const mainHeading = getByRole('heading', { name: 'About Teach Niche' })
      expect(mainHeading).toBeInTheDocument()

      // Test mission section
      const missionSection = getByRole('section', { name: /our mission/i })
      expect(missionSection).toHaveClass('bg-muted rounded-lg p-8 my-8 border-l-4 border-orange-500')

      // Test story section
      const storySection = getByRole('article', { name: /hello! i'm jaymin west/i })
      expect(storySection).toBeInTheDocument()

      // Test feature grids
      const forTeachersList = getByRole('list', { name: 'For Kendama Players' })
      expect(forTeachersList).toHaveChildren(3)

      const forStudentsList = getByRole('list', { name: 'For Students' })
      expect(forStudentsList).toHaveChildren(3)
    })

    it('meets accessibility requirements', async () => {
      const { container } = render(<AboutPage />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('interactions', () => {
    it('handles accordion interactions correctly', async () => {
      const { getByRole, queryByRole } = render(<AboutPage />)

      // Test "Values" accordion item
      const valuesTrigger = getByRole('button', { name: 'Values' })
      expect(queryByRole('region', { name: 'Community Collaboration' })).not.toBeVisible()
      
      await userEvent.click(valuesTrigger)
      const communityCollaboration = queryByRole('heading', { name: 'Community Collaboration' })
      expect(communityCollaboration).toBeVisible()

      // Test "Why Teach Niche?" accordion item
      const whyTrigger = getByRole('button', { name: /why teach niche/i })
      await userEvent.click(whyTrigger)
      const empowermentHeading = queryByRole('heading', { name: 'Empowerment' })
      expect(empowermentHeading).toBeVisible()
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
