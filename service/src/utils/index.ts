import * as fs from 'fs';

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



