/*  =====================================================================
    HISAAB KITAAB — Google Sheets backend (Google Apps Script)
    ---------------------------------------------------------------------
    This is the FREE, shared online database + the email reminder engine.
    Follow SETUP.md to install. No login, no server cost.
    ===================================================================== */

const SHEET_NAME = "Ledger";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate_(s){
  if(!s) return "";
  const d = new Date(s);
  if(isNaN(d.getTime())) return String(s);
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

// The columns we keep in the sheet, in order.
const HEADERS = ["id","date","type","name","amount","qty","note","dueDate","phone","paid","synced"];

/* ---------- helpers ---------- */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1,1,1,HEADERS.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================================
   WRITE — called by the app when an entry is added or marked paid
   Returns SELF-CORRECTING error messages with examples on bad data.
   ===================================================================== */
function doPost(e) {
  try {
    if (!e) {
      return jsonOut_({ ok:false,
        error:"No data received.",
        fix:"The app sent an empty request. Re-open the app and try saving again." });
    }

    // Accept payload either as raw JSON body OR as a form param "payload".
    // The form-param path avoids CORS preflight and works reliably from browsers.
    let raw = "";
    if (e.parameter && e.parameter.payload) {
      raw = e.parameter.payload;
    } else if (e.postData && e.postData.contents) {
      raw = e.postData.contents;
    }
    if (!raw) {
      return jsonOut_({ ok:false,
        error:"No data received.",
        fix:"The app sent an empty request. Re-open the app and try saving again." });
    }

    let body;
    try { body = JSON.parse(raw); }
    catch (parseErr) {
      return jsonOut_({ ok:false,
        error:"Data was not valid JSON.",
        fix:'Expected something like {"action":"add","entry":{...}}. Got: '
            + String(raw).slice(0,80) });
    }

    const entry = body.entry || {};

    // --- self-correcting field validation ---
    if (!entry.id) {
      return jsonOut_({ ok:false, error:"Missing entry id.",
        fix:'Each entry needs an id, e.g. "1718800000000-ab12c". The app sets this automatically.' });
    }
    if (!entry.name || String(entry.name).trim() === "") {
      return jsonOut_({ ok:false, error:"Name is empty.",
        fix:'Type a name such as "Ali Traders" before saving.' });
    }
    const amt = Number(entry.amount);
    if (entry.amount === "" || isNaN(amt)) {
      return jsonOut_({ ok:false, error:"Amount is not a number.",
        fix:'You sent "' + entry.amount + '". Use digits only, e.g. 1500 (no commas or "Rs").' });
    }
    const okTypes = ["in","out","stock","owe"];
    if (okTypes.indexOf(entry.type) === -1) {
      return jsonOut_({ ok:false, error:"Unknown entry type.",
        fix:'Type must be one of in / out / stock / owe. Got "' + entry.type + '".' });
    }
    if (entry.dueDate && isNaN(new Date(entry.dueDate).getTime())) {
      return jsonOut_({ ok:false, error:"Pay-back date is not a real date.",
        fix:'Use the date picker. Format YYYY-MM-DD, e.g. 2026-07-01. Got "' + entry.dueDate + '".' });
    }

    const sh = getSheet_();
    const lastRow = sh.getLastRow();
    // Only read existing IDs if there is at least one data row (row 2+).
    // getRange with 0 rows throws "number of rows must be at least 1".
    const ids = lastRow >= 2
      ? sh.getRange(2, 1, lastRow - 1, 1).getValues().flat()
      : [];
    const rowIndex = ids.indexOf(entry.id); // 0-based within data rows

    const rowData = HEADERS.map(h => {
      if (h === "amount") return amt;
      if (h === "paid")   return entry.paid ? "YES" : "NO";
      if (h === "synced") return "YES";
      return entry[h] !== undefined ? entry[h] : "";
    });

    if (body.action === "update" && rowIndex !== -1) {
      sh.getRange(rowIndex + 2, 1, 1, HEADERS.length).setValues([rowData]);
      return jsonOut_({ ok:true, action:"updated", id:entry.id });
    }
    if (rowIndex !== -1) {
      // already exists -> overwrite (idempotent, prevents duplicates on retry)
      sh.getRange(rowIndex + 2, 1, 1, HEADERS.length).setValues([rowData]);
      return jsonOut_({ ok:true, action:"existed", id:entry.id });
    }
    sh.appendRow(rowData);
    return jsonOut_({ ok:true, action:"added", id:entry.id });

  } catch (err) {
    return jsonOut_({ ok:false, error:"Server error: " + err.message,
      fix:"This is usually temporary. The app keeps your entry saved on the phone and will retry automatically." });
  }
}

/* =====================================================================
   READ — optional, lets the app pull the shared ledger
   GET <url>?action=list
   ===================================================================== */
function doGet(e) {
  try {
    const sh = getSheet_();
    const last = sh.getLastRow();
    if (last < 2) return jsonOut_({ ok:true, entries: [] });
    const values = sh.getRange(2,1,last-1,HEADERS.length).getValues();
    const entries = values.map(r => {
      const o = {};
      HEADERS.forEach((h,i)=> o[h] = r[i]);
      o.amount = Number(o.amount) || 0;
      o.paid = (String(o.paid).toUpperCase() === "YES");
      return o;
    });
    return jsonOut_({ ok:true, entries });
  } catch (err) {
    return jsonOut_({ ok:false, error:err.message,
      fix:"Make sure the sheet tab is named 'Ledger'." });
  }
}

/* =====================================================================
   REMINDER ENGINE — runs once a day, emails YOU the due/overdue list.
   Set up a daily time-trigger on this function (see SETUP.md).
   FREE: uses Gmail send quota built into your Google account.
   ===================================================================== */
function sendDailyReminders() {
  const sh = getSheet_();
  const last = sh.getLastRow();
  if (last < 2) return;

  const rows = sh.getRange(2,1,last-1,HEADERS.length).getValues();
  const today = new Date(); today.setHours(0,0,0,0);

  const overdue = [], soon = [];
  rows.forEach(r => {
    const o = {}; HEADERS.forEach((h,i)=> o[h]=r[i]);
    if (o.type !== "owe") return;
    if (String(o.paid).toUpperCase() === "YES") return;
    if (!o.dueDate) return;
    const due = new Date(o.dueDate); if (isNaN(due.getTime())) return;
    due.setHours(0,0,0,0);
    const days = Math.round((due - today) / 86400000);
    const line = `• ${o.name} — Rs ${Number(o.amount).toLocaleString()}`
               + (o.phone ? ` (${o.phone})` : "")
               + ` — due ${fmtDate_(o.dueDate)}`;
    if (days < 0) overdue.push(`${line}  [${Math.abs(days)} days late]`);
    else if (days <= 3) soon.push(`${line}  [in ${days} day(s)]`);
  });

  if (!overdue.length && !soon.length) return; // nothing to send

  let msg = "Ahmed here — payments to collect (Lekha)\n\n";
  if (overdue.length) msg += "OVERDUE:\n" + overdue.join("\n") + "\n\n";
  if (soon.length)    msg += "DUE SOON:\n" + soon.join("\n") + "\n";

  const me = Session.getActiveUser().getEmail();
  MailApp.sendEmail(me, "🔔 Ahmed: Payments due — Lekha", msg);
}

/* Run this ONCE manually to create the daily 8am trigger. */
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "sendDailyReminders") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("sendDailyReminders")
    .timeBased().everyDays(1).atHour(8).create();
}
