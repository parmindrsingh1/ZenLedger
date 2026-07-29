 "use strict";

/* ==========================
   Navigation
========================== */

const navButtons = document.querySelectorAll(".nav-item");
const toolSections = document.querySelectorAll(".tool-section");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(btn => btn.classList.remove("active-btn"));
        toolSections.forEach(sec => sec.classList.remove("active"));
        button.classList.add("active-btn");
        document.getElementById(button.dataset.target).classList.add("active");
    });
});

/* ==========================
   Helpers
========================== */

function formatCurrency(value){
    return new Intl.NumberFormat("en-IN",{
        style:"currency",
        currency:"INR",
        minimumFractionDigits:2
    }).format(value);
}

/* ==========================
   GST Calculator
========================== */

const gstAmountInput=document.getElementById("gst-amount");
const gstRate=document.getElementById("gst-rate");

document.getElementById("gst-calculate-btn")?.addEventListener("click",calculateGST);
document.getElementById("gst-clear-btn")?.addEventListener("click",clearGST);

function calculateGST(){

    const amount=Number(gstAmountInput.value);
    const rate=Number(gstRate.value);

    if(amount<=0 || isNaN(amount)){
        alert("Please enter a valid amount.");
        return;
    }

    const mode=document.querySelector('input[name="gst-mode"]:checked').value;
    const tax=document.querySelector('input[name="tax-type"]:checked').value;

    let base,gst,total;

    if(mode==="exclusive"){
        base=amount;
        gst=amount*rate/100;
        total=base+gst;
    }else{
        total=amount;
        base=amount/(1+rate/100);
        gst=total-base;
    }

    let cgst=0,sgst=0,igst=0;

    const cgstRow=document.getElementById("cgst-row");
    const sgstRow=document.getElementById("sgst-row");
    const igstRow=document.getElementById("igst-row");

    if(tax==="cgst"){
        cgst=gst/2;
        sgst=gst/2;
        cgstRow.classList.remove("hidden");
        sgstRow.classList.remove("hidden");
        igstRow.classList.add("hidden");
    }else{
        igst=gst;
        cgstRow.classList.add("hidden");
        sgstRow.classList.add("hidden");
        igstRow.classList.remove("hidden");
    }

    document.getElementById("base-amount").textContent=formatCurrency(base);
    document.getElementById("gst-amount-result").textContent=formatCurrency(gst);
    document.getElementById("cgst-result").textContent=formatCurrency(cgst);
    document.getElementById("sgst-result").textContent=formatCurrency(sgst);
    document.getElementById("igst-result").textContent=formatCurrency(igst);
    document.getElementById("final-amount").textContent=formatCurrency(total);
}

function clearGST(){
    gstAmountInput.value="";
    gstRate.value="18";
    document.querySelector('input[value="exclusive"]').checked=true;
    document.querySelector('input[value="cgst"]').checked=true;
    ["base-amount","gst-amount-result","cgst-result","sgst-result","igst-result","final-amount"].forEach(id=>{
        document.getElementById(id).textContent="₹0.00";
    });
    document.getElementById("cgst-row").classList.remove("hidden");
    document.getElementById("sgst-row").classList.remove("hidden");
    document.getElementById("igst-row").classList.add("hidden");
}

/* ==========================
   Income Tax Calculator
   FY 2025-26 (Basic New Regime)
========================== */

document.getElementById("income-tax-calculate-btn")?.addEventListener("click",calculateIncomeTax);
document.getElementById("income-tax-clear-btn")?.addEventListener("click",clearIncomeTax);

function calculateIncomeTax(){

    const gross=Number(document.getElementById("gross-income").value);

    if(gross<=0 || isNaN(gross)){
        alert("Please enter a valid income.");
        return;
    }

    const deduction=75000;
    const taxable=Math.max(0,gross-deduction);

    let tax=0;
    let income=taxable;

    const slabs=[
        [400000,0],
        [800000,0.05],
        [1200000,0.10],
        [1600000,0.15],
        [2000000,0.20],
        [2400000,0.25],
        [Infinity,0.30]
    ];

    let previous=0;

    for(const [limit,rate] of slabs){
        if(income>previous){
            const amount=Math.min(income,limit)-previous;
            if(amount>0) tax+=amount*rate;
            previous=limit;
        }
    }

    // Section 87A rebate (new regime): tax is nil for taxable income up to ₹12,00,000.
    // Marginal relief applies just above ₹12,00,000 so the extra tax never exceeds
    // the extra income over ₹12,00,000.
    let rebate = 0;

    if (taxable <= 1200000) {
        rebate = tax;
        tax = 0;
    } else {
        const excess = taxable - 1200000;
        if (tax > excess) {
            rebate = tax - excess;
            tax = excess;
        }
    }

    const cess=tax*0.04;
    const total=tax+cess;

    document.getElementById("gross-income-result").textContent=formatCurrency(gross);
    document.getElementById("standard-deduction-result").textContent=formatCurrency(deduction);
    document.getElementById("taxable-income-result").textContent=formatCurrency(taxable);
    document.getElementById("income-tax-result").textContent=formatCurrency(tax+rebate);
    document.getElementById("rebate-result").textContent=formatCurrency(rebate);
    document.getElementById("cess-result").textContent=formatCurrency(cess);
    document.getElementById("total-tax-result").textContent=formatCurrency(total);
}

