'use strict';

const request = require('request')
const twilio = require('twilio')

const slack_message = text => ({
  username: 'smsbot',
  icon_emoji: ':phone:',
  text
})

function reply (params) {
  console.log('reply invoked with:', params)
  const client = twilio(params.twilio.account, params.twilio.auth)
  return new Promise((resolve, reject) => {
    client.messages.list({to: params.twilio.number}, (err, data) => {
      if (err) return Promise.reject(err)

      const last = data.messages[0]
      const msg = params.text.slice(params.trigger_word.length + 1)
      client.messages.create({ to: last.from, from: last.to, body: msg }, (err, message) => {
        if (err) return Promise.reject(err)
        resolve(slack_message(`sms reply sent to ${last.from}`))
      })
    })
  })
}

function incoming (params) {
  console.log('incoming invoked with:', params)
  return new Promise(function (resolve, reject) {
    const body = params.Body.replace(/\@\w+/g, '<$&>')
    const from = params.numbers[params.From] || 'Unknown'
    request.post({
      method: 'post',
      body: slack_message(`Text message from ${from} (${params.From}): ${body}`),
      json: true,
      url: params.slack.webhook
    }, () => {
      const resp = new twilio.TwimlResponse()
      resp.message('Thanks for letting us know.')
      resolve({
        headers: {
          'Content-Type': 'text/xml'
        },
        code: 200,
        body: resp.toString()
      })
    })
  })
}

exports.reply = reply
exports.incoming = incoming
