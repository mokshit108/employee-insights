import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { API_ENDPOINT, AUDIT_IMAGE_STORAGE_KEY } from '../constants'
import { normalizeRecord } from '../utils/normalize'

export const DataContext = createContext(null)

function getInitialAuditImage() {
  try {
    return localStorage.getItem(AUDIT_IMAGE_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function DataProvider({ children }) {
  const [employees, setEmployees] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [auditImage, setAuditImage] = useState(getInitialAuditImage)

  useEffect(() => {
    if (auditImage) {
      localStorage.setItem(AUDIT_IMAGE_STORAGE_KEY, auditImage)
    } else {
      localStorage.removeItem(AUDIT_IMAGE_STORAGE_KEY)
    }
  }, [auditImage])

  const fetchEmployees = useCallback(async () => {
    setStatus('loading')
    setError('')

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: '123456' }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const payload = await response.json()
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
            ? payload.result
            : []

      setEmployees(list.map(normalizeRecord))
      setStatus('success')
    } catch (fetchError) {
      const fallback = Array.from({ length: 3000 }, (_, index) =>
        normalizeRecord(
          {
            id: index + 1,
            name: `Fallback Employee ${index + 1}`,
            city: ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata'][index % 5],
            salary: 25000 + (index % 12) * 7000,
            department: ['Operations', 'Finance', 'Tech', 'HR'][index % 4],
            email: `fallback.${index + 1}@company.com`,
          },
          index,
        ),
      )

      setEmployees(fallback)
      setStatus('error')
      setError(fetchError.message)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const value = useMemo(
    () => ({ employees, status, error, fetchEmployees, auditImage, setAuditImage }),
    [auditImage, employees, error, fetchEmployees, status],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useEmployeeData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useEmployeeData must be used within DataProvider')
  return context
}
