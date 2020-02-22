const Promise = require("bluebird")
let request = Promise.promisify(require('request'));
Promise.promisifyAll(request)

let operation, word;
let Correctword = '';
let results = [];
let toggle = true;
let randomOperation = '';
let ranIndex = 0;

if (process.argv.length == 4) {
   operation = process.argv[2];
   word = process.argv[3];
   fetchData(word, operation);
} else if (process.argv.length == 3 && process.argv[2] != 'play') {
   operation = '';
   word = process.argv[2];
   fetchData(word, operation);
} else if (process.argv.length == 2) {
   operation = '';
   word = '';
   fetchData(word, operation);
} else if (process.argv.length == 3 && process.argv[2] == 'play') {
   random();
}





async function random() {
   let operations = ['defn', 'ant', 'syn'];
   randomOperation = operations[Math.floor(Math.random() * operations.length)];
   ({ Correctword, results } = await fetchDataRandom('', randomOperation));
   if (!results.length) {
      console.log("please Wait .....");
      randomOperation = 'syn';
      ({ Correctword, results } = await fetchDataRandom('', randomOperation));
   }
   // console.log("result for checking", Correctword)
   tryagain();
}

function tryagain() {
   process.stdout.write("Guess the word for following " + (randomOperation == 'defn' ? "defination \n" : randomOperation == 'ant' ? "antonym \n" : "synonym \n"));
   process.stdout.write(results[0] + "\n");
}

process.stdin.on('data', async function (data) {
   if (toggle) {
      if (data.toString().trim() == Correctword || (randomOperation == 'syn' && results.indexOf(data.toString().trim()) > -1)) {
         process.stdout.write("success \n");
         process.exit();
      } else {
         toggle = false;
         process.stdout.write("You have 3 choices \n");
         process.stdout.write("1 Try again \n");
         process.stdout.write("2 Hint \n");
         process.stdout.write("3 Quit \n");
      }
   }

   if (data.toString().trim() === '1') {
      toggle = true;
      tryagain();
   } else if (data.toString().trim() === '2') {
      toggle = true;
      let currIdex = Math.floor(Math.random() * results.length);
      while (results.length > 1 && ranIndex == currIdex) {
         currIdex = Math.floor(Math.random() * results.length);
      }
      hint(currIdex)
   } else if (data.toString().trim() === '3') {
      process.stdout.write(`correct word is '${Correctword}' \n`);
      process.stdout.write(`Full dictionary as follows \n`);
      await fetchData(Correctword, '');
      process.exit();
   }
})

function hint(index) {
   process.stdout.write("Another " + (randomOperation == 'defn' ? "defination " : randomOperation == 'ant' ? "antonym " : "synonym ") + "of the word \n");
   process.stdout.write(results[index] + "\n");
}

async function fetchDataRandom(word, operation) {
   try {
      let obj = {}, tempArr = [];
      let randomWord = await fetchApis('', '');
      let results = await fetchApis(randomWord.word, operation);
      if (operation == "defn") {
         tempArr = formatdefn(results, true)
      } else if (operation == 'syn' || operation == "ant") {
         tempArr = formatsyn(results, operation, true)
      } else if (operation == "ex") {
         tempArr = formatdefn(results['examples'], true)
      }
      obj['Correctword'] = randomWord.word;
      obj['results'] = tempArr;
      return obj;

   } catch (err) {
      console.log(err);
   }
}


async function fetchData(word, operation) {
   try {
      if (!word && !operation) {
         let randomWord = await fetchApis(word, operation);
         let results = await fetchApis(randomWord.word, "defn");
         formattedView(results, 'defn', randomWord.word);
         console.log("***************************************************")
         results = await fetchApis(randomWord.word, "syn");
         formattedView(results, 'syn', randomWord.word);
         console.log("***************************************************")
         formattedView(results, 'ant', randomWord.word);
         console.log("***************************************************")
         results = await fetchApis(randomWord.word, "ex");
         formattedView(results, 'ex', randomWord.word);
         console.log("***************************************************")
      } else if (word && !operation) {
         let results;
         results = await fetchApis(word, "defn");
         formattedView(results, 'defn', word);
         console.log("***************************************************")
         results = await fetchApis(word, "syn");
         formattedView(results, 'syn', word);
         console.log("***************************************************")
         formattedView(results, 'ant', word);
         console.log("***************************************************")
         results = await fetchApis(word, "ex");
         formattedView(results, 'ex', word);
         console.log("***************************************************")
      } else if (word && operation) {
         let results = await fetchApis(word, operation);
         formattedView(results, operation, word)
      }
      process.exit();
   } catch (err) {
      console.log(err);
   }
}

function formattedView(results, operation, word) {
   if (operation == 'syn' || operation == "ant") {
      console.log(operation == 'syn' ? `Synonyms of word '${word}' are:` : `Antonyms of word '${word}' are:`, formatsyn(results, operation));
   } else if (operation == "defn") {
      console.log(`Definations of word '${word}' are:`);
      console.log(formatdefn(results));
   } else if (operation == "ex") {
      console.log(`Examlpes of word '${word}' are:`)
      console.log(formatdefn(results.hasOwnProperty('examples') ? results['examples'] : []));
   }

}
function formatsyn(arr, type, value = false) {
   let synonym = [], antonym = [];
   arr.map((ele) => {
      if (ele.relationshipType == 'synonym') synonym.push(...ele.words)
      else antonym.push(...ele.words)
   });
   return value ? ((type == 'syn') ? synonym : antonym) : ((type == 'syn') ? synonym.length ? synonym.join(',') : 'Not Found' : antonym.length ? antonym.join(',') : 'Not Found');
}

function formatdefn(arr, value = false) {
   let text = [];
   arr.map((ele) => {
      text.push(ele.text);
   });
   return value ? text : text.length ? text.join('\n') : 'Not Found';
}

async function fetchApis(word, operation) {
   try {
      const apihost = 'https://fourtytwowords.herokuapp.com';
      const api_key = "b972c7ca44dda72a5b482052b1f5e13470e01477f3fb97c85d5313b3c112627073481104fec2fb1a0cc9d84c2212474c0cbe7d8e59d7b95c7cb32a1133f778abd1857bf934ba06647fda4f59e878d164";
      let data = {}, urlText = "";
      if (operation == "defn") {
         urlText = `/word/${word}/definitions`;
      } else if (operation == "syn" || operation == "ant") {
         urlText = `/word/${word}/relatedWords`;
      } else if (operation == "ex") {
         urlText = `/word/${word}/examples`;
      } else if (!word && !operation) {
         urlText = "/words/randomWord";
      }
      data = await request.getAsync(`${apihost}${urlText}?api_key=${api_key}`);
      data = await data.toJSON();

      let parseData = JSON.parse(data.body);
      if (parseData && parseData['error'] == 'word not found') {
         return [];
      } else return parseData


   } catch (err) {
      console.log(err)
   }
}


