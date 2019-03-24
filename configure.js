var store = require('node-persist')
var config = require("./config.json")
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest


function messageReceived(req, res) {
  console.log(req.body)
  var actualMessage = req.body.result[req.body.result.length - 1].message
  var chatId = actualMessage.chat.id // Use later to add multiple registered chats
  var text = actualMessage.text

  if(!text) {
    respond("No valid command. For a list of commands see /help", res)
    return
  }

  var command = text.match(/\/(.*?)($| )/)
  var parameter = text.match(/ (.*)/)

  if(command && command[1]) {
    switch(command[1]) {
      case "setsemester": // Set the semester
        if(parameter && parameter[1]) {
          var parameterNumber = Number.parseInt(parameter[1]) // Parse parameter string to number
          if(parameterNumber && parameterNumber >= 1 && parameterNumber <= 6) { // Semester has to be between 1 and 6
            setSemester(parameterNumber)
            respond("Semester updated to " + parameterNumber, res)
          }
          else {
            respond("Please supply a number in range 1-6 to setsemester (e.g /setsemester 6)", res)
          }
        }
        else {
          respond("Wrong syntax, setsemester needs one parameter (e.g /setsemester 6)", res)
        }
        break;
      case "setprogram": // Set the program 
        if(parameter && parameter[1]) {
            setSemester(parameter[1])
            respond("Program updated to " + parameter[1], res)
        }
        else {
          respond("Wrong syntax, setprogram needs one parameter (e.g /setprogram MC)", res)
        }
        break;
      case "help": // Show help
        respond("Schedule Change Bot%0AA bot for detecting schedule changes%0ARun /setsemester and /setprogram once to configure the bot.%0A/setsemester X configures the semester to X.%0A/setprogram X configures the program to X", res)
        break;
      default: // Command not valid
        respond("No valid command. For a list of commands see /help", res)      
    }
  }
  else { // Not even a command
    respond("No valid command. For a list of commands see /help", res)
  }
  
}

function respond(response, res) {
  var request = new XMLHttpRequest()
  request.open("GET", "https://api.telegram.org/bot"+config.botId+"/sendMessage?chat_id="+config.chatId+"&text="+response+"&parse_mode=Markdown", true)
  request.send()
  res.send(true)
}

async function setSemester(semester) {
  await store.init()
  await store.setItem("semester",semester)
}

async function setProgram(program) {
  await store.init()
  await store.setItem("program",program)
}

module.exports = {setSemester: setSemester, setProgram: setProgram, messageReceived: messageReceived}
