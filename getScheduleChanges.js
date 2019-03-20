var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
const store = require('node-persist')
var setSemester = require("./configure").setSemester
var setProgram = require("./configure").setProgram
var config = require("./config.json")

var xhr = new XMLHttpRequest()

xhr.onreadystatechange = async function() {
  if (xhr.readyState == 4)
  {
    var oldData = await store.getItem("changes")

    var newData = xhr.responseText.replace(/\\n/g, "") // Strip \n
    .replace(/( \\\/|\\\/)/g, "/") // Strip useless  backslashes
    .replace(/\\(.)/g, "$1") // Remove escaping
    .replace(/(<b>|<\/b>)/gi,"*") // Convert bold to Telegram-bold

    newData = newData.match(/<tr>.*?<\/tr>/gi) // Match by row, turns newData into an array of results

    // Did not get any data, reset oldData and stop here
    if(!newData) {
      await store.setItem("changes",newData)
      return
    }

    newData.shift() // Delete first row (table header)
    var length = newData.length / 2 // Results are double for whatever reason, only take the last half of them
    for(var i = 0; i < length; i++) {
      newData.shift()
    }
    
    for(var i = 0; i < newData.length; i++) {
      newData[i] = newData[i].replace(/<br\/> */gi,"%0A") // Turn <br/> into Telegram newlines 
      .replace(/<.*?>/gi, "") // Strip remaining tags
      .replace(/%0A(%0A)+/,"%0A") // Remove extra returns
      .trim() // Remove trailing/leading whitespace
      .replace(/.*?%0A/,"") // Remove first line (useless info)
      .replace(/(.*?%0A)/,"*$1*") // Make course title bold
      .replace(/(\d)(%0A)(\d)/,"$1 $3") // Join lines of date/time
      .normalize('NFKD').replace(/[\u0300-\u036F]/g, '') // Normalize non-unicode characters
    }

    if(!config.botId || !config.chatId) { // Config was not set, log an error
      console.log("Error, Did not get chatId or botId")
      return
    }
    // Check for changes, update data accordingly and send notifications
    for(var i = 0; i< newData.length; i++) {
      if(oldData == null || !oldData.includes(newData[i])) {
        var request = new XMLHttpRequest()
        request.open("GET", "https://api.telegram.org/bot"+config.botId+"/sendMessage?chat_id="+config.chatId+"&text="+newData[i]+"&parse_mode=Markdown", true)
        request.send()
      }
    }

    await store.setItem("changes",newData)    
  }
}



start()

async function start() {
  await store.init()

  setSemester(store, "6")
  setProgram(store, "MC")

  // config variables, need to be set by the user
  var program = await store.getItem("program")
  var semester = await store.getItem("semester")

  if(!program || !semester) { // Throw an error if program or semester is not set
    console.log("Error, did not get semester or program data")
    return
  }

  // calculate current semester by year and month
  var year = new Date().getFullYear()
  var month = new Date().getMonth();

  if(month < 2) {
    semester += "%23WS%23" + (year - 1)
  }
  else if(month < 8){
    semester += "%23SS%23" + year
  }
  else {
    semester += "%23WS%23" + year
  }


  // send request to get changes for semester and program
  xhr.open("GET", "https://www.hof-university.de/studierende/info-service/stundenplanaenderungen/?"+
  "type=1421771406&id=166&tx_stundenplan_stundenplan[controller]=Ajax&"+
  "tx_stundenplan_stundenplan[action]=loadAenderungen&tx_stundenplan_stundenplan[studiengang]="+program+"&"+
  "tx_stundenplan_stundenplan[semester]="+semester+"&tx_stundenplan_stundenplan[datum]=TT.MM.JJJJ&1553005727554", true)

  xhr.send(null)
  
}
