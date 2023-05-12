import * as fs from 'fs';
import {ChatMessage} from "../chatgpt";
import { get_encoding } from '@dqbd/tiktoken'
import { tokenProps } from 'src/types';

// TODO: make this configurable
const tokenizer = get_encoding('cl100k_base')

 
export function getTokens( rq:tokenProps): Uint32Array {
	if(!rq.encode) return tokenizer.encode(rq.q)
	const t = get_encoding( rq.encode)
  return t.encode(rq.q)
}


interface SendResponseOptions<T = any> {
  type: 'Success' | 'Fail'
  message?: string
  data?: T
}

export function sendResponse<T>(options: SendResponseOptions<T>) {
  if (options.type === 'Success') {
    return Promise.resolve({
      message: options.message ?? null,
      data: options.data ?? null,
      status: options.type,
    })
  }

  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject({
    message: options.message ?? 'Failed',
    data: options.data ?? null,
    status: options.type,
  })
}



export function writeAidutu( data:object ){

	const json = JSON.stringify(data, null, 2);

	fs.writeFile('aidu.json', json, (err) => {
		if (err) {
			console.error(err);
		} else {
			console.log('Data written to file');
		}
	});
}

export function readAidutu(){
	return new Promise( (h,r)=>{
		fs.readFile('aidu.json', 'utf8', (err, data) => {
			if (err) {
				//console.error(err);
				r(err)
			} else {
				const jsonData = JSON.parse(data);
				h(jsonData)
			}
		});
	})
}

export function jianDan(chat: ChatMessage){
	let rz:any={t:chat.delta}
	if( chat.detail?.usage ){
		rz.i=chat.detail.usage.prompt_tokens;
		rz.o=chat.detail.usage.completion_tokens;
	}
	return rz;
}




