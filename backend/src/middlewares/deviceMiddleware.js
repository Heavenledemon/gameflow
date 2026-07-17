const MOBILE_USER_AGENT = /android|avantgo|blackberry|bb10|iemobile|iphone|ipod|mobile|opera mini|webos|windows phone/i

/**
 * Classify a request only to choose a default frontend shell.
 * This must never be used for authentication or authorization.
 */
export function resolveDeviceClass(userAgent = '') {
  return MOBILE_USER_AGENT.test(String(userAgent)) ? 'mobile' : 'desktop'
}

export function deviceResolver(request, _response, next) {
  request.deviceClass = resolveDeviceClass(request.get('user-agent'))
  next()
}
