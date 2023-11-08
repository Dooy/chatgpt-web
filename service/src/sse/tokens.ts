import { get_encoding } from '@dqbd/tiktoken'

// TODO: make this configurable
const tokenizer = get_encoding('cl100k_base')

export function encode(input: string): Uint32Array {
  return tokenizer.encode(input)
}

export function numTokensFromMessages(messages, model="gpt-3.5-turbo-0301") {
  // Returns the number of tokens used by a list of messages.
  // try {
  //   var encoding = tiktoken.encodingForModel(model);
  // } catch (error) {
  //   console.log("Warning: model not found. Using cl100k_base encoding.");
  //   encoding = tiktoken.getEncoding("cl100k_base");
  // }
  const encoding=tokenizer;
  let tokensPerMessage = 4
  if (model == "gpt-3.5-turbo") {
    //console.log("Warning: gpt-3.5-turbo may change over time. Returning num tokens assuming gpt-3.5-turbo-0301.");
    return numTokensFromMessages(messages, "gpt-3.5-turbo-0301");
  } else if (model == "gpt-4" || model.indexOf('gpt-4')>-1 ) {
    //console.log("Warning: gpt-4 may change over time. Returning num tokens assuming gpt-4-0314.");
    //return numTokensFromMessages(messages, "gpt-4-0314");
    tokensPerMessage = 3;
    var tokensPerName = 1;
  } else if (model == "gpt-3.5-turbo-0301" ||  model.indexOf('gpt-3.5')>-1 ) {
   ; // every message follows <|start|>{role/name}\n{content}<|end|>\n
    tokensPerMessage = 4
    var tokensPerName = -1; // if there's a name, the role is omitted
  } else if (model == "gpt-4-0314" || model.startsWith("gpt-4") ) {
    tokensPerMessage = 3;
    var tokensPerName = 1;
  } else {
    tokensPerMessage = 4
    var tokensPerName = -1;
    console.log('未知模型 ' , model )
    //throw new Error(`numTokensFromMessages() is not implemented for model ${model}. See https://github.com/opeinai/opeinai-python/blob/main/chatml.md for information on how messages are converted to tokens.`);
  }
  var numTokens = 0;
  for (var i = 0; i < messages.length; i++) {
    const message = messages[i];
    numTokens += tokensPerMessage;
    for (var key in message) {
      if (message.hasOwnProperty(key)) {
        const value = message[key];
        if(  isString( value )  ) {
          ( numTokens += encoding.encode(value).length??0);
        }else if(isObject(value )){
           console.log('token 计算是 Object : ' ,key , JSON.stringify( value ) );
           numTokens += encoding.encode(JSON.stringify( value )).length??0;     
        }
        if (key == "name") {
          numTokens += tokensPerName;
        }
      }
    }
  }
  numTokens += 3
  return numTokens
}
function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null && !(value instanceof Array);
}
function isString(value: any): boolean {
  return typeof value === 'string';
}
