import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.woff2':'font/woff2'}
const inside=(root,file)=>{const r=path.relative(root,file);return r!== '..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r)}
export async function serve(dist) {
  if(fs.lstatSync(dist).isSymbolicLink())throw new Error('dist must not be a symlink')
  const root=fs.realpathSync(dist)
  const server=http.createServer((req,res)=>{
    let p
    try{p=decodeURIComponent((req.url||'/').split('?')[0])}catch{res.writeHead(400).end('Bad request');return}
    let f=path.join(root,p)
    if(!inside(root,f)){res.writeHead(403).end('Forbidden');return}
    if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html')
    try{f=fs.realpathSync(f)}catch{res.writeHead(404).end('Not found');return}
    if(!inside(root,f)){res.writeHead(403).end('Forbidden');return}
    res.setHeader('Content-Type',MIME[path.extname(f)]||'application/octet-stream')
    const stream=fs.createReadStream(f);stream.on('error',()=>res.destroy());stream.pipe(res)
  })
  return await new Promise((resolve,reject)=>{server.on('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server))})
}
