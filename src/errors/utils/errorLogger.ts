import { HttpStatus } from '@nestjs/common'

export interface HttpStatusInfo {
  icon: string
  status: HttpStatus
  color: string
  name: string
}

export const typeIcons = { HTTP: '🌐', WS: '⚡' }

const colors = {
  dim: '\x1b[2m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
}

export const httpStatusInfo: Partial<Record<HttpStatus, HttpStatusInfo>> = {
  [HttpStatus.CONTINUE]: {
    icon: '⏩',
    status: HttpStatus.CONTINUE,
    color: colors.blue,
    name: 'CONTINUE'
  },
  [HttpStatus.SWITCHING_PROTOCOLS]: {
    icon: '🔄',
    status: HttpStatus.SWITCHING_PROTOCOLS,
    color: colors.blue,
    name: 'SWITCHING_PROTOCOLS'
  },
  [HttpStatus.PROCESSING]: {
    icon: '⚙️',
    status: HttpStatus.PROCESSING,
    color: colors.blue,
    name: 'PROCESSING'
  },
  [HttpStatus.OK]: {
    icon: '✅',
    status: HttpStatus.OK,
    color: colors.green,
    name: 'OK'
  },
  [HttpStatus.CREATED]: {
    icon: '🆕',
    status: HttpStatus.CREATED,
    color: colors.green,
    name: 'CREATED'
  },
  [HttpStatus.ACCEPTED]: {
    icon: '👍',
    status: HttpStatus.ACCEPTED,
    color: colors.green,
    name: 'ACCEPTED'
  },
  [HttpStatus.NON_AUTHORITATIVE_INFORMATION]: {
    icon: 'ℹ️',
    status: HttpStatus.NON_AUTHORITATIVE_INFORMATION,
    color: colors.green,
    name: 'NON_AUTHORITATIVE_INFORMATION'
  },
  [HttpStatus.NO_CONTENT]: {
    icon: '🔄',
    status: HttpStatus.NO_CONTENT,
    color: colors.green,
    name: 'NO_CONTENT'
  },
  [HttpStatus.RESET_CONTENT]: {
    icon: '🔃',
    status: HttpStatus.RESET_CONTENT,
    color: colors.green,
    name: 'RESET_CONTENT'
  },
  [HttpStatus.PARTIAL_CONTENT]: {
    icon: '📦',
    status: HttpStatus.PARTIAL_CONTENT,
    color: colors.green,
    name: 'PARTIAL_CONTENT'
  },
  [HttpStatus.AMBIGUOUS]: {
    icon: '�',
    status: HttpStatus.AMBIGUOUS,
    color: colors.cyan,
    name: 'AMBIGUOUS'
  },
  [HttpStatus.MOVED_PERMANENTLY]: {
    icon: '➡️',
    status: HttpStatus.MOVED_PERMANENTLY,
    color: colors.cyan,
    name: 'MOVED_PERMANENTLY'
  },
  [HttpStatus.FOUND]: {
    icon: '🔍',
    status: HttpStatus.FOUND,
    color: colors.cyan,
    name: 'FOUND'
  },
  [HttpStatus.SEE_OTHER]: {
    icon: '👀',
    status: HttpStatus.SEE_OTHER,
    color: colors.cyan,
    name: 'SEE_OTHER'
  },
  [HttpStatus.NOT_MODIFIED]: {
    icon: '📌',
    status: HttpStatus.NOT_MODIFIED,
    color: colors.cyan,
    name: 'NOT_MODIFIED'
  },
  [HttpStatus.TEMPORARY_REDIRECT]: {
    icon: '↪️',
    status: HttpStatus.TEMPORARY_REDIRECT,
    color: colors.cyan,
    name: 'TEMPORARY_REDIRECT'
  },
  [HttpStatus.PERMANENT_REDIRECT]: {
    icon: '⤴️',
    status: HttpStatus.PERMANENT_REDIRECT,
    color: colors.cyan,
    name: 'PERMANENT_REDIRECT'
  },
  [HttpStatus.BAD_REQUEST]: {
    icon: '⚠️',
    status: HttpStatus.BAD_REQUEST,
    color: colors.yellow,
    name: 'BAD_REQUEST'
  },
  [HttpStatus.UNAUTHORIZED]: {
    icon: '🔒',
    status: HttpStatus.UNAUTHORIZED,
    color: colors.yellow,
    name: 'UNAUTHORIZED'
  },
  [HttpStatus.PAYMENT_REQUIRED]: {
    icon: '💳',
    status: HttpStatus.PAYMENT_REQUIRED,
    color: colors.yellow,
    name: 'PAYMENT_REQUIRED'
  },
  [HttpStatus.FORBIDDEN]: {
    icon: '🚫',
    status: HttpStatus.FORBIDDEN,
    color: colors.yellow,
    name: 'FORBIDDEN'
  },
  [HttpStatus.NOT_FOUND]: {
    icon: '❓',
    status: HttpStatus.NOT_FOUND,
    color: colors.yellow,
    name: 'NOT_FOUND'
  },
  [HttpStatus.METHOD_NOT_ALLOWED]: {
    icon: '🛑',
    status: HttpStatus.METHOD_NOT_ALLOWED,
    color: colors.yellow,
    name: 'METHOD_NOT_ALLOWED'
  },
  [HttpStatus.NOT_ACCEPTABLE]: {
    icon: '❌',
    status: HttpStatus.NOT_ACCEPTABLE,
    color: colors.yellow,
    name: 'NOT_ACCEPTABLE'
  },
  [HttpStatus.PROXY_AUTHENTICATION_REQUIRED]: {
    icon: '🔐',
    status: HttpStatus.PROXY_AUTHENTICATION_REQUIRED,
    color: colors.yellow,
    name: 'PROXY_AUTHENTICATION_REQUIRED'
  },
  [HttpStatus.REQUEST_TIMEOUT]: {
    icon: '⏱️',
    status: HttpStatus.REQUEST_TIMEOUT,
    color: colors.yellow,
    name: 'REQUEST_TIMEOUT'
  },
  [HttpStatus.CONFLICT]: {
    icon: '⚡',
    status: HttpStatus.CONFLICT,
    color: colors.yellow,
    name: 'CONFLICT'
  },
  [HttpStatus.GONE]: {
    icon: '🗑️',
    status: HttpStatus.GONE,
    color: colors.yellow,
    name: 'GONE'
  },
  [HttpStatus.LENGTH_REQUIRED]: {
    icon: '📏',
    status: HttpStatus.LENGTH_REQUIRED,
    color: colors.yellow,
    name: 'LENGTH_REQUIRED'
  },
  [HttpStatus.PRECONDITION_FAILED]: {
    icon: '🚧',
    status: HttpStatus.PRECONDITION_FAILED,
    color: colors.yellow,
    name: 'PRECONDITION_FAILED'
  },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    icon: '📦',
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    color: colors.yellow,
    name: 'PAYLOAD_TOO_LARGE'
  },
  [HttpStatus.URI_TOO_LONG]: {
    icon: '🔗',
    status: HttpStatus.URI_TOO_LONG,
    color: colors.yellow,
    name: 'URI_TOO_LONG'
  },
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: {
    icon: '🎬',
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    color: colors.yellow,
    name: 'UNSUPPORTED_MEDIA_TYPE'
  },
  [HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]: {
    icon: '📊',
    status: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
    color: colors.yellow,
    name: 'REQUESTED_RANGE_NOT_SATISFIABLE'
  },
  [HttpStatus.EXPECTATION_FAILED]: {
    icon: '💭',
    status: HttpStatus.EXPECTATION_FAILED,
    color: colors.yellow,
    name: 'EXPECTATION_FAILED'
  },
  [HttpStatus.I_AM_A_TEAPOT]: {
    icon: '🫖',
    status: HttpStatus.I_AM_A_TEAPOT,
    color: colors.yellow,
    name: 'I_AM_A_TEAPOT'
  },
  [HttpStatus.MISDIRECTED]: {
    icon: '🧭',
    status: HttpStatus.MISDIRECTED,
    color: colors.yellow,
    name: 'MISDIRECTED'
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    icon: '📝',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    color: colors.yellow,
    name: 'UNPROCESSABLE_ENTITY'
  },
  [HttpStatus.FAILED_DEPENDENCY]: {
    icon: '🔗',
    status: HttpStatus.FAILED_DEPENDENCY,
    color: colors.yellow,
    name: 'FAILED_DEPENDENCY'
  },
  [HttpStatus.PRECONDITION_REQUIRED]: {
    icon: '📋',
    status: HttpStatus.PRECONDITION_REQUIRED,
    color: colors.yellow,
    name: 'PRECONDITION_REQUIRED'
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    icon: '⏱️',
    status: HttpStatus.TOO_MANY_REQUESTS,
    color: colors.yellow,
    name: 'TOO_MANY_REQUESTS'
  },
  [HttpStatus.INTERNAL_SERVER_ERROR]: {
    icon: '💥',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    color: colors.red,
    name: 'INTERNAL_SERVER_ERROR'
  },
  [HttpStatus.NOT_IMPLEMENTED]: {
    icon: '🚧',
    status: HttpStatus.NOT_IMPLEMENTED,
    color: colors.red,
    name: 'NOT_IMPLEMENTED'
  },
  [HttpStatus.BAD_GATEWAY]: {
    icon: '🔌',
    status: HttpStatus.BAD_GATEWAY,
    color: colors.red,
    name: 'BAD_GATEWAY'
  },
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    icon: '🔧',
    status: HttpStatus.SERVICE_UNAVAILABLE,
    color: colors.red,
    name: 'SERVICE_UNAVAILABLE'
  },
  [HttpStatus.GATEWAY_TIMEOUT]: {
    icon: '⏰',
    status: HttpStatus.GATEWAY_TIMEOUT,
    color: colors.red,
    name: 'GATEWAY_TIMEOUT'
  },
  [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: {
    icon: '🔢',
    status: HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
    color: colors.red,
    name: 'HTTP_VERSION_NOT_SUPPORTED'
  }
}

export function getHttpStatusInfo(status: HttpStatus): HttpStatusInfo {
  return (
    httpStatusInfo[status] || {
      icon: '�',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      color: colors.red,
      name: 'INTERNAL_SERVER_ERROR'
    }
  )
}

export function logStyledError(params: {
  status: HttpStatus
  message: string
  type: 'HTTP' | 'WS'
}) {
  const { status, message, type } = params

  const errorConfig = getHttpStatusInfo(status)
  const typeIcon = typeIcons[type]

  console.log(
    `${errorConfig.icon} ${typeIcon} ${errorConfig.color}${message}\x1b[0m \x1b[2m[${errorConfig.name}]\x1b[0m`
  )
}
