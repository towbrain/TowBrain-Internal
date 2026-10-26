import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('shows a configuration error screen when Supabase env vars are missing', () => {
    render(<App />)
    expect(screen.getByText(/configuration needed/i)).toBeInTheDocument()
  })
})