function clearIncomeTax(){
    document.getElementById("gross-income").value="";
    ["gross-income-result","taxable-income-result","income-tax-result","rebate-result","cess-result","total-tax-result"].forEach(id=>{
        document.getElementById(id).textContent="₹0.00";
    });
    document.getElementById("standard-deduction-result").textContent=formatCurrency(75000);
}

/* ==========================
   Due Date Tracker
========================== */

const records=JSON.parse(localStorage.getItem("dueDates")||"[]");

document.getElementById("save-due-date")?.addEventListener("click",saveDueDate);
document.getElementById("clear-due-date")?.addEventListener("click",()=>{
    document.getElementById("compliance-type").selectedIndex=0;
    document.getElementById("due-date").value="";
    document.getElementById("remarks").value="";
});

function saveDueDate(){
    const date=document.getElementById("due-date").value;
    if(!date){ alert("Please select a due date."); return; }

    records.push({
        type:document.getElementById("compliance-type").value,
        date,
        remarks:document.getElementById("remarks").value.trim()
    });

    localStorage.setItem("dueDates",JSON.stringify(records));
    renderDueDates();
    document.getElementById("clear-due-date").click();
}

function renderDueDates(){
    const list=document.getElementById("due-date-list");
    const total=document.getElementById("total-records");
    total.textContent=records.length;

    if(records.length===0){
        list.innerHTML='<p class="empty-message">No due dates added.</p>';
        return;
    }

    list.innerHTML="";

    records.forEach((r,i)=>{
        const card=document.createElement("div");
        card.className="result-box";
        card.innerHTML=`
        <div class="result-row">
            <strong>${r.type}</strong>
            <button class="secondary-btn" data-i="${i}">Delete</button>
        </div>
        <div class="result-row"><span>Due Date</span><strong>${r.date}</strong></div>
        <div class="result-row"><span>Remarks</span><strong>${r.remarks||"-"}</strong></div>`;
        list.appendChild(card);
    });

    list.querySelectorAll("button").forEach(btn=>{
        btn.onclick=()=>{
            records.splice(btn.dataset.i,1);
            localStorage.setItem("dueDates",JSON.stringify(records));
            renderDueDates();
        };
    });
}

window.addEventListener("load",()=>{
    document.getElementById("igst-row")?.classList.add("hidden");
    renderDueDates();
});



/* ==========================
   TDS Calculator
========================== */

const tdsCalculateBtn = document.getElementById("tds-calculate-btn");
const tdsClearBtn = document.getElementById("tds-clear-btn");

tdsCalculateBtn?.addEventListener("click", calculateTDS);
tdsClearBtn?.addEventListener("click", clearTDS);

function calculateTDS(){

    const amount = Number(document.getElementById("payment-amount").value);
    const section = document.getElementById("tds-section").value;
    const deductee = document.getElementById("deductee-type").value;
    const pan = document.querySelector('input[name="pan-status"]:checked').value;

    if(amount <= 0 || isNaN(amount)){
        alert("Please enter a valid payment amount.");
        return;
    }

    // Salary (Section 192) is deducted as per applicable income tax slab,
    // not a flat percentage — so we show a message instead of a wrong flat number.
    if (section === "192") {
        document.getElementById("tds-rate-result").textContent = "As per Slab";
        document.getElementById("tds-amount-result").textContent = "Use Income Tax tab";
        document.getElementById("net-payment-result").textContent = "—";
        return;
    }

    const isTCS = (section === "206C" || section === "206C1F");

    let rate = 0;

    switch(section){
        case "194A":
            rate = 10;
            break;
        case "194C":
            rate = deductee === "individual" ? 1 : 2;
            break;
        case "194H":
            rate = 2;
            break;
        case "194I":
            rate = 2;
            break;
        case "194IB":
            rate = 10;
            break;
        case "194IA":
            rate = 1;
            break;
        case "194J-tech":
            rate = 2;
            break;
        case "194J-prof":
            rate = 10;
            break;
        case "194Q":
            rate = 0.1;
            break;
        case "194R":
            rate = 10;
            break;
        case "194T":
            rate = 10;
            break;
        case "206C":
            rate = 2;
            break;
        case "206C1F":
            rate = 1;
            break;
        default:
            rate = 0;
    }

    if (pan === "no") {
        // Higher rate without PAN: TDS sections use 20% (Sec 206AA),
        // TCS sections use the higher of twice the rate or 5% (Sec 206CC)
        rate = isTCS ? Math.max(rate * 2, 5) : 20;
    }

    const tds = amount * rate / 100;
    const net = amount - tds;

    document.getElementById("tds-rate-result").textContent = rate + "%";
    document.getElementById("tds-amount-result").textContent = formatCurrency(tds);
    document.getElementById("net-payment-result").textContent = formatCurrency(net);
}

