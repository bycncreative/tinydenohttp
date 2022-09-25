# tiny deno http server

## features

- serve static file
- serve dynamic content by adding a request handler 
- forward request to proxy site

## usage

### (1) run as application
	 
	deno run -A main.js --host=0.0.0.0 --port=8080  --ServerPath=. --dstProxy=http://xxxxxx --proxy-url-path-prefix=/api/

- host: hostname, default 0.0.0.0
- port: default 8080
- ServerPath: server location
- dstProxy: destination proxy to forward request
- proxy-url-path-prefix: the url path prefix, which will be forward to proxy


### (2) use it as a lib


	import https://deno.land/x/tinydenohttp/server.js 

	const proxy = new RequestProxy('http://theTargetSite')
	const defaultProxyItHandler = (req)=>proxy.proxyIt(req);

	const s = new TinyDenoHttpServer(host,port,SERVER_PATH);
	s.proxyHandlerMap['/api/'] = defaultProxyItHandler;

	s.handlers['/api/hello'] = async function(request){
		let hello = {
			message: 'Hello!'
		}
		return new Response(JSON.stringify(hello), {
			headers:{'Content-Type':'application/json'}
		})
	}

	await s.run();

