import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import { contentType } from "https://deno.land/std@0.155.0/media_types/mod.ts";
import { serveFile } from "https://deno.land/std@0.155.0/http/file_server.ts";
import * as logger from "https://deno.land/std@0.155.0/log/mod.ts";
import {Pattern, UrlWildcharMatcher} from "https://deno.land/x/urlmatcher@v1.0.4/UrlWildcharMatcher.js";


class RequestProxy{
	constructor(dstUrl){
		this.dstUrl=dstUrl;
	}

	async proxyFetch(req){
		let pathStart = req.url.indexOf('/', req.url.indexOf('//')+3);
		let rest = pathStart==-1 ? '/' :  req.url.substring(pathStart);
		let url = this.dstUrl + rest;
		let proxyInput = {
			method: req.method,
			body: req.body,
			headers:req.headers
		}
		return fetch(url, proxyInput);
	}

	async proxyIt(req){
		let res = await this.proxyFetch(req);
		var h = res.headers;
		return new Response(await res.body, {
			status:res.status, 
			statusText:res.statusText,
			headers:h
		});
	}	
}

class Context {
	constructor(serverPath){
		this.serverPath = serverPath||'.';
	}

	getWebPath(){
		return this.serverPath + "/web";
	}

	/**
	 *@param filename		filename relative to serverPath. eg. /config/a.json
	 *@returns file content buffer
	 */
	async readServerFile(filename){
		let f = await Deno.open( this.serverPath + filename,{read: true})
		let buf = await Deno.readAll(f)
		Deno.close(f.rid)
		return buf
	}
}

class TinyDenoHttpServer {
	constructor(host,port,serverPath){
		this.host = host;
		this.port = port;
		this.context = new Context(serverPath)
		this.handlers = {
			"/ok": async function(request) {return new Response("ok")},
		}	
		this.proxyHandlerMap =  {
			//path_prefix: handler
		}
	}
	
	async run(){	
		const urlMatcher = new UrlWildcharMatcher(
			Object.keys(this.handlers).map(k=>new Pattern(k, this.handlers[k])) 
		);		
		const requestHandler = async (request)=>{
			let url = new URL(request.url);
			let p = urlMatcher.find(url.pathname);
			logger.info(`REQ ${request.method} ${url.pathname} ${url.search} ` )
			//custom handler
			if(p)
				return await p.userData(request);
			//proxy it
			for(let k in this.proxyHandlerMap){
				if(url.pathname.startsWith(k))
					return await (this.proxyHandlerMap[k])(request);
			}
			//serve static file
			return serveFile(request, this.context.getWebPath()+ url.pathname);
		}
		
		await serve(requestHandler,{hostname: this.host, port:this.port});
	}

}

export {RequestProxy, TinyDenoHttpServer}
