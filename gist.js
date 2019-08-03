//Copy and paste bot functions here:

function freeTestBotA(me, others) {
    if (me.levels.attack < 5) {
        if (me.gold < cost(me.levels.attack))
            return farm();
        return upgrade("attack");
    }
    return attack(others[0].uid);
}

function freeTestBotB(me, others) {
    if (me.gold >= cost(me.levels.attack))
        return upgrade("attack");
    if (me.hp < 50)
        if (Math.random() < 0.5)
            return stun(others[0].uid);
        else
            return heal();
    else
        if (Math.random() < 0.5)
            return attack(others[0].uid);
        else
            return shield();
}

//Put bot names and functions below. Set debug to 1 or 2 for event log.

var botData = [
    {
        name: "FreeTestBotA",
        debug: 0,
        run: freeTestBotA
    },
    {
        name: "FreeTestBotB",
        debug: 0,
        run: freeTestBotB
    }
];

//Just call this function to test. Errors will not stop the game. Max turns: 1000. Event logger included.

function runGame(rounds = 1) {
    records = [];
    for (let i = 0; i < rounds; i++)
        runRound();
    var ids = [];
    for (let i = 0; i < records.length; i++)
        ids[i] = i;
    ids = ids.sort((a, b) => records[b] - records[a]);
    console.group("Results");
    for (let b, i = 0; i < ids.length; i++) {
        b = ids[i];
        console.log(botData[b].name + ": " + (records[b] / rounds));
    }
    console.groupEnd("Results");
}

//Ignore everything under this, it's internal stuff

var records = [];
var bots = [];
var turns = 0;

var heal = () => ["heal"];
var attack = bot => {
    var index = bots.findIndex(el => el.uid == bot && el.hp > 0);
    if (index == -1)
        return [null];
    return ["attack", index];
};
var shield = () => ["shield"];
var stun = bot => {
    var index = bots.findIndex(el => el.uid == bot && el.hp > 0);
    if (index == -1)
        return [null];
    return ["stun", index];
};
var farm = () => ["farm"];
var upgrade = item => {
    if (["heal", "attack", "shield", "farm"].includes(item))
        return ["upgrade", item];
    return [null];
};
var cost = lvl => 2.5 * (lvl ** 2) + 2.5 * lvl + 10;
var turn = () => turns;
var move = code => {
    if (!Array.isArray(code))
        return "Invalid [" + code + "]";
    else if (code[0] == "heal")
        return "Healed";
    else if (code[0] == "attack")
        return "Attacked " + botData[code[1]].name;
    else if (code[0] == "shield")
        return "Shielded";
    else if (code[0] == "stun")
        return "Stunned " + botData[code[1]].name;
    else if (code[0] == "farm")
        return "Farmed";
    else if (code[0] == "upgrade")
        return "Upgraded " + code[1];
    else if (!code[0])
        return "Skipped";
    else
        return "Unknown [" + code[0] + "]";
};

function runRound() {
    var uids = [];
    for (let i = 0; i < 100; i++)
        uids[i] = i;
    for (let j, i = 99; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        [uids[i], uids[j]] = [uids[j], uids[i]];
    }
    for (let i = 0; i < botData.length; i++) {
        bots[i] = {
            uid: uids[i],
            hp: 100,
            gold: 25,
            shield: 0,
            stun: false,
            worth: 0,
            lvl: {
                heal: 0,
                attack: 0,
                shield: 0,
                farm: 0
            },
            storage: {}
        };
        records[i] = records[i] || 0;
    }
    turns = 0;
    while (bots.filter(el => el.hp > 0).length > 1 && turns < 1000) {
        turns += 1;
        runTurn();
    }
}

function runTurn() {
    var moves = [];
    var uids = bots.filter(el => el.hp > 0).map(el => ({
        uid: el.uid,
        hp: el.hp + el.shield,
        worth: el.worth,
        attack: el.lvl.attack
    }));
    for (let j, i = uids.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        [uids[i], uids[j]] = [uids[j], uids[i]];
    }
    for (let r, b, i = 0; i < bots.length; i++) {
        b = bots[i];
        if (b.hp > 0 && !b.stun) {
            try {
                r = botData[i].run({
                    uid: b.uid,
                    hp: b.hp,
                    gold: b.gold,
                    shield: b.shield,
                    levels: Object.create(b.lvl)
                }, uids.filter(el => el.uid != b.uid), b.storage) || [null];
            } catch (e) {
                console.error("Error in " + botData[i].name + ":\n" + e.stack);
                r = [null];
            }
        } else {
            b.stun = false;
            r = [null];
        }
        moves[i] = r;
    }
    for (let m, b, n, i = 0; i < moves.length; i++) {
        m = moves[i];
        b = bots[i];
        n = botData[i].name;
        if (botData[i].debug == 1 && b.hp > 0 && !b.stun)
            console.log("[" + turns + "] " + n + ": " + move(m));
        if (botData[i].debug == 2 && b.hp > 0) {
            if (b.stun)
                console.log("[" + turns + "] " + n + ": Stunned by " + b.stun);
            else
                console.log("[" + turns + "] " + n + ":\n   HP/SHP: " + b.hp + "/" + (b.hp + b.shield) + "\n   Gold/Worth: " + b.gold + "/" + b.worth + "\n   Levels: " + b.lvl.heal + "/" + b.lvl.attack + "/" + b.lvl.shield + "/" + b.lvl.farm + "\n   Move: " + move(moves[i]));
        }
        if (!m)
            continue;
        if (m[0] == "heal") {
            b.hp = Math.min(100, b.hp + b.lvl.heal + 5);
        } else if (m[0] == "attack") {
            bots[m[1]].hp = bots[m[1]].hp - Math.max(0, b.lvl.attack * 1.25 + 5 - bots[m[1]].shield);
            bots[m[1]].shield = Math.max(0, bots[m[1]].shield - b.lvl.attack * 1.25 - 5);
            if (bots[m[1]].hp < 0) {
                b.gold += Math.ceil(bots[m[1]].worth / 2);
                b.worth += Math.ceil(bots[m[1]].worth / 2);
                records[i] += Math.ceil(bots[m[1]].worth / 2);
                console.log("%c[" + turns + "] " + n + " killed " + botData[m[1]].name, "font-weight: bold");
            }
        } else if (m[0] == "stun") {
            if (bots[m[1]].stun)
                bots[m[1]].stun += ", " + n;
            else
                bots[m[1]].stun = n;
        } else if (m[0] == "farm") {
            b.gold += b.lvl.farm * 2 + 5;
            b.worth += b.lvl.farm * 2 + 5;
            records[i] += b.lvl.farm * 2 + 5;
            b.hp -= 2;
            if (b.hp < 0)
                console.log("%c[" + turns + "] " + n + " died of overfarming", "font-weight: bold");
        } else if (m[0] == "upgrade" && b.gold >= cost(b.lvl[m[1]])) {
            b.lvl[m[1]] += 1;
            b.gold -= cost(b.lvl[m[1]] - 1);
        }
    }
    for (let m, b, n, i = 0; i < moves.length; i++) {
        m = moves[i];
        b = bots[i];
        n = botData[i].name;
        if (m[0] == "shield") {
            b.shield += b.lvl.shield * 1.5 + 5;
        }
    }
}