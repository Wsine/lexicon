async function handleRequest(request) {
  const psk = request.headers.get('X-Custom-PSK');
  if (psk != AUTH_HEADER_VALUE) {
    return new Response('Sorry, you have supplied an invalid key.', {
      status: 403,
    });
  }

  const url = new URL(request.url);
  if (url.pathname.startsWith('/add')) {
    const word = url.pathname.replace('/add', '').replace('/', '');
    if (word === '') {
      return new Response('Please call with /add/<word>', {
        status: 403,
      });
    }

    return addToLexicon(url);
  } else if (url.pathname.startsWith('/update')) {
    return updateLexicon(request);
  }

  return new Response('This API is still working');
}

async function addToLexicon(url) {
  const { Client } = require('@notionhq/client');
  const notion = new Client({ auth: NOTION_API_KEY });

  const response = await notion.pages.create({
    parent: {
      database_id: NOTION_DATABASE_ID
    },
    properties: {
      Query: {
        title: [{
          text: {
            content: word
          }
        }]
      }
    }
  });
  console.log(response);

  return new Response('Added successfully');
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function updateLexicon(request) {
  const { Client } = require('@notionhq/client');
  const notion = new Client({ auth: NOTION_API_KEY });

  const pages = [];
  let cursor = undefined;
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
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
    pages.push(...results);
    if (!next_cursor) break;
    cursor = next_cursor;
  }
  console.log(`Found ${pages.length} words to be updated.`)

  const words = pages.map(page => {
    return {
      pageId: page.id,
      word: page.properties['Query'].title[0].plain_text
    }
  })
  console.log(words);

  const wordsToUpdateChucks = _.chunk(words, 10)
  for (const wordsToUpdateBatch of wordsToUpdateChucks) {
    await Promise.all(
      wordsToUpdateBatch.map(({ pageId, word }) => {
        // TODO: call youdao api
      })
    )
  }

  // const response = await notion.pages.create({
  //   parent: {
  //     database_id: NOTION_DATABASE_ID
  //   },
  //   properties: {
  //     Query: {
  //       title: [{
  //         text: {
  //           content: 'Hello'
  //         }
  //       }]
  //     },
  //     // Translation: {
  //     //   rich_text: [{
  //     //     text: {
  //     //       content: 'hello'
  //     //     }
  //     //   }]
  //     // },
  //     // Explains: {
  //     //   rich_text: [{
  //     //     text: {
  //     //       content: 'hello'
  //     //     }
  //     //   }]
  //     // },
  //     // 'US-Phonetic': {
  //     //   rich_text: [{
  //     //     text: {
  //     //       content: 'hello'
  //     //     }
  //     //   }]
  //     // },
  //     // 'UK-Phonetic': {
  //     //   rich_text: [{
  //     //     text: {
  //     //       content: 'hello'
  //     //     }
  //     //   }]
  //     // },
  //     // isWord: {
  //     //   checkbox: true
  //     // },
  //   }
  // });
  // console.log(response);

  return new Response('Updated successfully');
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
