import fs from "fs";
import * as _ from "lodash";

let dataLoaded = false;
let taskFiles = {};
let actionFiles = {};
let cronFiles = {};

let lastCron = undefined;
let lastState = undefined;

export default async (req, res) => {

    if (!dataLoaded) {
        taskFiles = await loadCode("./tasks");
        actionFiles = await loadCode("./actions");
        cronFiles = await loadCode("./cron");
        dataLoaded = true;
    }

    if (shouldExecNetFunc(req)) {
        console.log(`Executing automation as: ${JSON.stringify(req.body)} at ${new Date().toString()}`);
        if (req.body.action) {
            delete req.body["action"];
            const state = _.cloneDeep(req.body["state"]);
            delete req.body["state"];
            for (const func of actionFiles) {
                actionFiles[func].action(state, req.body);
            }
        } else if (!req.body.action) {
            for (const func in taskFiles) {
                console.log(`Func is ${func}`);
                taskFiles[func].task(req.body.state, lastState);
            }
            lastState = req.body.state;
        }
    } else {
        const newCron = new Date();
        const lastCronCopy = _.clone(lastCron)
        for (const func of cronFiles) {
            cronFiles[func].cron(newCron, lastCronCopy);
        }
        lastCron = newCron;
    }

    res.body = "Query Recieved";
}

const shouldExecNetFunc = (req) => {
    if (!req.method == "POST") {
        return false;
    }
    return true;
}

const loadCode = async (codePath) => {
    const fileNames = fs.readdirSync(codePath);
    const files = {};
    for (const name of fileNames) {
        const sourceRelativeFilePath = `../${codePath}/${name}`;
        files[name] = await import(sourceRelativeFilePath);
    }
    return files;
}