function clearTDS(){
    document.getElementById("deductee-type").selectedIndex = 0;
    document.getElementById("tds-section").selectedIndex = 0;
    document.getElementById("payment-amount").value = "";
    document.querySelector('input[name="pan-status"][value="yes"]').checked = true;
    document.getElementById("tds-rate-result").textContent = "0%";
    document.getElementById("tds-amount-result").textContent = "₹0.00";
    document.getElementById("net-payment-result").textContent = "₹0.00";
}

/* =====================================================
   Client Manager
===================================================== */

const CLIENT_STORAGE_KEY = "caToolsClients";

let clients = JSON.parse(
    localStorage.getItem(CLIENT_STORAGE_KEY)
) || [];

let editIndex = -1;


/* ---------- Elements ---------- */

const clientSearch = document.getElementById("client-search");

const clientName = document.getElementById("client-name");
const firmName = document.getElementById("firm-name");
const gstin = document.getElementById("gstin");
const pan = document.getElementById("pan");
const mobile = document.getElementById("mobile");
const email = document.getElementById("email");
const address = document.getElementById("address");

const saveClientBtn = document.getElementById("save-client-btn");
const clearClientBtn = document.getElementById("clear-client-btn");

const clientList = document.getElementById("client-list");
const clientCount = document.getElementById("client-count");


/* ---------- Events ---------- */

saveClientBtn?.addEventListener("click", saveClient);

clearClientBtn?.addEventListener("click", clearClientForm);

clientSearch?.addEventListener("input", renderClients);

const exportJsonBtn = document.getElementById("export-clients-btn");
const exportCsvBtn = document.getElementById("export-csv-btn");
const exportExcelBtn = document.getElementById("export-excel-btn");
const importJsonBtn = document.getElementById("import-json-btn");
const importJsonFile = document.getElementById("import-json-file");

exportJsonBtn?.addEventListener("click", exportClientsJSON);
exportCsvBtn?.addEventListener("click", exportClientsCSV);
exportExcelBtn?.addEventListener("click", exportClientsExcel);

importJsonBtn?.addEventListener("click", () => {
    importJsonFile.click();
});

importJsonFile?.addEventListener("change", importClientsJSON);

/* =====================================================
   Live Validation — Client Name (required)
===================================================== */

function validateClientName() {
    const nameError = document.getElementById("client-name-error");
    if (clientName.value.trim() === "") {
        clientName.classList.add("invalid");
        nameError.classList.add("show-error");
        return false;
    } else {
        clientName.classList.remove("invalid");
        nameError.classList.remove("show-error");
        return true;
    }
}

clientName?.addEventListener("input", validateClientName);
clientName?.addEventListener("blur", validateClientName);


/* =====================================================
   Live Validation — GSTIN (required, format checked)
===================================================== */

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function validateGSTIN() {
    const gstinError = document.getElementById("gstin-error");
    const value = gstin.value.trim().toUpperCase();
    if (!GSTIN_REGEX.test(value)) {
        gstin.classList.add("invalid");
        gstinError.classList.add("show-error");
        return false;
    } else {
        gstin.classList.remove("invalid");
        gstinError.classList.remove("show-error");
        return true;
    }
}

gstin?.addEventListener("input", validateGSTIN);
gstin?.addEventListener("blur", validateGSTIN);


/* =====================================================
   Live Validation — PAN (required, format checked)
===================================================== */

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function validatePAN() {
    const panError = document.getElementById("pan-error");
    const value = pan.value.trim().toUpperCase();
    if (!PAN_REGEX.test(value)) {
        pan.classList.add("invalid");
        panError.classList.add("show-error");
        return false;
    } else {
        pan.classList.remove("invalid");
        panError.classList.remove("show-error");
        return true;
    }
}

