const GRAB_BASE_URL = process.env.GRAB_API_BASE_URL!

interface GrabTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface GrabDeliveryRequest {
  merchantOrderID: string
  serviceType: 'INSTANT' | 'SAME_DAY'
  sender: {
    name: string
    phone: string
    address: { address: string; coordinates: { lat: number; lng: number } }
  }
  recipient: {
    name: string
    phone: string
    address: { address: string; coordinates: { lat: number; lng: number } }
  }
  packages: Array<{ name: string; quantity: number; dimensions: { height: number; width: number; depth: number; weight: number } }>
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${GRAB_BASE_URL}/grabid/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GRAB_CLIENT_ID!,
      client_secret: process.env.GRAB_CLIENT_SECRET!,
      grant_type: 'client_credentials',
      scope: 'grab_express.partner_deliveries',
    }),
  })
  const data: GrabTokenResponse = await res.json()
  return data.access_token
}

export async function createGrabDelivery(request: GrabDeliveryRequest) {
  const token = await getAccessToken()
  const res = await fetch(`${GRAB_BASE_URL}/grab-express/v1/deliveries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Grab API error: ${error.message ?? res.statusText}`)
  }
  return res.json()
}

export async function getGrabDeliveryStatus(deliveryID: string) {
  const token = await getAccessToken()
  const res = await fetch(`${GRAB_BASE_URL}/grab-express/v1/deliveries/${deliveryID}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}
