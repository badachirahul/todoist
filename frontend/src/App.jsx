import { useQuery } from '@tanstack/react-query'
import { api } from './lib/api'

function App() {
  // Phase 0 smoke test: fetch the backend health endpoint through the full stack.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await api.get('/api/health')).data,
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Todoist Clone</h1>
        <p className="mt-1 text-sm text-gray-500">Phase 0 — stack smoke test</p>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm">
          {isLoading && <span className="text-gray-500">Checking backend…</span>}

          {isError && (
            <span className="text-red-600">
              Backend unreachable: {error?.message}
            </span>
          )}

          {data && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="font-medium text-gray-900">
                  Backend status: {data.status}
                </span>
              </div>
              <div className="text-gray-500">service: {data.service}</div>
              <div className="text-gray-500">time: {data.time}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
