import soapRequest from 'easy-soap-request'
import { XMLBuilder } from 'fast-xml-parser'
import db from 'debug'
const debug = db('webapp:call-recording-service')

export const pauseRecording = async agentEmail => {
  debug('Sending pause recording request to Storm for agentEmail: %s', agentEmail)
  sendRequestToTelesales('pause', agentEmail)
}

export const resumeRecording = async agentEmail => {
  debug('Sending resume recording request to Storm for agentEmail: %s', agentEmail)
  sendRequestToTelesales('resume', agentEmail)
}

const sendRequestToTelesales = async (action, agentEmail) => {
  const url = process.env.TELESALES_ENDPOINT
  const headers = { 'Content-Type': 'text/xml;charset=UTF-8' }
  const xml = await buildXml(action, agentEmail)
  await soapRequest({ url, headers, xml })
}

const buildXml = async (action, agentEmail) => {
  const authUsername = process.env.TELESALES_AUTH_USERNAME
  const authPassword = process.env.TELESALES_AUTH_PASSWORD

  const builder = new XMLBuilder({
    attributesGroupName: '@',
    format: true,
    ignoreAttributes: false,
    suppressBooleanAttributes: false
  })
  const xml = builder.build({
    'soap:Envelope': {
      '@': {
        'xmlns:soap': 'http://www.w3.org/2003/05/soap-envelope',
        'xmlns:cal': 'http://redcentrex.redwoodtech.com/calls'
      },
      'soap:Header': {
        'wsse:Security': {
          '@': {
            'soap:mustUnderstand': 'true',
            'xmlns:wsse': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
            'xmlns:wsu': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd'
          },
          'wsse:UsernameToken': {
            '@': {
              'wsu:Id': 'UsernameToken-1'
            },
            'wsse:Username': authUsername,
            'wsse:Password': {
              '@': {
                Type: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText'
              },
              '#text': authPassword
            }
          }
        }
      },
      'soap:Body': {
        'cal:RecordingRequest': {
          'cal:UserID': agentEmail,
          'cal:Record': action,
          'cal:Muted': '0'
        }
      }
    }
  })
  return xml
}
