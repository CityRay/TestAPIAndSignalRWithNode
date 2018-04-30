/*
* @Author: RayLin
* @Date:   2017-10-16 14:36:43
* @Last Modified by:   RayLin
* @Last Modified time: 2018-04-30 13:59:26
*/

const readlineSync = require('readline-sync');
const prompt = require('prompt');
const chalk = require('chalk');
const signalr = require('./signalr');
const ping = require('./request');

const PROCESSPROMPT = true;
const AREA = readlineSync.question('Type your location & name (tw-xxx) => ');
console.log(chalk.blue.bold(`Your type >>> ${AREA.toUpperCase()}`));

prompt.start();

console.log('Test API            Type >>> 1');
console.log('Test SignalR        Type >>> 2');
console.log('Test Alpha SignalR  Type >>> 3');

prompt.get(['Type'], function (err, result) {
    // console.log(result.Type);
    if (result.Type === '1') {
        console.log('Start to Excute Request URL');
        ping(AREA, PROCESSPROMPT);
    } else if (result.Type === '2') {
        console.log('Start to Excute Test SignalR');
        signalr('prod', AREA, PROCESSPROMPT);
    } else if (result.Type === '3') {
        console.log('Start to Excute Test Alpha SignalR');
        signalr('alpha', AREA, PROCESSPROMPT);
    }
});
