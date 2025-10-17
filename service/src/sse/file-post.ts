import { Request, Response, NextFunction } from "express";
import { generateRandomCode, mlog } from "./utils";
import FormData from "form-data";
import { isNotEmptyString } from "src/utils/is";
import { getMyKey } from "./sse";
import axios from "axios";
import { http2mq } from "./suno";

interface MeResponse {
	data: string;
	status: number;
}
//主要转发接口
export const GptImageEdit = async (
	request: Request,
	response: Response,
	next?: NextFunction
) => {
	try {
		doGptImageEdit(request, response, next);
	} catch (e) {
		mlog("error", "gpt.image.edit /v1/images/edits", e);
	}
};

export const GptVideoPost = async (
	request: Request,
	response: Response,
	next?: NextFunction
) => {
	try {
		doGptVideoPost(request, response, next);
	} catch (e) {
		mlog("error", "gpt.image.edit /v1/images/edits", e);
	}
};

export const GptWhisper = async (
	request: Request,
	response: Response,
	next?: NextFunction
) => {
	try {
		doGptWhisper(request, response, next);
	} catch (e) {
		mlog("error", "whisper /v1/audio/transcriptions", e);
	}
};

const doGptWhisper = async (
	req: Request,
	res: Response,
	next?: NextFunction
) => {
	const formData = new FormData();
	const clientId = generateRandomCode(16);
	const request = req;
	const response = res;
	request.on("close", () => {
		mlog(`${clientId} Connection closed`);
		//clients = clients.filter(client => client.id !== clientId);
	});
	const dd = {
		from: "gpt-audio",
		etime: Date.now(),
		url: req.originalUrl,
		header: req.headers,
		body: req.body,
		data: "", //JSON.stringify(responseBody.data),
		status: 0, // responseBody.status,
		rqid: clientId,
	};
	//audio AUDIO
	let url = isNotEmptyString(process.env.GPT_AUDIO_BASE_URL)
		? process.env.GPT_AUDIO_BASE_URL
		: "https://api.openai.com";

	let myKey = isNotEmptyString(process.env.GPT_AUDIO_KEY)
		? process.env.GPT_AUDIO_KEY
		: "my-key";
	const responseBody = await DoFilePost(
		req,
		url + "/v1/audio/transcriptions",
		myKey
	);
	res.status(responseBody.status).send(responseBody.data);
	dd.status = responseBody.status;
	dd.data = responseBody.data;
	http2mq("gpt-audio", dd);
};

export const DoFilePost = async (
	req: Request,
	rqUrl: string,
	myKey: string
) => {
	const formData = new FormData();
	const meRep: MeResponse = { status: 404, data: "" };
	try {
		for (let o in req.body) {
			try {
				//mlog("body2 ", o);
				formData.append(o, req.body[o]);
			} catch (error) {
				mlog("body  error", o);
			}
		}

		if (req.files) {
			// 处理上传的文件
			req.files.forEach((file) => {
				// 判断是单文件还是多文件上传

				mlog("fileName >>", file.fieldname);
				formData.append(file.fieldname, file.buffer, {
					filename: file.originalname,
					contentType: file.mimetype,
				});
			});
		}

		//验证IP百名单
		//await checkWhileIp( +mykey.user.uid,request );

		mlog("log", "请求>>", req.body.model, rqUrl, myKey);

		let responseBody = await axios.post(rqUrl, formData, {
			headers: {
				Authorization: myKey,
				"Content-Type": "multipart/form-data",
			},
		});

		const ss = { ...responseBody.data };
		if (ss.data && ss.data.length > 0) {
			for (let i = 0; i < ss.data.length; i++) {
				let o = ss.data[i];
				if (o.b64_json) {
					o.b64_json = "yes";
				}
				ss.data[i] = o;
			}
		}
		// dd.data = ss;
		// dd.status = responseBody.status;
		meRep.data = ss;
		meRep.status = responseBody.status;
		return meRep;
	} catch (error) {
		if (error.response) {
			let responseBody = error.response;

			meRep.data =
				responseBody.data ?? JSON.stringify({ dtail: "openai_hk_error" });
			meRep.status = responseBody.status ?? 428;
			//res.status(dd.status).send(dd.data);
		} else {
			let ss = error ? JSON.stringify(error) : "gate way error...";

			let data = {
				error: {
					message: ss,
					type: "openai_hk_error",
					code: "gate_way_error",
				},
			};
			meRep.data = JSON.stringify(data);
			meRep.status = 428;
		}
		return meRep;
	}
};

