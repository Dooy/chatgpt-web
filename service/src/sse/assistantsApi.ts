import { Request, Response, NextFunction } from "express";
import { generateRandomCode, mlog } from "./utils";
import { getMyKey } from "./sse";
import { publishData } from "./rabittmq";
import { isNotEmptyString } from "src/utils/is";
import { fetchSSE } from "./fetch-sse";
import { encode } from "./tokens";
import axios from "axios";
import FormData from "form-data";

const changBody = (body: any, uid: number) => {
	//mlog('changBody', body);
	let rz = body;
	const notifyHook = `${process.env.SSE_HTTP_SERVER}/openai/mjapi/${uid}`;
	rz.notifyHook =
		notifyHook + "/" + (rz.notifyHook ? encodeURIComponent(rz.notifyHook) : "");
	if (!rz.state || rz.state == "") rz.state = `${uid}`;
	mlog("changBody>> ", rz.notifyHook);
	return rz;
};

function getXRui(uri: string) {
	uri = uri.toLowerCase();
	let iend = uri.search(/[?&#]/);
	if (iend == -1) return uri;

	return uri.substring(0, iend);
}
export interface errorType {
	message: string;
	type: string;
	param: string;
	code: string;
}
//主程序
export const assistantsApi = async (
	request: Request,
	response: Response,
	next?: NextFunction
) => {
	mlog("mytest");
	const headers = {
		"Content-Type": "application/json",
		Connection: "keep-alive",
		"Cache-Control": "no-cache",
	};
	let isGo = false;
	const clientId = generateRandomCode(16);
	const newClient = {
		id: clientId,
		response,
	};
	request.on("close", () => console.log(`${clientId} Connection closed`));

	let tomq = {
		header: request.headers,
		request: request.body,
		response: "",
		url: request.url,
		reqid: clientId,
		status: 200,
		myKey: "",
		myUrl: "",
		stime: Date.now(),
		etime: 0,
		user: {},
	};

	const url = isNotEmptyString(process.env.OPENAI_API_BASE_URL)
		? process.env.OPENAI_API_BASE_URL
		: "https://api.openai.com";
	const userPsw = isNotEmptyString(process.env.OPENAI_API_KEY)
		? process.env.OPENAI_API_KEY
		: "sk-abc";

	const uri = request.headers["x-uri"] ?? request.url;
	let error: errorType = {
		message: "",
		code: "openai_hk_error",
		type: "openai_hk_error",
		param: "",
	};
	try {
		//const mykey=await getMyKey(  request.headers['authorization'], request.body);
		const mykey = await getMyKey(request, "gpt");
		//tomq.myKey=mykey.key ;
		tomq.myKey = userPsw;
		tomq.myUrl = url;
		tomq.user = mykey.user;

		const rqUrl = url + uri; //mykey.apiUrl==''? url+uri: mykey.apiUrl+uri;
		// const authString = ;//Buffer.from( userPsw ).toString('base64');

		mlog("请求>>", rqUrl, mykey.user?.uid, mykey.user?.fen, userPsw);
		const body =
			request.method == "GET" ? undefined : JSON.stringify(request.body); //JSON.stringify(  changBody(request.body,+mykey.user?.uid ));
		let murl = getXRui(uri as string);
		mlog("body", murl, body, request.method);
		if (request.body.tools && murl == "/v1/assistants") {
			//request.body
			const retrievalIndex = request.body.tools.findIndex(
				(v: any) => v.type == "retrieval"
			); //"type":"retrieval"
			if (retrievalIndex > -1) {
				error.message = "now not suport retrieval";
				response.json({ error }).end();
				return;
			}
		}

		await fetchSSE(rqUrl, {
			method: request.method, //'POST'
			headers: {
				"Content-Type": "application/json",
				"OpenAI-Beta": "assistants=v2",
				Authorization: `Bearer ${userPsw}`,
			},
			onMessage(data) {
				if (!isGo) response.writeHead(200, headers);
				isGo = true;
				response.write(data);
				tomq.response += data;
			},
			onError(e) {
				console.log("onError>>", e);
				response.writeHead(e.status);
				response.end(e.reason);
				publishData("openapi", "error_assi", JSON.stringify({ e, tomq }));
				//endStr=e.reason;
			},
			//body: JSON.stringify( request.body)
			body,
		});
	} catch (e) {
		console.log("error>>", e);
		//response.send(2)
		if (e.status) {
			response.writeHead(e.status);
			publishData("openapi", "error_assi", JSON.stringify({ e, tomq }));
			response.end(e.reason?.replace(/one_api_error/gi, "openai_hk_error"));
			return;
			//response.write(`data: ${ e.reason}\n\n`);
		} else {
			response.writeHead(428);
			//response.end("get way error...\n"  );
			let ss = e.reason ?? "gate way error...";
			response.end(
				`{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`
			);
			console.log("error>>", ss, e);

			//请图片数据省得太大
			if (tomq.request.base64Array) tomq.request.base64Array = [];
			if (tomq.request.base64) tomq.request.base64 = "3";

			publishData(
				"openapi",
				"error_assi",
				JSON.stringify({ e: { status: 428, reason: e }, tomq })
			);
			return;
		}
	}
	console.log("finish_assi", request.headers["authorization"]);
	tomq.etime = Date.now();
	//请图片数据省得太大
	if (tomq.request.base64Array) tomq.request.base64Array = [];
	if (tomq.request.base64) tomq.request.base64 = "3";

	publishData("openapi", "finish_assi", JSON.stringify(tomq));
	response.end();
};

//token计算

interface outType {
	error: number;
	error_des: string;
	data?: any;
}

//token计算主程
export const tokenApi = async (
	request: Request,
	response: Response,
	next?: NextFunction
) => {
	let out: outType = { error: 0, error_des: "" };
	const req = request.body;
	if (!req.text) {
		out.error = 401;
		out.error_des = "参数缺失 text";
		response.json(out);
		return;
	}
	if (req.encode) {
		let code = encode(req.text);
		let cc = [];
		code.forEach((v) => cc.push(v));
		out.data = { cnt: code.length, code: cc };
	} else {
		out.data = { cnt: encode(req.text).length };
	}
	response.json(out);
};

//export async function whisper( request:Request, response:Response, next?:NextFunction) {
export const uploadFileApi = async (
	request: Request,
	response: Response,
	next?: NextFunction
) => {
	let error: errorType = {
		message: "",
		code: "openai_hk_error",
		type: "openai_hk_error",
		param: "",
	};
	const clientId = generateRandomCode(16);
	let tomq = {
		header: request.headers,
		request: request.body,
		response: "",
		url: request.url,
		reqid: clientId,
		status: 200,
		myKey: "",
		myUrl: "",
		stime: Date.now(),
		etime: 0,
		user: {},
	};

	const url = isNotEmptyString(process.env.OPENAI_API_BASE_URL)
		? process.env.OPENAI_API_BASE_URL
		: "https://api.openai.com";
	const userPsw = isNotEmptyString(process.env.OPENAI_API_KEY)
		? process.env.OPENAI_API_KEY
		: "sk-abc";

	const uri = request.headers["x-uri"] ?? request.url;
	const req = request;
	const res = response;
	if (!req.file || !req.file.buffer) {
		//res.status(400).json({'error':'uploader fail'});

		publishData(
			"openapi",
			"error",
			JSON.stringify({ e: { error: "buffer error file not uploader " }, tomq })
		);
		response
			.writeHead(428)
			.end(
				`{"error":{"message":"please upload file ","type":"openai_hk_error","code":"file_null"}}`
			);
		return;
	}

	try {
		const fileBuffer = req.file.buffer;
		const formData = new FormData();
		formData.append("file", fileBuffer, { filename: req.file.originalname });
		formData.append("purpose", req.body.purpose);

		//获取key
		const mykey = await getMyKey(request, "gpt");
		tomq.myKey = "Bearer " + userPsw;
		tomq.myUrl = url;
		tomq.user = mykey.user;
		let rqUrl = url + uri;
		let model = req.body.purpose;

		console.log(
			"请求>>",
			rqUrl,
			mykey.user?.uid,
			model,
			mykey.user?.fen,
			tomq.myKey
		);

		let responseBody = await axios.post(rqUrl, formData, {
			headers: {
				Authorization: tomq.myKey,
				"Content-Type": "multipart/form-data",
			},
		});
		// console.log('responseBody', responseBody.data  );
		res.json(responseBody.data);
		tomq.response = JSON.stringify(responseBody.data);
	} catch (error) {
		if (error.response) {
			let e = error.response;
			let data = error.response.data;
			console.log("error>>", data);
			response.writeHead(e.status ?? 428);
			publishData(
				"openapi",
				"error_assi",
				JSON.stringify({ e: { status: e.status, data }, tomq })
			);
			if (data)
				response.end(
					JSON.stringify(data).replace(/one_api_error/gi, "openai_hk_error")
				);
			else {
				response.end(
					`{"error":{"message":"error","type":"openai_hk_error","code":"gate_way_error"}}`
				);
			}
			return;
			//response.write(`data: ${ e.reason}\n\n`);
		} else if (error.status) {
			publishData("openapi", "error_assi", JSON.stringify({ e: error, tomq }));
			response.writeHead(error.status).end(error.reason);
		} else {
			let e = error;
			response.writeHead(428);
			//response.end("get way error...\n"  );
			let ss = e.reason ?? "gate way error...";
			response.end(
				`{"error":{"message":"${ss}","type":"openai_hk_error","code":"gate_way_error"}}`
			);
			console.log("error>>", ss, e);
			publishData(
				"openapi",
				"error_assi",
				JSON.stringify({ e: { status: 428, reason: e }, tomq })
			);
			return;
		}
	}

	console.log("finish_assi", request.headers["authorization"]);
	tomq.etime = Date.now();
	publishData("openapi", "finish_assi", JSON.stringify(tomq));
	response.end();
};
