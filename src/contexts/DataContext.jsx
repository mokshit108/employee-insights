import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { API_ENDPOINT, AUDIT_IMAGE_STORAGE_KEY, API_PAYLOAD_USER, API_PAYLOAD_PASS } from '../constants'
import { normalizeRecord } from '../utils/normalize'

export const DataContext = createContext(null)

function getInitialAuditImages() {
  try {
    const saved = localStorage.getItem(AUDIT_IMAGE_STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export function DataProvider({ children }) {
  const [employees, setEmployees] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [auditImages, setAuditImages] = useState(getInitialAuditImages)

  useEffect(() => {
    localStorage.setItem(AUDIT_IMAGE_STORAGE_KEY, JSON.stringify(auditImages))
  }, [auditImages])

  const setEmployeeAuditImage = useCallback((id, imageData) => {
    setAuditImages((prev) => ({
      ...prev,
      [id]: imageData,
    }))
  }, [])

  const fetchEmployees = useCallback(async () => {
    setStatus('loading')
    setError('')

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: API_PAYLOAD_USER, password: API_PAYLOAD_PASS }),
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
            : Array.isArray(payload?.TABLE_DATA?.data)
              ? payload.TABLE_DATA.data
              : []

      if (list.length === 0) {
        throw new Error('API returned empty dataset')
      }

      const normalizedList = list.map((item, index) => {
        // If the item is an array (like the current API returns), convert to object
        if (Array.isArray(item)) {
          return normalizeRecord({
            name: item[0],
            department: item[1],
            city: item[2],
            id: item[3],
            salary: item[5]
          }, index)
        }
        return normalizeRecord(item, index)
      })

      setEmployees(normalizedList)
      setStatus('success')
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
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
    () => ({
      employees,
      status,
      error,
      fetchEmployees,
      auditImages,
      setEmployeeAuditImage,
    }),
    [auditImages, employees, error, fetchEmployees, setEmployeeAuditImage, status],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useEmployeeData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useEmployeeData must be used within DataProvider')
  return context
}