const doGptVideoPost = async (
	req: Request,
	res: Response,
	next?: NextFunction
) => {
	const formData = new FormData();
	const clientId = generateRandomCode(16);
	const request = req;
	const response = res;
	request.on("close", () => {
		mlog(`${clientId} Connection closed`);
		//clients = clients.filter(client => client.id !== clientId);
	});
	const dd = {
		from: "sora-api",
		etime: Date.now(),
		url: req.originalUrl,
		header: req.headers,
		body: req.body,
		data: "", //JSON.stringify(responseBody.data),
		status: 0, // responseBody.status,
		rqid: clientId,
	};

	let url = isNotEmptyString(process.env.GPT_SORA_BASE_URL)
		? process.env.GPT_SORA_BASE_URL
		: "https://api.openai.com";

	let myKey = isNotEmptyString(process.env.GPT_SORA_KEY)
		? process.env.GPT_SORA_KEY
		: "my-key";
	// 添加其他字段
	let rqUrl = url + "/v1/videos";
	//mlog("rqUrl   ", url);

	try {
		for (let o in req.body) {
			try {
				//mlog("body2 ", o);
				formData.append(o, req.body[o]);
			} catch (error) {
				mlog("body  error", o);
			}
		}

		if (req.files) {
			// 处理上传的文件
			req.files.forEach((file) => {
				// 判断是单文件还是多文件上传

				mlog("fileName >>", file.fieldname);
				formData.append(file.fieldname, file.buffer, {
					filename: file.originalname,
					contentType: file.mimetype,
				});
			});
		}

		//验证IP百名单
		//await checkWhileIp( +mykey.user.uid,request );

		mlog("log", "请求>>", req.body.model, rqUrl, myKey);

		let responseBody = await axios.post(rqUrl, formData, {
			headers: {
				Authorization: myKey,
				"Content-Type": "multipart/form-data",
			},
		});
		res.status(responseBody.status).send(responseBody.data);

		const ss = { ...responseBody.data };

		dd.data = ss;
		dd.status = responseBody.status;
	} catch (error) {
		if (error.response) {
			let responseBody = error.response;
			//let data = error.response.data;
			dd.data = responseBody.data ?? { dtail: "openai_hk_error" };
			dd.status = responseBody.status ?? 428;
			res.status(dd.status).send(dd.data);
		} else {
			response.writeHead(428);

			let ss = error ? JSON.stringify(error) : "gate way error...";
			response.end(
				`{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`
			);
			dd.data = ss;
			dd.status = 428;
		}
	}

	http2mq("sora-api", dd);
};

