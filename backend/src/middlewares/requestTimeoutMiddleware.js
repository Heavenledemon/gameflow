export function requestTimeoutMiddleware(timeoutMs) {
  return (request, response, next) => {
    let finished = false
    const complete = () => { finished = true }
    response.once('finish', complete)
    response.once('close', complete)
    request.once('aborted', () => { request.abortedByClient = true })

    response.setTimeout(timeoutMs, () => {
      if (finished || response.headersSent) return
      request.timedOut = true
      response.status(408).json({ message: 'Request timed out.' })
    })
    next()
  }
}