pan?.addEventListener("input", validatePAN);
pan?.addEventListener("blur", validatePAN);


/* =====================================================
   Live Validation — Mobile Number (required, format checked)
===================================================== */

const MOBILE_REGEX = /^[6-9][0-9]{9}$/;

function validateMobile() {
    const mobileError = document.getElementById("mobile-error");
    const value = mobile.value.trim();
    if (!MOBILE_REGEX.test(value)) {
        mobile.classList.add("invalid");
        mobileError.classList.add("show-error");
        return false;
    } else {
        mobile.classList.remove("invalid");
        mobileError.classList.remove("show-error");
        return true;
    }
}

mobile?.addEventListener("input", validateMobile);
mobile?.addEventListener("blur", validateMobile);


/* =====================================================
   Save Client
===================================================== */

function saveClient() {

    const isNameValid = validateClientName();
    const isGstinValid = validateGSTIN();
    const isPanValid = validatePAN();
    const isMobileValid = validateMobile();

    if (!isNameValid || !isGstinValid || !isPanValid || !isMobileValid) {

        if (!isNameValid) clientName.focus();
        else if (!isGstinValid) gstin.focus();
        else if (!isPanValid) pan.focus();
        else mobile.focus();

        return;

    }

// Check duplicate GSTIN
const duplicateGSTIN = clients.find((c, index) =>
    c.gstin.toUpperCase() === gstin.value.trim().toUpperCase() &&
    index !== editIndex
);

if (duplicateGSTIN) {
    alert("GSTIN already exists.");
    gstin.focus();
    return;
}

// Check duplicate PAN
const duplicatePAN = clients.find((c, index) =>
    c.pan.toUpperCase() === pan.value.trim().toUpperCase() &&
    index !== editIndex
);

if (duplicatePAN) {
    alert("PAN already exists.");
    pan.focus();
    return;
}



    const client = {

        name: clientName.value.trim(),

        firm: firmName.value.trim(),

        gstin: gstin.value.trim(),

        pan: pan.value.trim(),

        mobile: mobile.value.trim(),

        email: email.value.trim(),

        address: address.value.trim()

    };


    if (editIndex === -1) {

        clients.push(client);

    }

    else {

        clients[editIndex] = client;

        editIndex = -1;

    }


    localStorage.setItem(

        CLIENT_STORAGE_KEY,

        JSON.stringify(clients)

    );

    clearClientForm();

    renderClients();

}

/* =====================================================
   Render Clients
===================================================== */

function renderClients() {

    if (!clientList) return;

    const keyword = clientSearch.value.toLowerCase();

    clientList.innerHTML = "";

    const filteredClients = clients.filter(client => {

        return (

            client.name.toLowerCase().includes(keyword) ||

            client.firm.toLowerCase().includes(keyword) ||

            client.gstin.toLowerCase().includes(keyword) ||

            client.pan.toLowerCase().includes(keyword)

        );

    });


    clientCount.textContent = filteredClients.length;


    if (filteredClients.length === 0) {

        clientList.innerHTML =

            `<p class="empty-message">
                No clients found.
            </p>`;

        return;

    }


    filteredClients.forEach(client => {

        const index = clients.indexOf(client);

        const card = document.createElement("div");

        card.className = "client-card";

        card.innerHTML = `

            <h3>${client.name}</h3>

            <div class="client-meta">

                <p><strong>Firm:</strong> ${client.firm || "-"}</p>

                <p><strong>GSTIN:</strong> ${client.gstin || "-"}</p>

                <p><strong>PAN:</strong> ${client.pan || "-"}</p>

                <p><strong>Mobile:</strong> ${client.mobile || "-"}</p>

                <p><strong>Email:</strong> ${client.email || "-"}</p>

                <p><strong>Address:</strong> ${client.address || "-"}</p>

            </div>

            <div class="client-actions">

                <button
                    class="primary-btn edit-client"
                    data-index="${index}"
                >
                    Edit
                </button>

                <button
                    class="secondary-btn delete-client"
                    data-index="${index}"
                >
                    Delete
                </button>

            </div>

        `;

        clientList.appendChild(card);

    });


    attachClientButtons();

}


/* =====================================================
   Edit / Delete Buttons
===================================================== */

function attachClientButtons() {

    document.querySelectorAll(".edit-client")

        .forEach(button => {

            button.addEventListener("click", () => {

                editClient(

                    Number(button.dataset.index)

                );

            });

        });


    document.querySelectorAll(".delete-client")

        .forEach(button => {

            button.addEventListener("click", () => {

                deleteClient(

                    Number(button.dataset.index)

                );

            });

        });

}


