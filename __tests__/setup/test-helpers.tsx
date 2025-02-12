import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'

export const findByTextWithMarkup = (text: string) => {
  return screen.getByText((content, node) => {
    const hasText = (node: Element) => node.textContent === text
    const nodeHasText = node ? hasText(node) : false
    const childrenDontHaveText = Array.from(node?.children || []).every(
      child => !hasText(child as Element)
    )
    return nodeHasText && childrenDontHaveText
  })
}

export const setup = (jsx: React.ReactElement) => {
  return {
    user: userEvent.setup(),
    ...render(jsx)
  }
}

export const waitForLoadingToFinish = () =>
  screen.findByTestId('loading-complete')
