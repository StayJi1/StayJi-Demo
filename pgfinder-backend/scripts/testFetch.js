const http = require('http')
const url = 'http://localhost:3000/client/getPropertyList?cityName=Bangalore&areaName=Electronic+City&page=1'
http.get(url, (res) => {
  let data = ''
  res.on('data', (chunk) => { data += chunk })
  res.on('end', () => { console.log(data) })
}).on('error', (e) => { console.error('Request error', e.message) })
