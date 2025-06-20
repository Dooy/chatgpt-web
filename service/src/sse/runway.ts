import { Request, Response, NextFunction } from "express";
import proxy from "express-http-proxy";
import { http2mq } from "./suno";
import { createProxyMiddleware } from "http-proxy-middleware";

const endResDecorator = (
	proxyRes: any,
	proxyResData: any,
	req: any,
	userRes: any
) => {
	// slog('log','responseData'   );
	const dd = {
		from: "runway",
		etime: Date.now(),
		url: req.originalUrl,
		header: req.headers,
		body: req.body,
		data: proxyResData.toString("utf8"),
	};

	http2mq("runway", dd);
	return proxyResData; //.toString('utf8')
};

//runwayAPI代理
export const runwayProxy = proxy(
	process.env.RUNWAY_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// url=(process.env.SUNO_SERVER_DIR??'')+url;
			// return url;
			//console.log('viggleProxy ', req.originalUrl )
			return req.originalUrl.replace("/pro", "");
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			//mlog("log ",srcReq.originalUrl  )
			if (process.env.RUNWAY_KEY)
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.RUNWAY_KEY;
			//else proxyReqOpts.headers['Authorization'] ='Bearer hi' ;
			//proxyReqOpts.headers['Content-Type'] = 'application/json';
			return proxyReqOpts;
		},
		userResDecorator: endResDecorator,
	}
);

export const runwaymlProxy = proxy(
	process.env.RUNWAYML_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl.replace("/pro", "");
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.RUNWAYML_KEY)
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.RUNWAYML_KEY;
			return proxyReqOpts;
		},
		userResDecorator: (
			proxyRes: any,
			proxyResData: any,
			req: any,
			userRes: any
		) => {
			// slog('log','responseData'   );
			const dd = {
				from: "runwayml",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
			};
			http2mq("runwayml", dd);
			return proxyResData; //.toString('utf8')
		},
	}
);

export const higgsfieldProxy = proxy(
	process.env.HIGGS_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl.replace("/pro", "");
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.HIGGS_KEY) {
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.HIGGS_KEY;
			}
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (
			proxyRes: any,
			proxyResData: any,
			req: any,
			userRes: any
		) => {
			// slog('log','responseData'   );
			const dd = {
				from: "higgs",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
				statusCode: proxyRes.statusCode,
			};
			http2mq("higgs", dd);
			return proxyResData; //.toString('utf8')
		},
	}
);

//dooy bflProxy
export const bflProxy = proxy(
	process.env.BFL_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl; //.replace("/pro", "");
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.BFL_KEY) {
				proxyReqOpts.headers["Authorization"] = "Bearer " + process.env.BFL_KEY;
			}
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (
			proxyRes: any,
			proxyResData: any,
			req: any,
			userRes: any
		) => {
			// slog('log','responseData'   );
			const dd = {
				from: "bfl",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
				statusCode: proxyRes.statusCode,
			};
			http2mq("bfl", dd);
			return proxyResData; //.toString('utf8')
		},
	}
);

//dooy bflProxy
export const FalProxy = proxy(
	process.env.FAL_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl; //.replace("/pro", "");
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.FAL_KEY) {
				proxyReqOpts.headers["Authorization"] = "Bearer " + process.env.FAL_KEY;
			}
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (
			proxyRes: any,
			proxyResData: any,
			req: any,
			userRes: any
		) => {
			// slog('log','responseData'   );
			const dd = {
				from: "fal",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
				statusCode: proxyRes.statusCode,
			};
			http2mq("fal", dd);
			return proxyResData; //.toString('utf8')
		},
	}
);

//dooy riff
export const riffusionProxy = proxy(
	process.env.RIFF_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl.replace("/pro", "");
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.RIFF_KEY) {
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.RIFF_KEY;
			}
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (
			proxyRes: any,
			proxyResData: any,
			req: any,
			userRes: any
		) => {
			// slog('log','responseData'   );
			const dd = {
				from: "riff",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
				statusCode: proxyRes.statusCode,
			};
			http2mq("riff", dd);
			return proxyResData; //.toString('utf8')
		},
	}
);

//export const realtimeProxy=proxy( 'wss://api.openai.com',{
//export const realtimeProxy=proxy( 'https://gptproxy-2.aigpai.com',{
export const realtimeProxy = proxy("https://test-api.bltcy.ai/v1/realtime", {
	proxyReqPathResolver: (req) => {
		console.log("realtimeProxy ", req.originalUrl);
		// 解析请求路径
		return req.originalUrl;
	},
	proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
		proxyReqOpts.headers["connection"] = "upgrade";
		// proxyReqOpts.headers['Authorization']='Bearer sk-xxxxxxxxx'
		// proxyReqOpts.headers['OpenAI-Beta']='realtime=v1'
		//"OpenAI-Beta": "realtime=v1"

		//sec-websocket-extensions
		//sec-websocket-key
		//sec-websocket-protocol
		// delete proxyReqOpts.headers['sec-websocket-extensions']
		// delete proxyReqOpts.headers['sec-websocket-key']
		// delete proxyReqOpts.headers['sec-websocket-protocol']
		// delete proxyReqOpts.headers['sec-websocket-version']

		console.log("realtimeProxy ", proxyReqOpts.headers);
		//console.log('realtimeProxy ', proxyReqOpts.headers['connection'] )
		return proxyReqOpts;
	},
	// WebSocket 代理支持
	ws: true,
	proxyReqWs: true,
	//wss:true
});

// export const realtimeProxy3= createProxyMiddleware({
//   target: 'wws://gptproxy-2.aigpai.com',
//   //target: 'wws://api.openai.com',
//   changeOrigin: true,

//   ws: true,
//   onProxyReqWs: (proxyReq, req, socket, options, head) => {
// 	console.log("goodnew", proxyReq.getHeaderNames() )
//     console.log('WebSocket request:', req.url);
//   },
//   onOpen: (proxySocket) => {
//     console.log('WebSocket connection opened');
//   },
//   onClose: (res, socket, head) => {
//     console.log('WebSocket connection closed');
//   }
// })
