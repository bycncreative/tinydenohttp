import { contentType } from "https://deno.land/std@0.155.0/media_types/mod.ts";
import {RequestProxy, TinyDenoHttpServer} from "./server.js";

///
/// usage:
///    deno run -A main.js --host=0.0.0.0 --port=8080  --ServerPath=. --dstProxy=http://xxxxxx --proxy-url-path-prefix=/api/
///

function getProxyUrlPathPrefix(){
	let pre = '--proxy-url-path-prefix=';
	return Deno.args.reduce( (r,i)=>{ 
		if(i.startsWith(pre)) 
			r.push(i.substring(pre.length));
		return r;
	},[])
}

function ARG(name){
	let pre = `--${name}=`;
	let v = Deno.args.find(a=>a.startsWith(pre));
	return v ? v.substring(pre.length): null;
}

const SERVER_PATH = ARG('ServerPath') ||'.';

const host = ARG("host"); //default 0.0.0.0
const port = 8080;
if(ARG("port"))
	port = parseInt(ARG("port"))


const proxy = new RequestProxy(ARG('dstProxy'));
const defaultProxyItHandler = (req)=>proxy.proxyIt(req);

const s = new TinyDenoHttpServer(host,port,SERVER_PATH);

//s.proxyHandlerMap['/objects/'] = defaultProxyItHandler;
let proxyPaths = getProxyUrlPathPrefix();
console.log(proxyPaths)
proxyPaths.forEach(p=>s.proxyHandlerMap[p]=defaultProxyItHandler);

s.handlers['/api/hello'] = async function(request){
	let hello = {
		message: 'Hello!'
	}
	return new Response(JSON.stringify(hello), {
		headers:{'Content-Type':'application/json'}
	})
}

await s.run();



