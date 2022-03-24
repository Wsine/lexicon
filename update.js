const { Client } = require('@notionhq/client')
const axios = require('axios')
const FormData = require('form-data')
require('dotenv').config()

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

(async() => {
  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  const pages = []
  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      start_cursor: cursor,
      page_size: 10,
      filter: {
        and: [{
          property: 'Checked',
          checkbox: {
            equals: false
          }
        }]
      }
    })
    pages.push(...results)
    if (!next_cursor) break
    cursor = next_cursor
  }
  console.log(`Found ${pages.length} words to be updated.`)

  const words = pages.map(page => {
    return {
      pageId: page.id,
      word: page.properties['Query'].title[0].plain_text
    }
  })
  const word2page = {}
  for (const page of pages) {
    const word = page.properties['Query'].title[0].plain_text
    word2page[word] = page.id
  }

  let CryptoJS = require("crypto-js")
  const _ = require("lodash")
  const wordsToUpdateChucks = _.chunk(words, 10)
  for (const wordsToUpdateBatch of wordsToUpdateChucks) {
    await Promise.all(
      wordsToUpdateBatch.map(({ pageId, word }) => {
        const salt = uuidv4()
        const curtime = (Math.round(new Date().getTime() / 1000)).toString()
        let input = word
        if (word.length > 20) {
          input = word.slice(0, 10) + word.length + word.slice(word.length - 10, word.length)
        }
        const concat = process.env.YOUDAO_APP_KEY + input + salt + curtime + process.env.YOUDAO_APP_SECRET
        const sign = CryptoJS.SHA256(concat).toString(CryptoJS.enc.Hex)
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
        return axios({
          method: 'post',
          url: 'https://openapi.youdao.com/api',
          headers: {
            ...form.getHeaders()
          },
          data: form
        }).then(r => r.data)
          .then(data => {
            const pageId = word2page[data['query']]
            let properties = {
              Translation: {
                rich_text: [{
                  text: {
                    content: data['translation'].join('\n')
                  }
                }]
              },
              Checked: {
                checkbox: true
              }
            }
            if (data['isWord']) {
              let prop = {
                Explains: {
                  rich_text: [{
                    text: {
                      content: data['basic']['explains'].join('\n')
                    }
                  }]
                },
                'US-Phonetic': {
                  rich_text: [{
                    text: {
                      content: data['basic']['us-phonetic']
                    }
                  }]
                },
                'UK-Phonetic': {
                  rich_text: [{
                    text: {
                      content: data['basic']['uk-phonetic']
                    }
                  }]
                }
              }
              properties = {...properties, ...prop}
            }
            return notion.pages.update({
              page_id: pageId,
              properties: properties
            });
          })
          .catch((error) => {
            console.log(error)
          })
      })
    )
  }
  console.log('Done')
})()
