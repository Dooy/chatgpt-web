export class mError extends Error {
    reason:any
    status:number
    constructor(reason:any,status?:number){
        super(reason)
        this.reason=reason
        this.status=status??428
    }

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