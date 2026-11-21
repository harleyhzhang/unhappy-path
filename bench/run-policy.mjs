// Artifact eligibility is separate from whether the agent declared its turn complete.
export function captureStatus(result, allowDeadline=false) {
  if(result.ok)return 'completed'
  if(allowDeadline&&result.failed==='timeout')return 'deadline'
  return null
}
