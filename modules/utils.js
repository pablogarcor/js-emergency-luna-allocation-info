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