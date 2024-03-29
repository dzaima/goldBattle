FAILC=0; SUCCC=0; DDBTS=[];

var qid = 189110;
var site = 'codegolf';
var answers = null;
var myBotObj = {name:"myBot", fn: null, enabled: 1};
var customBot = false;


$(loadPlayers);


function loadPlayers() {
  
  
  let lns=(runTurn+"").split("\n"); // evil hack to inject code into every turn
  lns.splice(lns.indexOf("    for (let ls, u, m, r, b, i = 0; i < bots.length; i++) {"), 0, "    injected('p1');");
  lns.splice(lns.indexOf("    for (let m, b, n, i = 0; i < moves.length; i++) {"), 0, "    injected('p2', moves);");
  runTurn = eval("["+lns.join("\n")+"]")[0];
  hoverobjW.onmouseover = function() {
    if (hoverobjW.parentElement.nextCell) {
      hoverobjW.parentElement.nextCell.appendChild(hoverobjW);
    }
  };
  
  
  var codePattern = /<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/;
  var namePattern = /<h[1-4]\b[^>]*>(.*?)<\/h1>/;
  // loadAnswers = function(s,q,c) {
  //   for (let ans of saved) {
  //     ans.fn = eval("["+ans.code+"]")[0];
  //   }
  //   answers = saved;
  //   if (customBot) answers.push(myBotObj);
  //   actualRun();
  // }
  loadAnswers(site, qid, c => {
    answers = c.map(answer => {
      let code = decode((codePattern.exec(answer.body)||[])[1]);
      let name =        (namePattern.exec(answer.body)||[,""])[1].split(",")[0];
      if (!name) name = /function (\w+)/.exec(code)[1];
      try {
        let fn = eval("["+code+"]")[0];
        return {name, code, fn, enabled:1};
      } catch (e) {
        console.log("Failed to eval bot "+name+"!");
        return {name, code, fn:null, enabled:0};
      }
    });
    
    if (customBot) answers.push(myBotObj);
    
    
    console.log(answers);
    actualRun();
  });
  
    
  
}

var dhistory = [];

var collect = false;

