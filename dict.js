const Promise = require("bluebird")
let request = Promise.promisify(require('request'));
Promise.promisifyAll(request)

let operation,word;
if (process.argv.length == 4) {
   operation = process.argv[2];
   word = process.argv[3];
} else if (process.argv.length == 3) {
   operation = '';
   word = process.argv[2];
} else if (process.argv.length == 2) {
   operation = '';
   word = '';
}
fetchData(word,operation)
async function fetchData(word, operation) {
   try {
      if (!word && !operation) {
         let randomWord = await fetchApis(word, operation);
         console.log("rand", randomWord.word)
         console.log("defn", await fetchApis(randomWord.word, "defn"))
        let results= await fetchApis(randomWord.word, "syn");
         console.log("synonyms are", formatsyn(results,'syn'));
         console.log("ant", formatsyn(results,'ant'));
         console.log("ex", await fetchApis(randomWord.word, "ex"))
      } else if (word && !operation) {
         console.log("defn", await fetchApis(word, "defn"))
         let results= await fetchApis(randomWord.word, "syn");
         console.log("syn", formatsyn(results,'syn'));
         console.log("ant", formatsyn(results,'ant'));
         console.log("ex", await fetchApis(word, "ex"));
      } else if (word && operation) {
         let results= await fetchApis(word, operation);
         console.log(`${operation}`, formatsyn(results,operation));
      }

   } catch (err) {
console.log(err);
   }
}

function formatsyn(arr,type){
   let synonym=[],antonym=[];
   arr.map((ele) => {
      if (ele.relationshipType == 'synonym') synonym.push(...ele.words) 
      else antonym.push(...ele.words)
   });
  return (type=='syn')?synonym.join(','):antonym.join(',');
}

// process.on('beforeExit',(data)=>{
// console.log("bye visit again")
// })



async function fetchApis(word, operation) {
   try{
      const apihost = 'https://fourtytwowords.herokuapp.com';
      const api_key = "b972c7ca44dda72a5b482052b1f5e13470e01477f3fb97c85d5313b3c112627073481104fec2fb1a0cc9d84c2212474c0cbe7d8e59d7b95c7cb32a1133f778abd1857bf934ba06647fda4f59e878d164";
      let data = {}, urlText = "";
      if (operation == "defn") {
         urlText = `/word/${word}/definitions`;
      } else if (operation == "syn" || operation == "ant") {
         urlText = `/word/${word}/relatedWords`;
      } else if (operation == "ex") {
         urlText = `/word/${word}/examples`;
      } else if(!word&&!operation){
         urlText = "/words/randomWord";
      }
      data = await request.getAsync(`${apihost}${urlText}?api_key=${api_key}`);
      data = await data.toJSON();
      // console.log(urlText, JSON.parse(data.body));
      return JSON.parse(data.body);

   } catch(err){
console.log(err)
   }
}


