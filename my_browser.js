const go = document.getElementById("go")
const targetUrl = document.getElementById("value_url")

const displayDocument = () => {
  const d = document.getElementById("document")
  const website = targetUrl.value
  const documentText = httpGet(website)
  if (!documentText) {
    d.innerText = '404'
    return
  }

  const parser = new DOMParser()
  const htmlDoc = parser.parseFromString(documentText, 'text/html')

  const urlArray = website.replace('https://', '').replace('http://', '').split('/')
  const domain = urlArray[0]

  htmlDoc.querySelectorAll('a').forEach(aElement => {
    const newWebsiteUrl = (!(aElement.getAttribute('href').startsWith('/'))) ? aElement.href : 'https://' + domain + aElement.pathname
    aElement.href = "javascript:void(0)"
    aElement.addEventListener('click', () => {
      targetUrl.value = newWebsiteUrl
      displayDocument()
    })
  })
  window.a = htmlDoc

  d.innerHTML = ''
  d.appendChild(htmlDoc.childNodes[0])
}

targetUrl.addEventListener('keypress', (event) => {
  if (event.key === "Enter") {
    displayDocument()
  }
})
go.addEventListener('click', () => {
  displayDocument()
})

const _myWindow = {}
const myWindow = new Proxy(_myWindow, {
  set: (target, key, value)  => {
    if (key = "href") {
      targetUrl.value = value
      displayDocument()
    }
  }
});

targetUrl.value = 'https://google.com'
displayDocument()
