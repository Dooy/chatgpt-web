
export function getCurrentDate() {
  const date = new Date()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
}

export function getIam():string|null
{
	let iam : string | null = localStorage.getItem('iam');
	if(!iam){
		iam= "D"+randomCoding(7).toLowerCase();
		localStorage.setItem('iam',iam );
	}
	return iam;
}

//随机数
export function randomCoding(n=16):string
{
	let arr = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
	let idvalue ='';
	for(let i=0;i<n;i++){
		idvalue+=arr[Math.floor(Math.random()*26)];
	}
	return idvalue;
}


/**
 * cookie 抓JSON
 */
export function cookie2json(ck:string):any
{
	let av= ck.split(';').map(v=>{
		let arr= v.split('=');
		return {k: arr[0].replace(' ',''),v:arr[1]};
	});
	let rz = {}
	for(let v of av) { // @ts-ignore
		rz[v.k]=v.v
	}
	return rz ;
}

export function getCookieUserInfo(){
	let ck= cookie2json( document.cookie);
	//showLog('ck',ck );
	if( !ck || !ck._UHAO) return null;

	let u= JSON.parse( decodeURIComponent(ck._UHAO) );
	//showLog('u',u );
	return  u;
}

//sleep 毫秒
export function sleep(time:number){
	return new Promise(h=>setTimeout(()=>h(time ),time));
}

export function getTextFormProcess(text:string):any
{
	let arr = text.split("\n")
	let str=''
	let obj:any;
	let f= JSON.parse(arr[0]);
	arr.shift();
	for(let  v of arr){
		obj= JSON.parse(v);
		str+=obj.t;
	}
	return  {text:str,i:obj?.i,o:obj?.o, parentMessageId:f.id } ;

}

export function isIfram(){
	return window.self !== window.top;
}

