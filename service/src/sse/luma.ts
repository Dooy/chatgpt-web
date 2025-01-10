import { Request, Response, NextFunction } from "express";
import proxy from "express-http-proxy";
import { http2mq } from "./suno";

const endResDecorator = (
	proxyRes: any,
	proxyResData: any,
	req: any,
	userRes: any
) => {
	// slog('log','responseData'   );
	const dd = {
		from: "cnt",
		etime: Date.now(),
		url: req.originalUrl,
		header: req.headers,
		body: req.body,
		data: proxyResData.toString("utf8"),
	};

	http2mq("luma", dd);
	return proxyResData; //.toString('utf8')
};

const endResDecoratorPro = (
	proxyRes: any,
	proxyResData: any,
	req: any,
	userRes: any
) => {
	// slog('log','responseData'   );
	const dd = {
		from: "lumapro",
		etime: Date.now(),
		url: req.originalUrl,
		header: req.headers,
		body: req.body,
		data: proxyResData.toString("utf8"),
	};

	http2mq("lumapro", dd);
	return proxyResData; //.toString('utf8')
};

//lumaAPI代理
export const lumaProProxy = proxy(
	process.env.PRO_LUMA_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl.replace("/pro", ""); // 将URL中的 `/openapi` 替换为空字符串
			//let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			//url=(process.env.SUNO_SERVER_DIR??'')+url;
			//return url;
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.SUNO_KEY)
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.PRO_LUMA_KEY;
			else proxyReqOpts.headers["Authorization"] = "Bearer hi";
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: endResDecoratorPro,
	}
);

//lumaAPI代理
export const lumaProxy = proxy(
	process.env.LUMA_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// url=(process.env.SUNO_SERVER_DIR??'')+url;
			// return url;
			return req.originalUrl;
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.LUMA_KEY)
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.LUMA_KEY;
			else proxyReqOpts.headers["Authorization"] = "Bearer hi";
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: endResDecorator,
	}
);

export const lumaV2Proxy = proxy(
	process.env.LUMA_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			//return req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// let url= req.originalUrl.replace('/sunoapi', '') // 将URL中的 `/openapi` 替换为空字符串
			// url=(process.env.SUNO_SERVER_DIR??'')+url;
			// return url;
			return req.originalUrl;
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.LUMA_KEY)
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.LUMA_KEY;
			else proxyReqOpts.headers["Authorization"] = "Bearer hi";
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
				from: "luma-v2",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
				statusCode: proxyRes.statusCode,
			};

			http2mq("luma-v2", dd);
			return proxyResData; //.toString('utf8')
		},
	}
);

//pika 逆向代理
export const pikaProxy = proxy(
	process.env.PIKA_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl;
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.PIKA_KEY)
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.PIKA_KEY;
			else proxyReqOpts.headers["Authorization"] = "Bearer hi";
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (
			proxyRes: any,
			proxyResData: any,
			req: any,
			userRes: any
		) => {
			const dd = {
				from: "pika",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
				statusCode: proxyRes.statusCode,
			};
			http2mq("pika", dd);
			return proxyResData;
		},
	}
);

// pixverse 逆向代理

export const pixverseProxy = proxy(
	process.env.PIXVERSE_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl;
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.PIXVERSE_KEY)
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.PIXVERSE_KEY;
			else proxyReqOpts.headers["Authorization"] = "Bearer hi";
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (
			proxyRes: any,
			proxyResData: any,
			req: any,
			userRes: any
		) => {
			const dd = {
				from: "pixverse",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
				statusCode: proxyRes.statusCode,
			};
			http2mq("pixverse", dd);
			return proxyResData;
		},
	}
);

// vmodel 逆向代理
export const vmodelProxy = proxy(
	process.env.VMODEL_SERVER ?? "https://suno-api.suno.ai",
	{
		https: false,
		limit: "10mb",
		proxyReqPathResolver: function (req) {
			return req.originalUrl;
		},
		proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
			if (process.env.VMODEL_KEY)
				proxyReqOpts.headers["Authorization"] =
					"Bearer " + process.env.VMODEL_KEY;
			else proxyReqOpts.headers["Authorization"] = "Bearer hi";
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (
			proxyRes: any,
			proxyResData: any,
			req: any,
			userRes: any
		) => {
			const dd = {
				from: "vmodel",
				etime: Date.now(),
				url: req.originalUrl,
				header: req.headers,
				body: req.body,
				data: proxyResData.toString("utf8"),
				statusCode: proxyRes.statusCode,
			};
			http2mq("vmodel", dd);
			return proxyResData;
		},
	}
);
