
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
	if(iam){
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


