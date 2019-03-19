var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const store = require('node-persist');



var xhr = new XMLHttpRequest();
xhr.open("GET", "https://www.hof-university.de/studierende/info-service/stundenplanaenderungen/?"+
                "type=1421771406&id=166&tx_stundenplan_stundenplan[controller]=Ajax&"+
                "tx_stundenplan_stundenplan[action]=loadAenderungen&tx_stundenplan_stundenplan[studiengang]=MC&"+
                "tx_stundenplan_stundenplan[semester]=6%23SS%232019&tx_stundenplan_stundenplan[datum]=TT.MM.JJJJ&1553005727554", true);

xhr.onreadystatechange = async function() {
  if (xhr.readyState == 4)
  {
    var oldData = await store.getItem("changes")

    var newData = xhr.responseText.replace(/\\n/g, "") // Strip \n
    .replace(/( \\\/|\\\/)/g, "/") // Strip useless  backslashes
    .replace(/\\(.)/g, "$1") // Remove escaping
    .replace(/(<b>|<\/b>)/gi,"*") // Convert bold to Telegram-bold

    newData = newData.match(/<tr>.*?<\/tr>/gi); // Match by row, turns newData into an array of results

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

    // Check for changes, update data accordingly and send notifications
    for(var i = 0; i< newData.length; i++) {
      if(oldData == null || !oldData.includes(newData[i])) {
        var request = new XMLHttpRequest()
        request.open("GET", "https://api.telegram.org/bot632522612:AAFQfFb7hxaWnnhWyQ_4zcNinAUNdD0b2uA/sendMessage?chat_id=-202277559&text="+newData[i]+"&parse_mode=Markdown", true)
        request.send();
      }
    }

    await store.setItem("changes",newData);

    
  }
};

xhr.send(null);

initStore();

async function initStore() {
  store.init();
}
