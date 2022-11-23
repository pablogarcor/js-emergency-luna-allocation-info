function numberWithCommas(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export function loadTableData(items) {
    const table = document.getElementById('table')
    const tableBody = document.getElementById("tableBody");
    const tbody = document.createElement('tbody');
    tbody.setAttribute('id','tableBody');
    items.forEach( item => {
        let row = tbody.insertRow();
        let addr = row.insertCell(0);
        addr.innerHTML = item.addr;
        let amount = row.insertCell(1);
        amount.innerHTML = numberWithCommas(item.amount);
        let title = row.insertCell(2);
        title.innerHTML = item.titles;
        title.style.whiteSpace = "pre-wrap";
    });
    table.replaceChild(tbody,tableBody);
}

export function loadValidatorsTableData(items) {
    const table = document.getElementById('validatorsTable')
    const tableBody = document.getElementById("validatorsTableBody");
    const tbody = document.createElement('tbody');
    tbody.setAttribute('id','validatosTableBody');
    items.forEach( item => {
        let row = tbody.insertRow();
        let addr = row.insertCell(0);
        addr.innerHTML = item.moniker;
        let amount = row.insertCell(1);
        amount.innerHTML = item.security_contact;
        let title = row.insertCell(2);
        title.innerHTML = numberWithCommas(item.tokens);
        title.style.whiteSpace = "pre-wrap";
    });
    table.replaceChild(tbody,tableBody);
}

export function loadSpentGovTableData(items) {
    const table = document.getElementById('govTable')
    const tableBody = document.getElementById("govTableBody");
    const tbody = document.createElement('tbody');
    tbody.setAttribute('id','govTableBody');
    items.forEach( item => {
        let row = tbody.insertRow();
        if(item.status==="PROPOSAL_STATUS_PASSED"){
            row.style.backgroundColor="rgba(0, 255, 0, 0.6)"
        }else if(item.status==="PROPOSAL_STATUS_REJECTED"){
            row.style.backgroundColor="rgba(255, 0, 0, 0.5)"
        }else{
            row.style.backgroundColor="rgba(255,165,0, 0.5)"
        }
        let addr = row.insertCell(0);
        addr.innerHTML = item.proposal_id;
        let amount = row.insertCell(1);
        amount.innerHTML = item.content.title;
        let title = row.insertCell(2);
        title.innerHTML = numberWithCommas((parseInt(item.content.amount[0].amount,10)/1000000));
        title.style.whiteSpace = "pre-wrap";
    });
    table.replaceChild(tbody,tableBody);
}