

var qid = 189110;
var site = 'codegolf';
var answers = null;
var myBotObj = {name:"myBot", fn: null, enabled: 1};
var customBot = false;


$(loadPlayers);


function loadPlayers() {
  var codePattern = /<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/;
  var namePattern = /<h[1-4]\b[^>]*>(.*?)<\/h1>/;
  // loadAnswers = function(s,q,c) {
  //   for (let ans of saved) {
  //     ans.fn = eval("["+ans.code+"]")[0];
  //   }
  //   answers = saved;
  // }
  loadAnswers(site, qid, c => {
    answers = c.map(answer => {
      let code = decode((codePattern.exec(answer.body)||[])[1]);
      let name =        (namePattern.exec(answer.body)||[,""])[1].split(",")[0];
      if (!name) name = /function (\w+)/.exec(code)[1];
      let fn = eval("["+code+"]")[0];
      return {name, code, fn, enabled:1};
    });
    
    if (customBot) answers.push(myBotObj);
    
    console.log(answers);
  });
  
    
  
  let lns=(runTurn+"").split("\n"); // evil hack to inject code into every turn
  lns.splice(lns.indexOf("    for (let m, b, n, i = 0; i < moves.length; i++) {"), 0, "    injected(moves);");
  runTurn = eval("["+lns.join("\n")+"]")[0];
  hoverobj.onmouseover = function() {
    if (hoverobj.parentElement.nextCell) {
      hoverobj.parentElement.nextCell.appendChild(hoverobj);
    }
  };
}

var dhistory = [];

var collect = false;

function injected(part) {
  if (part === 1) {
    collect = true;
    dhistory = [];
  } else if (part == -1) {
    collect = false;
    dhistory = [];
  } else if (part === 3) {
    
    document.body.appendChild(hoverobj);
    data.innerHTML="";
    let title = data.insertRow();
    
    for (let {name} of botData) {
      let hcell = title.insertCell();
      hcell.innerText = name;
      hcell.innerHTML = "<span>" + hcell.innerHTML + "</span>";
      hcell.style.paddingBottom="80px";
      hcell.style.textAlign="center";
      let span = hcell.children[0];
      span.style.width="10px";
      span.style.float="left";
      span.style.transform="rotate(70deg)";
    }
    let prow = null;
    for (let row of dhistory) {
      let hrow = data.insertRow();
      hrow.classList.add("dr");
      for (let {hp, gold, shield, healL, attackL, shieldL, farmL, move} of row) {
        let hcell = hrow.insertCell();
        // hcell.style.textAlign="center";
        // hcell.style.padding="0";
        // hcell.width=40;
        let hpR = Math.max(hp, 0);
        hcell.style.backgroundColor = color(255-hpR*2.55, hpR*2.55, shield);
        hcell.innerText = gold;
        hcell.innerHTML = "<div>" + hcell.innerHTML + "</div>";
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
        <tr><td>move</td> <td>${["attack","stun"].includes(move[0])?  move[0]+" "+botData[move[1]].name  :  move.join(' ')}</tr>
        </table>`;
        div.onmouseover = function() {
          hoverobj.hidden = false;
          hcell.appendChild(hoverobj);
          hoverobj.innerHTML = hoverhtml;
        };
        div.onmouseout = function() {
          // (hcell.children[1]||0).hidden = true;
          setTimeout(() => (hcell.children[1]||0).hidden = true, 10); // delay so less stutter
        };
      }
      
      if (prow) {
        [...prow.children].forEach((c, i) => c.nextCell = hrow.children[i]);
      }
      
      prow = hrow;
    }
    
  } else {
    if (dhistory.length > 1000) return; // idk what's happening, but we don't want none of that
    dhistory.push(bots.map((bot, i)=>({
      hp: bot.hp,
      gold: bot.gold,
      shield: bot.shield,
      healL: bot.lvl.heal,
      attackL: bot.lvl.attack,
      shieldL: bot.lvl.shield,
      farmL: bot.lvl.farm,
      move: part[i]
    })))
  }
}

function color(r, g, b) {
  return "rgb("+r+","+g+","+b+")";
  // return "#"+[r, g, b].map(c=>Math.min(Math.max(Math.round(c), 0), 255).toString(16).padStart(2, '0')).join('')
}

function actualRun() {
  let cont = c => {
    if (customBot) myBotObj.fn = eval("["+c+"]")[0];
    
    bots = [];
    botData = answers
    .filter(c => c.enabled)
    .map(c => (
      {name:c.name, debug:0, run: c.fn}
    ));
    injected(1);
    runGame(1);
    injected(3);
  }
  
  if (customBot) $.getScript("bot.js", cont);
  else cont();
}

function tournament(rounds) {
  $.getScript("bot.js", c => {
    myBotObj.fn = eval("["+c+"]")[0];
    
    bots = [];
    botData = answers
    .filter(c => c.enabled)
    .map(c => (
      {name:c.name, debug:0, run: c.fn}
    ));
    injected(-1);
    
    tres = [];
    for (let i = 0; i < rounds; i++) {
      runGame(1);
      tres.push(records);
    }
  })
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