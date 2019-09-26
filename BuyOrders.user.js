// ==UserScript==
// @name         BuyOrders
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Steam market - show amount of highest buy order for faster selling
// @author       steamcommunity.com/id/sudo_q
// @match        https://steamcommunity.com/id/*/inventory*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

function parseNameid(data) {
    //console.log(data.responseText);
    self.nameid = data.responseText.match(/Market_LoadOrderSpread\( (\d+)/)[1];
    self.itemUrl = "https://steamcommunity.com/market/itemordershistogram?country=US&language=english&currency=1&item_nameid="+self.nameid+"&two_factor=0";
    GM_xmlhttpRequest ({
        method:         "GET",
        url:            self.itemUrl,
        responseType:   "json",
        onload:         processJSON_Response,
        onabort:        reportAJAX_Error,
        onerror:        reportAJAX_Error,
        ontimeout:      reportAJAX_Error
    });
};

function fetchPrice () {
    var imainElem = document.getElementById("iteminfo0");
    var ialtElem = document.getElementById("iteminfo1");
    var linkElem = {};
    if (imainElem.style.display == "none")
    {
        linkElem = document.getElementById("iteminfo1_item_market_actions");
    }
    else
    {
        linkElem = document.getElementById("iteminfo0_item_market_actions");
    }
    var hashUrl = linkElem.children[0].children[0].children[0].href;
    if (hashUrl == lastItem)
    {
        setTimeout(fetchPrice, 500);
    }
    else
    {
        lastItem = hashUrl;
        //console.log("Fetching " + hashUrl);
        GM_xmlhttpRequest ( {
            method:         "GET",
            url:            hashUrl,
            responseType:   "html",
            onload:         parseNameid,
            onabort:        reportAJAX_Error,
            onerror:        reportAJAX_Error,
            ontimeout:      reportAJAX_Error
        } );
    }
}

function processJSON_Response (rspObj) {
    if (rspObj.status != 200 && rspObj.status != 304) {
        reportAJAX_Error (rspObj);
        return;
    }
    //-- The payload from the API will be in rspObj.response.
    var pyLd = rspObj.response;
    var highestBuyOrder = pyLd.highest_buy_order;
    var mainElem = document.getElementById("iteminfo0");
    var altElem = document.getElementById("iteminfo1");
    var modElem = {};
    if (mainElem.style.display == "none")
    {
        modElem = document.getElementById("iteminfo1_item_market_actions");
    }
    else
    {
        modElem = document.getElementById("iteminfo0_item_market_actions");
    }
    highestBuyOrder = highestBuyOrder / 100;
    highestBuyOrder = highestBuyOrder.toLocaleString("en-US", {style:"currency", currency:"USD"});
    var brElem = document.createElement("br");
    modElem.children[0].children[1].append("Sell for: "+highestBuyOrder);
    modElem.children[0].children[1].appendChild(brElem);
    disableObserver = false;
    //console.log("Enabled observer");
}

function reportAJAX_Error (rspObj) {
    console.error (`TM scrpt => Error ${rspObj.status}!  ${rspObj.statusText}`);
}

var itemUrl = "";
var lastItem = "";
var targetNode = document.getElementsByClassName("item_market_actions")[0];
var targetNodeAlt = document.getElementsByClassName("item_market_actions")[1];
var config = { characterData: true, childList: true }; // Options for the observer (which mutations to observe)

// Create an observer instance linked to the callback function
var disableObserver = false;
var observer = new MutationObserver(function(mutationsList) {
    if (!disableObserver)
    {
        disableObserver = true;
        //console.log("Disabled observer");
        fetchPrice();
    }
});

// Start observing the target node for configured mutations
observer.observe(targetNodeAlt, config);
observer.observe(targetNode, config);