function injected(part, arg) {
  if (part === "game") {
    collect = true;
    dhistory = [];
  } else if (part === "tournament") {
    collect = false;
    dhistory = [];
  } else if (part === "table") {
    document.body.appendChild(hoverobjW);
    data.innerHTML=("<tr>"+"<td></td>".repeat(dhistory.length+1)+"</tr>").repeat(dhistory[0].length+1);
    let hrows = data.children[0].children;
    // let title = data.insertRow();
    // title.classList.add("topRow");
    
    // let hTurnHCell = title.insertCell();
    // hTurnHCell.classList.add("rotate");
    // hTurnHCell.innerHTML = "<div><span>turn</span></div>";
    
    // for (let {name} of botData) {
    //   let hcell = title.insertCell();
    //   hcell.classList.add("rotate");
    //   hcell.innerText = name;
    //   hcell.innerHTML = "<div><span>" + hcell.innerHTML + "</span></div>";
    // }
    
    for (let y = 0; y < dhistory[0].length; y++) {
      hrows[y+1].children[0].innerText = botData[y].name;
    }
    for (let x = 0; x < dhistory.length; x++) {
      
      let hTurnCell = hrows[0].children[x+1];
      hTurnCell.innerHTML = x + "&nbsp;";
      hTurnCell.style.color = "#D2D2D2";
      
      for (let y = 0; y < dhistory[0].length; y++) {
        let {hp, gold, shield, healL, attackL, shieldL, farmL, move, worth, stun} = dhistory[x][y];
        let hcell = hrows[y+1].children[x+1];
        hcell.classList.add("dc");
        hrows[y].children[x+1].nextCell = hcell;

        let hpR = Math.max(hp, 0) * 2.55;
        let sc = c => stun? c : 1;
        hcell.style.backgroundColor = hp<=0? "#881111" : color(255 - hpR*sc(.3), 255 - (255-hpR)*sc(.5), 255 - (255-shield)*sc(.7));
        hcell.innerHTML = "<div>" + gold + "</div>";
        let div = hcell.children[0];
        let hoverhtml = 
        `<table>
        <tr><td>HP</td> <td>${hp}</td></tr>
        <tr><td>gold</td> <td>${gold}</td></tr>
        <tr><td>shield</td> <td>${shield}</td></tr>
        <tr><td>healL</td> <td>${healL}</td></tr>
        <tr><td>attackL</td> <td>${attackL}</td></tr>
        <tr><td>farmL</td> <td>${farmL}</td></tr>
        <tr><td>shieldL</td> <td>${shieldL}</td></tr>
        <tr><td>worth</td> <td>${worth}</td></tr>
        <tr><td>move</td> <td>${stun? "stunned" : ["attack","stun"].includes(move[0])?  move[0]+" "+botData[move[1]].name  :  move.join(' ')}</tr>
        </table>`;
        let ci = y;
        div.onmouseover = function() {
          hoverobj.hidden = false;
          hoverobj.style.right = ci<3? "0%" : ci>dhistory.length-3? "100%" : "50%";
          hcell.appendChild(hoverobjW);
          hoverobj.innerHTML = hoverhtml;
        };
        div.onmouseout = function() {
          // (hcell.children[1]||0).hidden = true;
          setTimeout(() => {
            let ch = hcell.children[1];
            if (ch) ch.children[0].hidden = true;
          }, 10); // delay so less stutter
        };
      }
      
      // if (prow) {
      //   [...prow.children].forEach((c, i) => c.nextCell = hrow.children[i]);
      // }
      
    }
    
  } else if (part === "p1") {
    if (dhistory.length > 1000) return; // idk what's happening, but we don't want none of that
    dhistory.push(bots.map(bot => ({
      hp: bot.hp,
      gold: bot.gold,
      worth: bot.worth,
      shield: bot.shield,
      healL: bot.lvl.heal,
      attackL: bot.lvl.attack,
      shieldL: bot.lvl.shield,
      farmL: bot.lvl.farm,
      stun: bot.stun,
      move: null
    })));
  } else if (part === "p2") {
    if (dhistory.length > 1000) return;
    dhistory[dhistory.length-1].forEach((c, i) => c.move = arg[i]);
  }
}

function color(r, g, b) {
  return "rgb("+r+","+g+","+b+")";
  // return "#"+[r, g, b].map(c=>Math.min(Math.max(Math.round(c), 0), 255).toString(16).padStart(2, '0')).join('')
}

function find(name) {
  return answers.find(c=>c.name.includes(name));
}

function actualRun(log = false) {
  console.clear();
  updateBots(() => {
    injected("game");
    runGame(1, log);
    injected("table");
  });
}

function tournament(rounds) {
  updateBots(() => {
    injected("tournament");
    
    tres = [];
    for (let i = 0; i < rounds; i++) {
      records = [];
      runRound(false);
      if (i%100 == 0) console.log(i + "/" + rounds);
      tres.push(records);
    }
    console.log("Tournament complete!");
  });
}

function updateBots(cont2) {
  cont1 = () => {
    bots = [];
    botData = answers
      .filter(c => c.enabled)
      .map(c =>
        ({name:c.name, debug:0, run: c.fn})
      );
    cont2();
  }
  if (customBot) $.getScript("bot.js", c => {
    // myBotObj.fn = eval("["+c+"]")[0];
    
    
    if (customBot) myBotObj.fn = eval("["+c+"]")[0];
    
    cont1();
  });
  else cont1();
}



// copy-paste from trichoplax's Fromic Functions

function loadAnswers(site, qid, onFinish) {
  var answers = []
  function loadPage() {
    $.get(
      'https://api.stackexchange.com/2.2/questions/' +
      qid.toString() + '/answers?page=' +
      (page++).toString() +
      '&pagesize=100&order=asc&sort=creation&site=' +
      site + '&filter=!YOKGPOBC5Yad4mOOn8Z4WcAE6q', readPage
    )
  }
  function readPage(data) {
    answers = answers.concat(data.items)
    if (data.hasMore) {
      loadPage()
    } else {
      onFinish(answers)
    }
  }
  var page = 1
  loadPage(page, readPage)
}

function decode(html) {
    return $('<textarea>').html(html).text()
}