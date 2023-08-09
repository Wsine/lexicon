export const runtime = 'edge'

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

async function queryYoudao(word) {
  const salt = uuidv4()
  const curtime = (Math.round(new Date().getTime() / 1000)).toString()
  let input = word
  if (word.length > 20) {
    input = word.slice(0, 10) + word.length + word.slice(word.length - 10, word.length)
  }
  const concat = process.env.YOUDAO_APP_KEY + input + salt + curtime + process.env.YOUDAO_APP_SECRET
  const encode = new TextEncoder().encode(concat)
  const digest = await crypto.subtle.digest({name: 'SHA-256'}, encode)
  const sign = buf2hex(new Uint8Array(digest).buffer)
  let form = new FormData()
  form.append('q', input)
  form.append('from', 'en')
  form.append('to', 'zh-CHS')
  form.append('appKey', process.env.YOUDAO_APP_KEY)
  form.append('salt', salt)
  form.append('sign', sign)
  form.append('signType', 'v3')
  form.append('curtime', curtime)
  form.append('strict', 'true')
  return fetch('https://openapi.youdao.com/api', {
    method: 'post',
    body: form,
  })
  .then(r => r.json())
  .then(r => {
      console.log(r)
      return r
  })
  .catch(err => console.warn(err))
}

const { Client } = require('@notionhq/client')

async function send2Notion(ydData, context) {
  let properties = {
    Query: {title: [{text: {content: ydData['query']}}]},
    Context: {rich_text: [{text: {content: context}}]},
  }
  if (ydData['isWord']) {
    let prop = {
      Explains: {rich_text: [{text: {content: ydData['basic']['explains'].join('\n')}}]},
      'US-Phonetic': {rich_text: [{text: {content: ydData['basic']['us-phonetic']}}]},
      'UK-Phonetic': {rich_text: [{text: {content: ydData['basic']['uk-phonetic']}}]}
    }
    properties = {...properties, ...prop}
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY })
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: properties
  })
  .then(r => {
      console.log(r)
      return r
  })
  .catch(err => console.warn(err))
}

export default async function handler(req, _res) {
  const psk = req.headers.get('X-Custom-PSK')
  if (psk !== process.env.AUTH_HEADER_VALUE) {
    const resp = JSON.stringify({ message: 'Sorry, you have supplied an invalid key.' })
    return new Response(resp, { status: 403 })
  }

  const { word, context } = await req.json()
  console.log(word, context)

  const ydData = await queryYoudao(word)
  const ntData = await send2Notion(ydData, context)

  const resp = JSON.stringify({ message: 'success', yd: ydData, nt: ntData })
  return new Response(resp, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

