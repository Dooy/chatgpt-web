import { isNotEmptyString } from "src/utils/is"

export class mError extends Error {
    reason:any
    status:number
    constructor(reason:any,status?:number){
        super(reason)
        this.reason=`{"error":{"message":"${reason}","type":"openai_hk_error"}}` 
        this.status=status??428
    }

}

export const mlog =(...arg)=>{
  //const M_DEBUG = process.env.M_DEBUG
  if(! isNotEmptyString(process.env.M_DEBUG) ) return ;
  
  const currentDate = new Date();
  const hours = currentDate.getHours().toString().padStart(2, '0');
  const minutes = currentDate.getMinutes().toString().padStart(2, '0');
  const seconds = currentDate.getSeconds().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}:${seconds}`;
  console.log( currentTime,...arg)
}
export function generateRandomCode(length:number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}