export const doGptImageEdit = async (
	req: Request,
	res: Response,
	next?: NextFunction
) => {
	const formData = new FormData();
	const clientId = generateRandomCode(16);
	const request = req;
	const response = res;

	request.on("close", () => {
		mlog(`${clientId} Connection closed`);
		//clients = clients.filter(client => client.id !== clientId);
	});
	const dd = {
		from: "gpt-image-edit",
		etime: Date.now(),
		url: req.originalUrl,
		header: req.headers,
		body: req.body,
		data: "", //JSON.stringify(responseBody.data),
		status: 0, // responseBody.status,
		rqid: clientId,
	};

	let url = isNotEmptyString(process.env.GPT_IMAGE_BASE_URL)
		? process.env.GPT_IMAGE_BASE_URL
		: "https://api.openai.com";

	let myKey = isNotEmptyString(process.env.GPT_IMAGE_KEY)
		? process.env.GPT_IMAGE_KEY
		: "my-key";
	// 添加其他字段
	let rqUrl = url + "/v1/images/edits";

	try {
		for (let o in req.body) {
			try {
				//mlog("body2 ", o);
				formData.append(o, req.body[o]);
			} catch (error) {
				mlog("body  error", o);
			}
		}

		if (req.files) {
			// 处理上传的文件
			req.files.forEach((file) => {
				// 判断是单文件还是多文件上传

				mlog("fileName >>", file.fieldname);
				formData.append(file.fieldname, file.buffer, {
					filename: file.originalname,
					contentType: file.mimetype,
				});
			});
		}

		//验证IP百名单
		//await checkWhileIp( +mykey.user.uid,request );

		mlog("log", "请求>>", req.body.model, rqUrl, myKey);

		let responseBody = await axios.post(rqUrl, formData, {
			headers: {
				Authorization: myKey,
				"Content-Type": "multipart/form-data",
			},
		});
		res.status(responseBody.status).send(responseBody.data);

		const ss = { ...responseBody.data };
		if (ss.data && ss.data.length > 0) {
			for (let i = 0; i < ss.data.length; i++) {
				let o = ss.data[i];
				if (o.b64_json) {
					o.b64_json = "yes";
				}
				ss.data[i] = o;
			}
		}
		dd.data = ss;
		dd.status = responseBody.status;
	} catch (error) {
		if (error.response) {
			let responseBody = error.response;
			//let data = error.response.data;
			dd.data = responseBody.data ?? { dtail: "openai_hk_error" };
			dd.status = responseBody.status ?? 428;
			res.status(dd.status).send(dd.data);
		} else {
			response.writeHead(428);

			let ss = error ? JSON.stringify(error) : "gate way error...";
			response.end(
				`{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`
			);
			dd.data = ss;
			dd.status = 428;
		}
	}

	http2mq("gpt-image-edit", dd);
};

export const IdeoV3 = async (
	request: Request,
	response: Response,
	next?: NextFunction
) => {
	try {
		doIdeoV3(request, response, next);
	} catch (e) {
		mlog("error", "ideo/v3", e);
	}
};

const doIdeoV3 = async (req: Request, res: Response, next?: NextFunction) => {
	const formData = new FormData();
	const clientId = generateRandomCode(16);
	const request = req;
	const response = res;

	request.on("close", () => {
		mlog(`${clientId} Connection closed`);
		//clients = clients.filter(client => client.id !== clientId);
	});
	const dd = {
		from: "ideo-v3",
		etime: Date.now(),
		url: req.originalUrl,
		header: req.headers,
		body: req.body,
		data: "", //JSON.stringify(responseBody.data),
		status: 0, // responseBody.status,
		rqid: clientId,
	};

	let BASE_URL = process.env.IDEO_SERVER;
	let BASE_KEY = process.env.IDEO_KEY ?? process.env.OPENAI_API_KEY;
	const myKey = BASE_KEY;
	try {
		for (let o in req.body) {
			try {
				//mlog("body2 ", o);
				formData.append(o, req.body[o]);
			} catch (error) {
				mlog("body  error", o);
			}
		}

		if (req.files) {
			// 处理上传的文件
			req.files.forEach((file) => {
				// 判断是单文件还是多文件上传

				mlog("fileName >>", file.fieldname);
				formData.append(file.fieldname, file.buffer, {
					filename: file.originalname,
					contentType: file.mimetype,
				});
			});
		}

		//验证IP百名单
		//await checkWhileIp( +mykey.user.uid,request );

		let rqUrl = BASE_URL + req.originalUrl;

		mlog(
			"log",
			"请求>>",
			req.body.rendering_speed,
			rqUrl,
			myKey

			//tomq.request.duration
		);

		let responseBody = await axios.post(rqUrl, formData, {
			headers: {
				Authorization: "Bearer " + BASE_KEY,
				"Content-Type": "multipart/form-data",
			},
		});
		res.status(responseBody.status).send(responseBody.data);

		dd.data = responseBody.data;
		dd.status = responseBody.status;
	} catch (error) {
		if (error.response) {
			let responseBody = error.response;
			//let data = error.response.data;
			dd.data = responseBody.data ?? { dtail: "openai_hk_error" };
			dd.status = responseBody.status ?? 428;
			res.status(dd.status).send(dd.data);
		} else {
			response.writeHead(428);

			let ss = error ? JSON.stringify(error) : "gate way error...";
			response.end(
				`{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`
			);
			dd.data = ss;
			dd.status = 428;
		}
	}

	http2mq("ideo-v3", dd);
};
