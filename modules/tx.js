import {Request} from "./request.js";
import {loadSpentGovTableData, loadTableData, loadValidatorsTableData} from "./utils.js";

export class Tx extends Request
{
    async getSpendGovProposals(){
        const proposals=await this.getGovProposals();
        const spentProposals = proposals.filter(proposal=>proposal.content['@type']==="/cosmos.distribution.v1beta1.CommunityPoolSpendProposal")
        const sortedSpentProposals = spentProposals.sort((a,b)=>parseInt(b.proposal_id,10)-parseInt(a.proposal_id,10))
        loadSpentGovTableData(sortedSpentProposals)
    }
    async getValidatorsTxs(){
        const validators=await this.getValidators();
        const validatorsDescription=validators.map((validator)=>({...validator.description,tokens:(parseInt(validator.tokens,10)/1000000)}));
        const validatorsSorted=validatorsDescription.sort((a,b)=>b.tokens-a.tokens)
        loadValidatorsTableData(validatorsSorted)
    }
    async getProposalTxs(){
        const proposals=await this.getProposals();
        const executedProposals=proposals.filter((proposal)=>proposal.status==="executed");
        const executedProposalsInfo=executedProposals.map((proposal)=>({description:proposal.description,title:proposal.title,bank:proposal.msgs.reduce((bank,current)=>({...current?.bank})??bank, null)}));
        const receivers = executedProposalsInfo.map(proposal=>proposal.bank.send.to_address);
        const uniqReceivers = [...new Set(receivers)];
        const amountAndAddrAndDescriptions= executedProposalsInfo.map(proposal=>({addr:proposal.bank.send.to_address,amount:(parseInt(proposal.bank.send.amount[0].amount,10)/1000000), title:proposal.title}));
        const amountPerAddr = uniqReceivers.map(addr=>({addr,amount:amountAndAddrAndDescriptions.reduce((totalAmount,currentAddr)=>totalAmount + (currentAddr.addr===addr?currentAddr.amount:0),0),titles:amountAndAddrAndDescriptions.reduce((concatTitles,current)=>(current.addr===addr?concatTitles.concat(current.title,"\n"):concatTitles),"")}));
        const sortedAddressByAmount=amountPerAddr.sort((a,b)=>b.amount-a.amount);
        loadTableData(sortedAddressByAmount);
    }
    async getTransferTxs(){
        const txs=await this.getTxs()
        const transferTxs=txs.filter(tx=>tx.logs[0]?.events.reduce((isTransfer,currentEvent)=>isTransfer||(currentEvent.type==="transfer"),false))
        // const totalAmount = transferTxs.reduce((totalAmount, currentTx)=>totalAmount + currentTx.logs[0].events.reduce((amount, currentEvent)=>currentEvent.type==="transfer"?currentEvent.attributes.reduce((amount,currentAttr)=> (currentAttr.key === "amount" && currentAttr.value!=="") ? (parseInt(currentAttr.value.replace("uluna", ""), 10) / 1000000) : amount,0):amount,0),0)
        // const bigTransferTxs=transferTxs.filter(tx=>tx.logs[0]?.events.reduce((isBigTransfer,currentEvent)=>isBigTransfer||(currentEvent.type==="transfer"?currentEvent.attributes.reduce((isBigTransfer,currentAttr)=>currentAttr.key==="amount"?((parseInt(currentAttr.value.replace("uluna",""),10)/1000000)>10000):isBigTransfer,false):false),false))
        const receivers = transferTxs.map(tx=>tx.logs[0].events.reduce((receiverAddr, currentEvent)=>currentEvent.type==="transfer"?currentEvent.attributes.reduce((receiverAddr,currentAttr)=>currentAttr.key==="recipient"?currentAttr.value:receiverAddr,null):receiverAddr,null),null)
        const uniqReceivers = [...new Set(receivers)];
        const amountAndAddr = transferTxs.map(tx=>({addr:tx.logs[0].events.reduce((receiverAddr,currentEvent)=>currentEvent.type==="transfer"?currentEvent.attributes.reduce((receiverAddr,currentAttr)=>currentAttr.key==="recipient"?currentAttr.value:receiverAddr,null):receiverAddr,null),amount:tx.logs[0].events.reduce((amount,currentEvent)=>currentEvent.type==="transfer"?currentEvent.attributes.reduce((amount,currentAttr)=>(currentAttr.key==="amount" && currentAttr.value!=="")?(parseInt(currentAttr.value.replace("uluna", ""), 10) / 1000000):amount,0):amount,0)}))
        const amountPerAddr = uniqReceivers.map(addr=>({addr,amount:amountAndAddr.reduce((totalAmount,currentAddr)=>totalAmount + (currentAddr.addr===addr?currentAddr.amount:0),0)}))
        const sortedAddressByAmount=amountPerAddr.sort((a,b)=>b.amount-a.amount)
        loadTableData(sortedAddressByAmount)
    }
    async getTxs()
    {
        this.method = 'GET';
        let txs;
        let nextUpdate;
        const currentDate=new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if(localStorage.getItem('nextUpdate')){
            nextUpdate = parseInt(localStorage.getItem('nextUpdate'),10);
        }else{
            nextUpdate = 0;
        }
        let keepGoing = (currentDate.getTime() >= nextUpdate) ;
        if(keepGoing===false && localStorage.getItem('txs')){
            txs=JSON.parse(localStorage.getItem('txs'));
        }else{
            txs=[];
        }
        let offset = 0;
        while (keepGoing) {
            let response = await this.send(`${this.getFcdBaseUrl()}/v1/txs?offset=${offset}&limit=100&account=terra1exqfh9ahyzm9g8z3ce57eyuxx72vem63utepjsf6stqtrztyz58spaf8ew`);
            let data = await response.json();
            txs.push.apply(txs, data.txs);
            offset = data.next;
            // this may need to be adjusted to your api to handle the corner case where the last page size equal to PAGE_SIZE
            // if the api either errors our the next call where the offset is greater than the amount of records or returns an empty array
            // the behavior will be fine.
            if (!data.next) {
                keepGoing = false;
                localStorage.setItem("nextUpdate",tomorrow.getTime().toString());
                localStorage.setItem("txs",JSON.stringify(txs));
            }
        }
        return txs;
    }
    async getProposals()
    {
        this.method = 'GET';
        let txs;
        let nextUpdate
        let keepGoing=true;
        const currentDate=new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if(localStorage.getItem('nextUpdate')){
            nextUpdate = parseInt(localStorage.getItem('nextUpdate'),10);
        }else{
            nextUpdate = 0;
        }
        if (localStorage.getItem('proposals')){
            keepGoing = (currentDate.getTime() >= nextUpdate) ;
        }
        if(keepGoing===false && localStorage.getItem('proposals')){
            txs=JSON.parse(localStorage.getItem('proposals'));
        }else{
            txs=[];
        }
        let offset = 0;
        while (keepGoing) {
            let base64Query = this.objectToBase64({
                "list_proposals":{"limit":(offset+30),"start_after":offset}
            })
            let response = await this.send(`${this.getLcdBaseUrl()}/cosmwasm/wasm/v1/contract/terra1exqfh9ahyzm9g8z3ce57eyuxx72vem63utepjsf6stqtrztyz58spaf8ew/smart/${base64Query}`);
            let data = await response.json();
            txs.push.apply(txs, data.data.proposals);
            offset += 30;
            // this may need to be adjusted to your api to handle the corner case where the last page size equal to PAGE_SIZE
            // if the api either errors our the next call where the offset is greater than the amount of records or returns an empty array
            // the behavior will be fine.
            if (data.data.proposals.length<30) {
                keepGoing = false;
                localStorage.setItem("nextUpdate",tomorrow.getTime().toString());
                localStorage.setItem("proposals",JSON.stringify(txs));
            }
        }
        return txs;
    }

