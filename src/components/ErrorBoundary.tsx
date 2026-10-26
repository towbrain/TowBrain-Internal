import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center p-6 text-center">
          <div>
            <p className="font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">Try reloading the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
