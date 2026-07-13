import { useCallback, useState } from 'react'
import { uploadProjectFile } from '../lib/content'

export function useUpload(token, projectId) {
  const [queue, setQueue] = useState([])
  const [error, setError] = useState(null)
  const upload = useCallback(async (fileMeta, file) => {
    setError(null)
    setQueue((current) => [...current, { name: fileMeta.name, status: 'uploading' }])
    try { const result = await uploadProjectFile(token, projectId, fileMeta, file); setQueue((current) => current.map((item) => item.name === fileMeta.name ? { ...item, status: 'complete' } : item)); return result }
    catch (uploadError) { setError(uploadError); setQueue((current) => current.map((item) => item.name === fileMeta.name ? { ...item, status: 'error' } : item)); throw uploadError }
  }, [token, projectId])
  return { queue, error, upload, clear: () => setQueue([]) }
}

