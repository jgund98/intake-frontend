type GlpConversionPayload = {
  email?: string
  conversionId: string | number
  extra?: Record<string, any>
}

type GlpLeadPayload = {
  email?: string
  leadStep: string            // make this required
  extra?: Record<string, any>
}

export const useGlpTracking = () => {
  const push = (data: Record<string, any>) => {
    if (process.server) return
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).dataLayer.push(data)
  }

  const trackLead = ({ email, leadStep, extra = {} }: GlpLeadPayload) => {
  const payload = {
    event: "glp_lead",
    userEmail: email || undefined, 
    lead_step: leadStep,
    ...extra,
  }
  console.log("DataLayer Push (lead):", payload)
  push(payload)
}

  const trackConversion = ({ email, conversionId, extra = {} }: GlpConversionPayload) => {
    const payload = {
      event: "glp_conversion",
      userEmail: email || undefined,        // GTM DLV: userEmail
      conversionId: String(conversionId),   // GTM DLV: conversionId
      ...extra,
    }
    console.log("DataLayer Push (conversion):", payload)
    push(payload)
  }

  return { trackLead, trackConversion }
}