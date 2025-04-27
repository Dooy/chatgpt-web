import { Request, Response, NextFunction } from "express";
import { generateRandomCode, mlog } from "./utils";
import FormData from "form-data";
import { isNotEmptyString } from "src/utils/is";
import { getMyKey } from "./sse";
import axios from "axios";
import { http2mq } from "./suno";
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

		let rqUrl = url + "/v1/images/edits";

		mlog(
			"log",
			"请求>>",
			req.body.model,
			rqUrl,
			myKey

			//tomq.request.duration
		);

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
					o.b64_json = "ok";
				}
				ss.data[i] = o;
			}
		}
		dd.data = ss;
		dd.status = responseBody.status;

		//res.json(responseBody.data);
		res.status(responseBody.status).send(responseBody.data);
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
