import moment, { Moment } from 'moment'

// taken from https://github.com/jstnryan/helium-reward-log/blob/master/js/index.js

export type RewardEntry = {
    timestamp: string,
    minerHash: string,
    minerName: string,
    block: string,
    amount: number,
    id: string,
}

let openConnections = 0;
let errors:Array<any> = []
let retryCount = 3

let rewards = [];
let gateways = {};
let prices = {};
let processed = [];
export let processedObjects:Array<RewardEntry> = [];

export function apiRequest(url:string, callback:(...params:any) => void) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                --openConnections;
                callback(xhr.responseText, url);
            } else {
                openConnections = -1;
                if (errors.hasOwnProperty(url) && errors[url] >= retryCount) {
                    alert('There was a error while fetching reward info.');
                    // document.getElementById('button-download').disabled = true;
                    // document.getElementById('status-area').classList.add('u-hidden');
                    // document.getElementById('button-generate').disabled = false;
                } else {
                    if (errors.hasOwnProperty(url)) {
                        ++errors[url];
                    } else {
                        errors[url] = 1;
                    }
                    apiRequest(url, callback);
                }
            }
        }
    }
    ++openConnections;
    xhr.open("GET", url);
    xhr.send();
}

export function getOwnerRewards(ownerAddress:string, startTime:Moment, endTime:Moment) {
    // error within the api requiring a negative UTC offset
    const formatedStartTime = startTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    const formatedEndTime = endTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    console.log("getting rewards for", ownerAddress, formatedStartTime, formatedEndTime)    

    let url = 'https://api.helium.io/v1/accounts/' + ownerAddress + '/rewards?max_time=' + formatedEndTime + '&min_time=' + formatedStartTime;
    console.log("url", url)
    apiRequest(url, setRewards);
}

export function getHotspotsRewards(hotspotAddress:string, startTime:Moment, endTime:Moment) {
    // error within the api requiring a negative UTC offset
    const formatedStartTime = startTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    const formatedEndTime = endTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    console.log("getting rewards for", hotspotAddress, formatedStartTime, formatedEndTime)    

    let url = 'https://api.helium.io/v1/hotspots/' + hotspotAddress + '/rewards?max_time=' + formatedEndTime + '&min_time=' + formatedStartTime;
    console.log("url", url)
    apiRequest(url, setRewards);
}

function logging(...params:any) {
    console.log(params)
    
}

function setRewards(response, url) {
    response = JSON.parse(response);
    console.log("got response", response)
    if (response.hasOwnProperty('data')) {
        for (let d = 0; d < response.data.length; d++) {
            rewards.push(response.data[d]);
            if (!gateways.hasOwnProperty(response.data[d].gateway)) {
                gateways[response.data[d].gateway] = 'unknown';
                getGateway(response.data[d].gateway);
            }
        }
    }
    if (response.hasOwnProperty('cursor')) {
        apiRequest(
            url.slice(0, url.indexOf('&cursor=')) + '&cursor=' + response.cursor,
            setRewards
        );
    } else {
        processData();
    }
}

function getGateway(hash:string) {
    apiRequest('https://api.helium.io/v1/hotspots/' + hash, setGateway);
}

function setGateway(response:string) {
    response = JSON.parse(response);
    gateways[response.data.address] = response.data.name;
}


function processData() {
    if (openConnections > 0) {
        // wait for API calls to finish before processing data
        setTimeout(function() { processData(); }, 1000);
        return;
    } else if (openConnections < 0) {
        return;
    }
    console.log("processing data", JSON.stringify(gateways), rewards)

    for (let r = 0; r < rewards.length; r++) {
        let amount = rewards[r].amount / 100000000; // "bones" per HNT
 

        let rArr = [
            rewards[r].timestamp,                          // timestamp
            gateways[rewards[r].gateway],                  // device
            rewards[r].block,                              // block
            amount,                                        // reward
        ];
        processed.push(rArr);
        console.log(rArr)

        let rObj:RewardEntry = {
            timestamp: rewards[r].timestamp,
            minerHash: rewards[r].gateway,
            minerName: gateways[rewards[r].gateway],
            block: rewards[r].block,
            amount: amount,
            id: rewards[r].block,
        }
        processedObjects.push(rObj)
    }
    console.log(processed)
}