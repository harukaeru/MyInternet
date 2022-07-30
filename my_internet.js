// ------------------- ネットワークの構築 ---------------------
const icann = {
  dns: {},
  register: (domain, ipaddress) => {
    icann.dns[domain] = ipaddress
  }
}

const isp = {
  routingTable: {},
  reverseRoutingTable: {},
  ipcounter: 1,
  issueIpaddress: (computer) => {
    if (isp.ipcounter > 255) {
      console.error("We can't")
      return
    }

    const ipAddress = `0.0.0.${isp.ipcounter}`
    isp.routingTable[ipAddress] = computer
    isp.reverseRoutingTable[computer] = ipAddress
    isp.ipcounter++;
    return ipAddress
  }
}

const httpGet = (website) => {
  const urlAndQuery = website.split('?')
  const url = urlAndQuery[0]
  const query = urlAndQuery.length > 1 ? urlAndQuery[1] : ''

  const urlArray = url.replace('https://', '').replace('http://', '').split('/')
  const domain = urlArray[0]
  const path = '/' + (urlArray[1] ? urlArray[1] : '')
  const ipAddress = icann.dns[domain]
  const computer = isp.routingTable[ipAddress]
  if (!computer) {
    return null
  }
  const doc = computer().webServer[path]
  if (query) {
    const queryParams = query.split('=')
    return doc(queryParams[0], queryParams[1])
  }
  return doc
}


// ------------------- コンピュータとWebサーバーの作成 ---------------------
const computer1 = () => {
  return {
    webServer: {
      '/': '<html><title>マツリカ top</title><div><a href="/about">マツリカについて</a></div><div><a href="https://youtube.com">動画サービスです</a></div></html>',
      '/about': '<html>すごいです</html>'
    }
  }
}
icann.register('mazrica.com', isp.issueIpaddress(computer1))

const computer2 = () => {
  return {
    webServer: {
      '/': '<html><title>かえるページ</title><div><a href="https://mazrica.com/">マツリカへ</a></div><div><a href="/movies">ぼくのつくった動画</a></div></html>',
      '/movies': '<html>ネコをたたえよ<video><source></source></video></html>'
    }
  }
}
icann.register('harukaeru.com', isp.issueIpaddress(computer2))

const computer3 = () => {
  return {
    webServer: {
      '/': '<html>すごい動画サービスです</html>',
    }
  }
}
icann.register('youtube.com', isp.issueIpaddress(computer3))

const computer4 = () => {
  // -------------------- 検索エンジンをつくる ----------------------
  // クローラー。インターネットを探索して検索Indexを作成する
  const searchIndex = {}
  const searchedWebsiteUrls = new Set()
  const pageRank = {}
  const websiteTitles = {}
  const crawlingQueue = []
  const crawl = () => {
    while (crawlingQueue.length > 0) {
      const website = crawlingQueue.shift()
      if (searchedWebsiteUrls.has(website)) {
        pageRank[website]++;
        return
      }

      pageRank[website] = 1;

      const documentText = httpGet(website)
      const parser = new DOMParser()
      const htmlDoc = parser.parseFromString(documentText, 'text/html')

      const urlArray = website.replace('https://', '').replace('http://', '').split('/')
      const domain = urlArray[0]

      htmlDoc.querySelectorAll('a').forEach(aElement => {
        const newWebsiteUrl = (!(aElement.getAttribute('href').startsWith('/'))) ? aElement.href : 'https://' + domain + aElement.pathname
        crawlingQueue.push(newWebsiteUrl)
      })
      const title = htmlDoc.querySelector('title')

      const plainText = documentText.replace(/(<([^>]+)>)/g, "");

      websiteTitles[website] = title ? title.innerText : website
      if (searchIndex[plainText]) {
        searchIndex[plainText].add(website)
      } else {
        searchIndex[plainText] = new Set([website])
      }
    }
  }

  crawlingQueue.push('https://harukaeru.com')
  crawl()

  // 検索エンジン
  const search = (__, query) => {
    const websites = []
    Object.keys(searchIndex).filter(key => key.includes(query)).map(key => {
      const searchedWebsites = searchIndex[key]
      const array = Array.from(searchedWebsites)
      websites.push(...array)
    })
    websites.sort((a, b) => {
      return pageRank[a] > pageRank[b]
    })
    const result = websites.map(website => {
      return `<div>
        <a href="${website}">${websiteTitles[website]}</a>
       </div>
      `
    }).join('\n')

    return `<html>
      <title>グーグー</title>
      <input type="text" id="query"></input><button id="search" onclick="myWindow.href = 'https://google.com/search?q=' + document.getElementById('query').value">検索</button>
      <div>結果:</div>
      ${result}
      </script>
     </html>`
  }

  return {
    webServer: {
      '/': `<html>
        <title>グーグー</title>
        <input type="text" id="query"></input><button id="search" onclick="myWindow.href = 'https://google.com/search?q=' + document.getElementById('query').value">検索</button>
      </html>`,
      '/search': search
    }
  }
}
icann.register('google.com', isp.issueIpaddress(computer4))
