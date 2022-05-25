const { Client } = require('@notionhq/client')

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

export async function addToLexicon(word) {
  const salt = uuidv4()
  const curtime = (Math.round(new Date().getTime() / 1000)).toString()
  let input = word
  if (word.length > 20) {
    input = word.slice(0, 10) + word.length + word.slice(word.length - 10, word.length)
  }
  const concat = YOUDAO_APP_KEY + input + salt + curtime + YOUDAO_APP_SECRET
  const encode = new TextEncoder().encode(concat)
  const digest = await crypto.subtle.digest({name: 'SHA-256'}, encode)
  const sign = buf2hex(new Uint8Array(digest).buffer)
  let form = new FormData()
  form.append('q', input)
  form.append('from', 'en')
  form.append('to', 'zh-CHS')
  form.append('appKey', YOUDAO_APP_KEY)
  form.append('salt', salt)
  form.append('sign', sign)
  form.append('signType', 'v3')
  form.append('curtime', curtime)
  form.append('strict', 'true')
  const response = await fetch('https://openapi.youdao.com/api', {
    method: 'post',
    body: form,
  }).then(r => r.json())
    .then(data => {
      let properties = {
        Query: {title: [{text: {content: word}}]},
        Translation: {rich_text: [{text: {content: data['translation'].join('\n')}}]},
      }
      if (data['isWord']) {
        let prop = {
          Explains: {rich_text: [{text: {content: data['basic']['explains'].join('\n')}}]},
          'US-Phonetic': {rich_text: [{text: {content: data['basic']['us-phonetic']}}]},
          'UK-Phonetic': {rich_text: [{text: {content: data['basic']['uk-phonetic']}}]}
        }
        properties = {...properties, ...prop}
      }

      const notion = new Client({ auth: NOTION_API_KEY })
      return notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: properties
      })
    })
    .catch((error) => {
      console.error(error)
    })
  console.log(response)
}

