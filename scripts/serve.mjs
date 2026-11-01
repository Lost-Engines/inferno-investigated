import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.ogg':'audio/ogg'};
export async function serve(){
 const port=Number(process.env.PORT||4175),prefix=(process.env.SITE_PREFIX||'').replace(/\/$/,'');
 const server=http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(prefix&&pathname!==prefix&&!pathname.startsWith(prefix+'/')){res.writeHead(404);res.end('Not found');return}
   let relative=pathname.slice(prefix.length),file=path.resolve(root,'.'+relative);
   if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
   if((await stat(file)).isDirectory()){
    if(!pathname.endsWith('/')){res.writeHead(302,{Location:pathname+'/'});res.end();return}
    file=path.join(file,'index.html');
   }
   const bytes=await readFile(file),headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
   const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
   if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),bytes.length-1):bytes.length-1;if(start>end||start>=bytes.length){res.writeHead(416,{'Content-Range':`bytes */${bytes.length}`});res.end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));}else{res.writeHead(200,{...headers,'Content-Length':bytes.length});res.end(bytes);}
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found')}
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));console.log(`Preview: http://127.0.0.1:${port}${prefix}/`);return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await serve();
