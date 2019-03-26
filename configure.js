var store = require('node-persist')
var config = require("./config.json")
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
var getScheduleChanges = require("./getScheduleChanges").start

const semesterMarkup = {
  keyboard: [
    ["1","2"],
    ["3","4"],
    ["5","6"]
  ],
  one_time_keyboard: true,
  selective: true
}

const removeKeyboardMarkup = {
  remove_keyboard: true
}

async function messageReceived(req, res) {
  console.log(JSON.stringify(req.body))
  var actualMessage = req.body.message
  var messageId = req.body.message.message_id
  var chatId = actualMessage.chat.id // Use later to add multiple registered chats
  var text = actualMessage.text
  text = text.replace(/@schedule_change_bot/, "")
  console.log(text)

  if(!text) {
    res.send(true)
    return
  }

  await store.init()
  var lastCommand = await store.getItem("lastCommand")
  if(lastCommand) { // lastCommand is only set if the bot is waiting for a response for a previous request
    switch(lastCommand) {
      case "setsemester": // setsemester was called, now we are waiting for a number
        var semesterNumber = Number.parseInt(text)
        if(semesterNumber) {
          setSemester(semesterNumber)
          await store.setItem("lastCommand",undefined)
          respond("Semester updated to " + semesterNumber, res, messageId, removeKeyboardMarkup)
        }
        else {
          await store.setItem("lastCommand",undefined)
          respond(semesterNumber + " is not a number! Run /setsemester again, if you want to configure it.", res, messageId, removeKeyboardMarkup)
        }
        break;
      case "setprogram": // setprogram was called
        setProgram(text)
        await store.setItem("lastCommand",undefined)
        respond("Program updated to " + text, res, messageId)
        break;
    }
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
            respond("Semester updated to " + parameterNumber, res, messageId)
          }
          else {
            // Parameter was wrong, show answer keyboard, wait for the users answer
            setLastCommand("setsemester")
            respond("Please supply a number in range 1-6 to setsemester. Select a semester now", res, messageId, semesterMarkup)
          }
        }
        else {
         // Setsemester was called, parameter was not supplied. Give the user an answer keyboard and save the last command so that we know what to set next
          setLastCommand("setsemester")
          respond("Which semester are you currently in?", res, messageId, semesterMarkup)
        }
        break;
      case "setprogram": // Set the program
        if(parameter && parameter[1]) {
            setProgram(parameter[1])
            respond("Program updated to " + parameter[1], res, messageId)
        }
        else {
          // Setprogram was called, parameter was not supplied. Wait for an answer and save the last command so that we know what to set next
          setLastCommand("setprogram")
          respond("What program do you want updates for? Answer like this *MC@ScheduleChangeBot*", res, messageId)
        }
        break;
      case "help": // Show help
        respond("*Schedule Change Bot*%0AA bot for detecting schedule changes%0ARun /setsemester and /setprogram once to configure the bot.%0A/setsemester X configures the semester to X.%0A/setprogram X configures the program to X", res, messageId)
        break;
      default: // Command not valid
        respond("No valid command. For a list of commands see /help", res)
    }
  }
  else { // Not even a command
    respond("No valid command. For a list of commands see /help", res)
  }
}

function respond(response, res, messageId = undefined, markup = undefined) {
  var request = new XMLHttpRequest()
  if(markup) {
    request.open("GET", "https://api.telegram.org/bot"+config.botId+"/sendMessage?chat_id="+config.chatId+"&text="+response+"&parse_mode=Markdown&reply_to_message_id="+messageId+"&reply_markup="+JSON.stringify(markup), true)    
    console.log("https://api.telegram.org/bot"+config.botId+"/sendMessage?chat_id="+config.chatId+"&text="+response+"&parse_mode=Markdown&reply_to_message_id="+messageId+"&reply_markup="+JSON.stringify(markup))
  }
  else {
    request.open("GET", "https://api.telegram.org/bot"+config.botId+"/sendMessage?chat_id="+config.chatId+"&text="+response+"&parse_mode=Markdown&reply_to_message_id="+messageId, true)
  }
  request.send()
  res.send(true)
}

async function setLastCommand(command) {
  await store.setItem("lastCommand",command)
}

async function setSemester(semester) {
  await store.setItem("semester",semester)
  getScheduleChanges()
}

async function setProgram(program) {
  await store.setItem("program",program)
  getScheduleChanges()
}

module.exports = {messageReceived: messageReceived}