    async getValidators()
    {
        this.method = 'GET';
        let validators;
        let nextUpdateValidators
        let keepGoing=true;
        const currentDate=new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if(localStorage.getItem('nextUpdateValidators')){
            nextUpdateValidators = parseInt(localStorage.getItem('nextUpdateValidators'),10);
        }else{
            nextUpdateValidators = 0;
        }
        if (localStorage.getItem('validators')){
            keepGoing = (currentDate.getTime() >= nextUpdateValidators) ;
        }
        if(keepGoing===false && localStorage.getItem('validators')){
            validators=JSON.parse(localStorage.getItem('validators'));
        }else{
            validators=[];
        }
        let keyString = '';
        while (keepGoing) {
            let response = await this.send(`${this.getLcdBaseUrl()}/cosmos/staking/v1beta1/validators?${keyString}pagination.limit=999`)
            let data = await response.json();
            validators.push.apply(validators, data.validators);
            let key=data?.pagination?.next_key
            keyString = key?`pagination.key=${key}&`:'';
            if (data.pagination?.next_key===null) {
                keepGoing = false;
                localStorage.setItem("nextUpdateValidators",tomorrow.getTime().toString());
                localStorage.setItem("validators",JSON.stringify(validators));
            }
        }
        return validators;
    }
    async getGovProposals()
    {
        this.method = 'GET';
        let govProposals;
        let nextUpdateGovProposals
        let keepGoing=true;
        const currentDate=new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if(localStorage.getItem('nextUpdateGovProposals')){
            nextUpdateGovProposals = parseInt(localStorage.getItem('nextUpdateGovProposals'),10);
        }else{
            nextUpdateGovProposals = 0;
        }
        if (localStorage.getItem('govProposals')){
            keepGoing = (currentDate.getTime() >= nextUpdateGovProposals) ;
        }
        if(keepGoing===false && localStorage.getItem('govProposals')){
            govProposals=JSON.parse(localStorage.getItem('govProposals'));
        }else{
            govProposals=[];
        }
        let keyString = '';
        while (keepGoing) {
            let response = await this.send(`${this.getLcdBaseUrl()}/cosmos/gov/v1beta1/proposals?${keyString}`)
            let data = await response.json();
            govProposals.push.apply(govProposals, data.proposals);
            let key=data?.pagination?.next_key
            keyString = key?`pagination.key=${key}`:'';
            if (data.pagination?.next_key===null) {
                keepGoing = false;
                localStorage.setItem("nextUpdateGovProposals",tomorrow.getTime().toString());
                localStorage.setItem("govProposals",JSON.stringify(govProposals));
            }
        }
        return govProposals;
    }

    objectToBase64(obj){
        return btoa(JSON.stringify(obj));
    }
    base64ToObject(base64){
        return JSON.parse(atob(base64));
    }

    getFcdBaseUrl()
    {
        return super.getFcdBaseUrl();
    }
    getLcdBaseUrl()
    {
        return super.getLcdBaseUrl();
    }
}