/* =====================================================
   Edit Client
===================================================== */

function editClient(index) {

    const client = clients[index];

    editIndex = index;

    clientName.value = client.name;

    firmName.value = client.firm;

    gstin.value = client.gstin;

    pan.value = client.pan;

    mobile.value = client.mobile;

    email.value = client.email;

    address.value = client.address;

    clientName.focus();

}


/* =====================================================
   Delete Client
===================================================== */

function deleteClient(index) {

    if (!confirm("Delete this client?")) return;

    clients.splice(index, 1);

    localStorage.setItem(

        CLIENT_STORAGE_KEY,

        JSON.stringify(clients)

    );

    renderClients();

}


/* =====================================================
   Clear Form
===================================================== */

function clearClientForm() {

    editIndex = -1;

    clientName.value = "";

    clientName.classList.remove("invalid");

    document.getElementById("client-name-error").classList.remove("show-error");

    firmName.value = "";

    gstin.value = "";

    gstin.classList.remove("invalid");

    document.getElementById("gstin-error").classList.remove("show-error");

    pan.value = "";

    pan.classList.remove("invalid");

    document.getElementById("pan-error").classList.remove("show-error");

    mobile.value = "";

    mobile.classList.remove("invalid");

    document.getElementById("mobile-error").classList.remove("show-error");

    email.value = "";

    address.value = "";

    clientName.focus();

}


/* =====================================================
   Initial Load
===================================================== */

renderClients();

/* ---------- Export Clients ---------- */

function exportClientsJSON() {

    if (clients.length === 0) {
        alert("No clients available to export.");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(clients, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        `ZenLedger_Clients_${new Date().toISOString().split("T")[0]}.json`;

    link.click();

    URL.revokeObjectURL(url);
}

/* ----------Export CSV---------- */

function exportClientsCSV() {

    if (clients.length === 0) {
        alert("No clients available to export.");
        return;
    }

    const headers = [
        "Client Name",
        "Firm Name",
        "GSTIN",
        "PAN",
        "Mobile",
        "Email",
        "Address"
    ];

    const rows = clients.map(client => [
        client.name,
        client.firm,
        client.gstin,
        client.pan,
        client.mobile,
        client.email,
        client.address
    ]);

    const csvContent = [
        headers,
        ...rows
    ]
    .map(row =>
        row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `ZenLedger_Clients_${new Date().toISOString().split("T")[0]}.csv`;

    link.click();

    URL.revokeObjectURL(url);
}

/* ----------Export Excel---------- */

function exportClientsExcel() {

    if (clients.length === 0) {
        alert("No clients available to export.");
        return;
    }

    const data = clients.map(client => ({
        "Client Name": client.name,
        "Firm Name": client.firm,
        "GSTIN": client.gstin,
        "PAN": client.pan,
        "Mobile": client.mobile,
        "Email": client.email,
        "Address": client.address
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Clients"
    );

    XLSX.writeFile(
        workbook,
        `ZenLedger_Clients_${new Date().toISOString().split("T")[0]}.xlsx`
    );
}

/* ----------Export JSON---------- */

function importClientsJSON(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        try {

            const importedClients = JSON.parse(e.target.result);

            if (!Array.isArray(importedClients)) {
                alert("Invalid JSON file.");
                return;
            }

            let imported = 0;
            let skipped = 0;
            let invalid = 0;

            importedClients.forEach(client => {

                if (
                    !client.name ||
                    !client.gstin ||
                    !client.pan ||
                    !client.mobile
                ) {
                    invalid++;
                    return;
                }

                const duplicate = clients.some(existing =>
                    existing.gstin.toUpperCase() === client.gstin.toUpperCase() ||
                    existing.pan.toUpperCase() === client.pan.toUpperCase()
                );

                if (duplicate) {
                    skipped++;
                    return;
                }

                clients.push({
                    name: client.name,
                    firm: client.firm || "",
                    gstin: client.gstin,
                    pan: client.pan,
                    mobile: client.mobile,
                    email: client.email || "",
                    address: client.address || ""
                });

                imported++;

            });

            localStorage.setItem(
                CLIENT_STORAGE_KEY,
                JSON.stringify(clients)
            );

            renderClients();

            alert(
                `Import Complete\n\nImported: ${imported}\nSkipped: ${skipped}\nInvalid: ${invalid}`
            );

        } catch {

            alert("Invalid JSON file.");

        }

        event.target.value = "";

    };

    reader.readAsText(file);

}

/* ----------Service Worker---------- */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("Service Worker registered successfully.");
            })
            .catch(error => {
                console.error("Service Worker registration failed:", error);
            });
    });
}
